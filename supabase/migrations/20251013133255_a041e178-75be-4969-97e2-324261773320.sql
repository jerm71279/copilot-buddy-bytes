-- Create customer type enum
CREATE TYPE customer_type AS ENUM ('msp', 'client', 'standalone');

-- Add hierarchical fields to customers table
ALTER TABLE customers 
ADD COLUMN parent_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
ADD COLUMN customer_type customer_type NOT NULL DEFAULT 'standalone',
ADD COLUMN inherit_compliance BOOLEAN DEFAULT true;

-- Create index for hierarchical queries
CREATE INDEX idx_customers_parent ON customers(parent_customer_id);

-- Add inheritance tracking to compliance_frameworks
ALTER TABLE compliance_frameworks
ADD COLUMN inherited_from_parent BOOLEAN DEFAULT false,
ADD COLUMN parent_framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE CASCADE;

-- Add inheritance tracking to compliance_controls  
ALTER TABLE compliance_controls
ADD COLUMN inherited_from_parent BOOLEAN DEFAULT false,
ADD COLUMN parent_control_id UUID REFERENCES compliance_controls(id) ON DELETE CASCADE;

-- Function to get customer hierarchy path
CREATE OR REPLACE FUNCTION get_customer_hierarchy(_customer_id UUID)
RETURNS TABLE(customer_id UUID, level INTEGER, path UUID[])
LANGUAGE SQL
STABLE
AS $$
  WITH RECURSIVE hierarchy AS (
    -- Base case: the customer itself
    SELECT 
      id as customer_id,
      0 as level,
      ARRAY[id] as path
    FROM customers
    WHERE id = _customer_id
    
    UNION ALL
    
    -- Recursive case: parent customers
    SELECT 
      c.id,
      h.level + 1,
      h.path || c.id
    FROM customers c
    JOIN hierarchy h ON c.id = h.customer_id
    WHERE c.parent_customer_id IS NOT NULL
      AND c.parent_customer_id = (
        SELECT parent_customer_id 
        FROM customers 
        WHERE id = h.customer_id
      )
  )
  SELECT * FROM hierarchy ORDER BY level;
$$;

-- Function to get all child customers (for MSPs)
CREATE OR REPLACE FUNCTION get_child_customers(_parent_customer_id UUID)
RETURNS TABLE(customer_id UUID, level INTEGER, customer_name TEXT, customer_type customer_type)
LANGUAGE SQL
STABLE
AS $$
  WITH RECURSIVE children AS (
    -- Base case: direct children
    SELECT 
      id as customer_id,
      1 as level,
      company_name as customer_name,
      customer_type
    FROM customers
    WHERE parent_customer_id = _parent_customer_id
    
    UNION ALL
    
    -- Recursive case: children of children
    SELECT 
      c.id,
      ch.level + 1,
      c.company_name,
      c.customer_type
    FROM customers c
    JOIN children ch ON c.parent_customer_id = ch.customer_id
  )
  SELECT * FROM children ORDER BY level, customer_name;
$$;

-- Function to cascade compliance frameworks from parent to children
CREATE OR REPLACE FUNCTION cascade_framework_to_children(_framework_id UUID, _parent_customer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  child_record RECORD;
  parent_framework RECORD;
  new_framework_id UUID;
BEGIN
  -- Get parent framework details
  SELECT * INTO parent_framework
  FROM compliance_frameworks
  WHERE id = _framework_id;
  
  -- Loop through all children who inherit compliance
  FOR child_record IN 
    SELECT customer_id 
    FROM get_child_customers(_parent_customer_id)
    WHERE customer_id IN (
      SELECT id FROM customers WHERE inherit_compliance = true
    )
  LOOP
    -- Check if child already has this framework
    IF NOT EXISTS (
      SELECT 1 FROM compliance_frameworks
      WHERE customer_id = child_record.customer_id
        AND framework_name = parent_framework.framework_name
    ) THEN
      -- Create inherited framework for child
      INSERT INTO compliance_frameworks (
        customer_id,
        framework_name,
        version,
        description,
        is_active,
        inherited_from_parent,
        parent_framework_id
      ) VALUES (
        child_record.customer_id,
        parent_framework.framework_name,
        parent_framework.version,
        parent_framework.description,
        parent_framework.is_active,
        true,
        _framework_id
      )
      RETURNING id INTO new_framework_id;
      
      -- Cascade controls for this framework
      INSERT INTO compliance_controls (
        framework_id,
        customer_id,
        control_id,
        control_name,
        description,
        category,
        implementation_status,
        inherited_from_parent,
        parent_control_id
      )
      SELECT
        new_framework_id,
        child_record.customer_id,
        cc.control_id,
        cc.control_name,
        cc.description,
        cc.category,
        'not_started',
        true,
        cc.id
      FROM compliance_controls cc
      WHERE cc.framework_id = _framework_id;
    END IF;
  END LOOP;
END;
$$;

-- Trigger to auto-cascade frameworks when added to MSP
CREATE OR REPLACE FUNCTION trigger_cascade_framework()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only cascade if this is an MSP customer and framework is active
  IF EXISTS (
    SELECT 1 FROM customers 
    WHERE id = NEW.customer_id 
      AND customer_type = 'msp'
  ) AND NEW.is_active = true THEN
    PERFORM cascade_framework_to_children(NEW.id, NEW.customer_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER cascade_framework_after_insert
AFTER INSERT ON compliance_frameworks
FOR EACH ROW
EXECUTE FUNCTION trigger_cascade_framework();