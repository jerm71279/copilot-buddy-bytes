-- Make project_manager_id nullable and remove the foreign key to employees
-- This allows projects to be created without requiring an employee record

ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_project_manager_id_fkey;

ALTER TABLE projects 
ALTER COLUMN project_manager_id DROP NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_project_manager_id 
ON projects(project_manager_id) 
WHERE project_manager_id IS NOT NULL;