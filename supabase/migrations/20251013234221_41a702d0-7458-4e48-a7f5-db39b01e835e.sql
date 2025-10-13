-- Add task dependencies table for deployment planner
CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  predecessor_task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  successor_task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'finish_to_start',
  is_hard_dependency BOOLEAN DEFAULT true,
  lag_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(predecessor_task_id, successor_task_id)
);

-- Add project-specific risk assessments link
ALTER TABLE public.risk_assessments 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Add critical path indicator to tasks
ALTER TABLE public.project_tasks
ADD COLUMN IF NOT EXISTS is_critical_path BOOLEAN DEFAULT false;

-- Add resource allocation table  
CREATE TABLE IF NOT EXISTS public.resource_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  allocation_percentage INTEGER NOT NULL DEFAULT 100,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_dependencies_project ON public.task_dependencies(project_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_predecessor ON public.task_dependencies(predecessor_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_successor ON public.task_dependencies(successor_task_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_project ON public.risk_assessments(project_id);
CREATE INDEX IF NOT EXISTS idx_resource_allocations_project ON public.resource_allocations(project_id);
CREATE INDEX IF NOT EXISTS idx_resource_allocations_task ON public.resource_allocations(task_id);
CREATE INDEX IF NOT EXISTS idx_resource_allocations_user ON public.resource_allocations(user_id);

-- Enable RLS
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_dependencies
CREATE POLICY "Users can view dependencies in their organization"
  ON public.task_dependencies FOR SELECT
  USING (customer_id IN (
    SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage dependencies in their organization"
  ON public.task_dependencies FOR ALL
  USING (customer_id IN (
    SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
  ));

-- RLS Policies for resource_allocations
CREATE POLICY "Users can view allocations in their organization"
  ON public.resource_allocations FOR SELECT
  USING (customer_id IN (
    SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage allocations in their organization"
  ON public.resource_allocations FOR ALL
  USING (customer_id IN (
    SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
  ));