/**
 * Roadmap Milestones Component
 * Displays detailed milestones and action items for each stage
 * REFACTORED: Now uses shared utilities and types
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Circle, ChevronRight, CheckCircle2 } from "lucide-react";
import { RoadmapStatusIcon } from "./RoadmapStatusIcon";
import { RoadmapStatusBadge } from "./RoadmapStatusBadge";
import type { RoadmapMilestonesProps, RoadmapMilestone } from "@/types/compliance-roadmap";

export const RoadmapMilestones = ({ stages, milestones }: RoadmapMilestonesProps) => {
  const [selectedStage, setSelectedStage] = useState<string>(stages[0]?.id || '');

  const getStageMilestones = (stageId: string): RoadmapMilestone[] => {
    return milestones
      ?.filter(m => m.stage_id === stageId)
      .sort((a, b) => a.sequence_order - b.sequence_order) || [];
  };

  const currentStageMilestones = getStageMilestones(selectedStage);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Milestones & Action Items</CardTitle>
        <CardDescription>
          Detailed tasks and checkpoints for each stage
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stage Selector */}
        <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b">
          {stages.map((stage) => (
            <Button
              key={stage.id}
              variant={selectedStage === stage.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStage(stage.id)}
            >
              <span className="mr-1 text-xs">{stage.stage_number}.</span>
              {stage.stage_name}
            </Button>
          ))}
        </div>

        {/* Milestones List */}
        {currentStageMilestones.length === 0 ? (
          <div className="text-center py-12">
            <Circle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Milestones Yet</h3>
            <p className="text-muted-foreground">
              Milestones will appear here as you progress through this stage
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {currentStageMilestones.map((milestone) => (
              <AccordionItem
                key={milestone.id}
                value={milestone.id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    <RoadmapStatusIcon status={milestone.status} />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{milestone.milestone_name}</span>
                        <RoadmapStatusBadge status={milestone.status} type="milestone" />
                        {milestone.evidence_required && (
                          <Badge variant="outline" className="text-xs">
                            Evidence Required
                          </Badge>
                        )}
                      </div>
                      {milestone.due_date && (
                        <div className="text-xs text-muted-foreground">
                          Due: {new Date(milestone.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="space-y-4 pt-4">
                  {/* Description */}
                  {milestone.milestone_description && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {milestone.milestone_description}
                      </p>
                    </div>
                  )}

                  {/* Required Actions */}
                  {milestone.required_actions && milestone.required_actions.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <ChevronRight className="h-4 w-4" />
                        Required Actions
                      </h5>
                      <ul className="space-y-1 ml-6">
                        {milestone.required_actions.map((action, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground list-disc">
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Success Criteria */}
                  {milestone.success_criteria && milestone.success_criteria.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Success Criteria
                      </h5>
                      <ul className="space-y-1 ml-6">
                        {milestone.success_criteria.map((criteria, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground list-disc">
                            {criteria}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {milestone.status !== 'completed' && (
                      <Button size="sm" variant="outline">
                        Mark Complete
                      </Button>
                    )}
                    {milestone.evidence_required && (
                      <Button size="sm" variant="outline">
                        Upload Evidence
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};
