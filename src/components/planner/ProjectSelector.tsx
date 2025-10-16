import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/hooks/useDeploymentData";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  selectedProject?: Project;
}

export function ProjectSelector({
  projects,
  selectedProjectId,
  onSelectProject,
  selectedProject
}: ProjectSelectorProps) {
  if (projects.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Label className="font-semibold">Active Project:</Label>
          <Select value={selectedProjectId || undefined} onValueChange={onSelectProject}>
            <SelectTrigger className="w-[400px]">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.project_name} - {project.project_status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProject && (
            <div className="flex gap-2">
              <Badge variant="outline">{selectedProject.project_type}</Badge>
              <Badge>{selectedProject.project_status}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
