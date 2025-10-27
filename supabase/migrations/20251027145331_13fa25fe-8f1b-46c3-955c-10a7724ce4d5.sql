-- Add search_path to remaining functions for security best practices

-- 1. get_child_customers
CREATE OR REPLACE FUNCTION public.get_child_customers(_parent_customer_id uuid)
 RETURNS TABLE(customer_id uuid, level integer, customer_name text, customer_type customer_type)
 LANGUAGE sql
 STABLE
 SET search_path = public
AS $function$
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
$function$;

-- 2. get_customer_hierarchy
CREATE OR REPLACE FUNCTION public.get_customer_hierarchy(_customer_id uuid)
 RETURNS TABLE(customer_id uuid, level integer, path uuid[])
 LANGUAGE sql
 STABLE
 SET search_path = public
AS $function$
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
$function$;

-- 3. sanitize_text_array
CREATE OR REPLACE FUNCTION public.sanitize_text_array(input text[])
 RETURNS text[]
 LANGUAGE sql
 STABLE
 SET search_path = public
AS $function$
  SELECT CASE WHEN $1 IS NULL THEN NULL ELSE ARRAY(
    SELECT SUBSTRING(strip_control_chars(x) FOR 200)
    FROM unnest($1) AS x
  ) END
$function$;

-- 4. strip_control_chars
CREATE OR REPLACE FUNCTION public.strip_control_chars(input text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path = public
AS $function$
  SELECT regexp_replace(COALESCE(input, ''), '[\x00-\x1F\x7F]+', '', 'g');
$function$;

-- 5. update_agent_updated_at
CREATE OR REPLACE FUNCTION public.update_agent_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 6. update_data_product_timestamp
CREATE OR REPLACE FUNCTION public.update_data_product_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  NEW.last_updated = now();
  RETURN NEW;
END;
$function$;

-- 7. update_updated_at_column - this is referenced by search_path so needs special handling
-- First check if it exists, then recreate it
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;