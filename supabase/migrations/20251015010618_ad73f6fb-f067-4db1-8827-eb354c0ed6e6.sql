-- Create change request templates table
CREATE TABLE IF NOT EXISTS public.change_request_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  default_priority change_priority DEFAULT 'medium',
  default_risk_level change_risk DEFAULT 'medium',
  requires_approval BOOLEAN DEFAULT true,
  estimated_duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create template scenarios table
CREATE TABLE IF NOT EXISTS public.change_request_template_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.change_request_templates(id) ON DELETE CASCADE,
  scenario_name TEXT NOT NULL,
  scenario_description TEXT,
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  typical_duration_minutes INTEGER,
  requires_emergency_approval BOOLEAN DEFAULT false,
  compliance_tags TEXT[],
  recommended_testing TEXT,
  recommended_rollback TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.change_request_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_request_template_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
CREATE POLICY "Users can view templates in their organization"
  ON public.change_request_templates
  FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage templates"
  ON public.change_request_templates
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for scenarios
CREATE POLICY "Users can view scenarios in their organization"
  ON public.change_request_template_scenarios
  FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM change_request_templates 
      WHERE customer_id IN (
        SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage scenarios"
  ON public.change_request_template_scenarios
  FOR ALL
  USING (
    template_id IN (
      SELECT id FROM change_request_templates 
      WHERE customer_id IN (
        SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
      )
    ) AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Create indexes
CREATE INDEX idx_templates_customer ON public.change_request_templates(customer_id);
CREATE INDEX idx_scenarios_template ON public.change_request_template_scenarios(template_id);

-- Add template_id to change_requests
ALTER TABLE public.change_requests 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.change_request_templates(id);

ALTER TABLE public.change_requests 
ADD COLUMN IF NOT EXISTS selected_scenario_id UUID REFERENCES public.change_request_template_scenarios(id);