-- Add search_path protection to all SECURITY DEFINER functions that are missing it
-- This prevents search path injection attacks

-- Fix calculate_risk_score function
CREATE OR REPLACE FUNCTION public.calculate_risk_score(likelihood risk_likelihood, impact risk_impact)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  likelihood_value INTEGER;
  impact_value INTEGER;
BEGIN
  -- Map likelihood to numeric value (1-5)
  likelihood_value := CASE likelihood
    WHEN 'rare' THEN 1
    WHEN 'unlikely' THEN 2
    WHEN 'possible' THEN 3
    WHEN 'likely' THEN 4
    WHEN 'almost_certain' THEN 5
  END;
  
  -- Map impact to numeric value (1-5)
  impact_value := CASE impact
    WHEN 'negligible' THEN 1
    WHEN 'minor' THEN 2
    WHEN 'moderate' THEN 3
    WHEN 'major' THEN 4
    WHEN 'catastrophic' THEN 5
  END;
  
  RETURN likelihood_value * impact_value;
END;
$$;

-- Fix update_risk_scores trigger function
CREATE OR REPLACE FUNCTION public.update_risk_scores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.inherent_score := calculate_risk_score(NEW.inherent_likelihood, NEW.inherent_impact);
  
  IF NEW.residual_likelihood IS NOT NULL AND NEW.residual_impact IS NOT NULL THEN
    NEW.residual_score := calculate_risk_score(NEW.residual_likelihood, NEW.residual_impact);
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- Fix generate_risk_id function
CREATE OR REPLACE FUNCTION public.generate_risk_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'RISK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$;

-- Fix set_risk_id trigger function
CREATE OR REPLACE FUNCTION public.set_risk_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.risk_id IS NULL OR NEW.risk_id = '' THEN
    NEW.risk_id := generate_risk_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Fix generate_control_id function
CREATE OR REPLACE FUNCTION public.generate_control_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'CTRL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$;

-- Fix set_control_id trigger function
CREATE OR REPLACE FUNCTION public.set_control_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.control_id IS NULL OR NEW.control_id = '' THEN
    NEW.control_id := generate_control_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Fix trigger_cascade_framework trigger function
CREATE OR REPLACE FUNCTION public.trigger_cascade_framework()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix update_saw_updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_saw_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;