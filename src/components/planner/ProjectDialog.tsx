import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { PROJECT_STATUS_OPTIONS, getDefaultNewProject } from "@/lib/deploymentPlannerConfig";
import type { NewProjectForm } from "@/hooks/useDeploymentData";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newProject: NewProjectForm;
  onProjectChange: (project: NewProjectForm) => void;
  onCreateProject: () => void;
}

export function ProjectDialog({
  open,
  onOpenChange,
  newProject,
  onProjectChange,
  onCreateProject
}: ProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new deployment project with planning tools
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="project_name">Project Name</Label>
            <Input
              id="project_name"
              value={newProject.project_name}
              onChange={(e) => onProjectChange({ ...newProject, project_name: e.target.value })}
              placeholder="Internal Platform Deployment"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newProject.description}
              onChange={(e) => onProjectChange({ ...newProject, description: e.target.value })}
              placeholder="Describe the project goals and scope..."
            />
          </div>
          <div>
            <Label htmlFor="project_status">Status</Label>
            <Select
              value={newProject.project_status}
              onValueChange={(value) => onProjectChange({ ...newProject, project_status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onCreateProject} className="w-full">
            Create Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
