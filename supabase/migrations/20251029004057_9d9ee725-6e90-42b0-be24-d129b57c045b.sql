-- Create warehouse_locations table
CREATE TABLE IF NOT EXISTS public.warehouse_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  location_name TEXT NOT NULL,
  location_code TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  warehouse_type TEXT,
  capacity_sqft NUMERIC,
  is_active BOOLEAN DEFAULT true,
  manager_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warehouse_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view warehouse locations for their customer"
ON public.warehouse_locations FOR SELECT
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert warehouse locations for their customer"
ON public.warehouse_locations FOR INSERT
WITH CHECK (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update warehouse locations for their customer"
ON public.warehouse_locations FOR UPDATE
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete warehouse locations for their customer"
ON public.warehouse_locations FOR DELETE
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

-- Create vendor_performance table
CREATE TABLE IF NOT EXISTS public.vendor_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quality_score NUMERIC CHECK (quality_score >= 0 AND quality_score <= 100),
  delivery_score NUMERIC CHECK (delivery_score >= 0 AND delivery_score <= 100),
  communication_score NUMERIC CHECK (communication_score >= 0 AND communication_score <= 100),
  price_competitiveness_score NUMERIC CHECK (price_competitiveness_score >= 0 AND price_competitiveness_score <= 100),
  overall_score NUMERIC CHECK (overall_score >= 0 AND overall_score <= 100),
  on_time_delivery_rate NUMERIC,
  defect_rate NUMERIC,
  response_time_hours NUMERIC,
  evaluator_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_performance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view vendor performance for their customer"
ON public.vendor_performance FOR SELECT
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert vendor performance for their customer"
ON public.vendor_performance FOR INSERT
WITH CHECK (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update vendor performance for their customer"
ON public.vendor_performance FOR UPDATE
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete vendor performance for their customer"
ON public.vendor_performance FOR DELETE
USING (
  customer_id IN (
    SELECT customer_id FROM public.user_profiles WHERE user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX idx_warehouse_locations_customer ON public.warehouse_locations(customer_id);
CREATE INDEX idx_warehouse_locations_active ON public.warehouse_locations(is_active);
CREATE INDEX idx_vendor_performance_vendor ON public.vendor_performance(vendor_id);
CREATE INDEX idx_vendor_performance_customer ON public.vendor_performance(customer_id);
CREATE INDEX idx_vendor_performance_date ON public.vendor_performance(evaluation_date);