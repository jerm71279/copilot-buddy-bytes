import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OnboardingChecklistItem } from '@/services/integrationOnboardingService';
import { useUpdateChecklistItem } from '@/hooks/useIntegrationOnboarding';
import { CheckCircle2, Circle, Clock, Play } from 'lucide-react';

interface ChecklistTableProps {
  checklist: OnboardingChecklistItem[];
  integrationId: string;
}

export function ChecklistTable({ checklist }: ChecklistTableProps) {
  const [selectedItem, setSelectedItem] = useState<OnboardingChecklistItem | null>(null);
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const updateChecklistItem = useUpdateChecklistItem();

  const handleUpdateItem = async () => {
    if (!selectedItem) return;

    const updates: Partial<OnboardingChecklistItem> = {
      notes,
      status: newStatus,
    };

    if (newStatus === 'in_progress' && selectedItem.status === 'pending') {
      updates.started_at = new Date().toISOString();
    }

    if (newStatus === 'completed' && selectedItem.status !== 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    await updateChecklistItem.mutateAsync({
      id: selectedItem.id,
      updates,
    });

    setSelectedItem(null);
    setNotes('');
    setNewStatus('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'blocked':
        return <Circle className="h-4 w-4 text-destructive" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const groupedByPhase = checklist.reduce((acc, item) => {
    if (!acc[item.phase]) {
      acc[item.phase] = [];
    }
    acc[item.phase].push(item);
    return acc;
  }, {} as Record<string, OnboardingChecklistItem[]>);

  const phaseNames: Record<string, string> = {
    discovery: 'Phase 1: Discovery',
    setup: 'Phase 2: Setup',
    development: 'Phase 3: Development',
    workflow: 'Phase 4: Workflow',
    ui_ux: 'Phase 5: UI/UX',
    testing: 'Phase 6: Testing',
    documentation: 'Phase 7: Documentation',
    approval: 'Phase 8: Approval',
    post_launch: 'Phase 9: Post-Launch',
  };

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedByPhase).map(([phase, items]) => (
          <Card key={phase}>
            <CardHeader>
              <CardTitle>{phaseNames[phase]}</CardTitle>
              <CardDescription>
                {items.filter(i => i.status === 'completed').length} of {items.length} completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-24">Step</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Responsible</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{getStatusIcon(item.status)}</TableCell>
                      <TableCell className="font-mono text-sm">{item.step_number}</TableCell>
                      <TableCell>{item.step_description}</TableCell>
                      <TableCell>{item.responsible_role}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedItem(item);
                            setNotes(item.notes || '');
                            setNewStatus(item.status);
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Checklist Item</DialogTitle>
            <DialogDescription>
              {selectedItem?.step_number}: {selectedItem?.step_description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this step"
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setSelectedItem(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleUpdateItem}
                className="flex-1"
                disabled={updateChecklistItem.isPending}
              >
                {updateChecklistItem.isPending ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
