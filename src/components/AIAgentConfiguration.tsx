import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Plus, Save, Trash2, Bot, Clock } from "lucide-react";
import { toast } from "sonner";

interface AgentState {
  id: string;
  department: string;
  agent_name: string;
  status: string;
  configuration: any;
}

interface AgentTask {
  id: string;
  department: string;
  task_type: string;
  task_name: string;
  task_config: any;
  schedule_cron: string | null;
  is_active: boolean;
  priority: number;
}

const DEPARTMENTS = [
  'HR', 'IT', 'Finance', 'Sales', 'Operations', 'Security', 'Compliance', 'Customer Support'
];

const TASK_TYPES = [
  'monitor', 'alert', 'analyze', 'optimize', 'report', 'coordinate'
];

export const AIAgentConfiguration = () => {
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
  const [editingTask, setEditingTask] = useState<AgentTask | null>(null);
  const [isNewAgent, setIsNewAgent] = useState(false);
  const [isNewTask, setIsNewTask] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data: agentData } = await supabase
        .from('ai_agent_state')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .order('department');

      const { data: taskData } = await supabase
        .from('ai_agent_tasks')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .order('department');

      setAgents(agentData || []);
      setTasks(taskData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveAgent = async (agentData: Partial<AgentState>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      if (agentData.id) {
        // Update existing
        const { error } = await supabase
          .from('ai_agent_state')
          .update(agentData)
          .eq('id', agentData.id);
        
        if (error) throw error;
        toast.success('Agent updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('ai_agent_state')
          .insert([{
            agent_name: agentData.agent_name || '',
            department: agentData.department || '',
            configuration: agentData.configuration || {},
            customer_id: profile.customer_id,
            status: 'active'
          }]);
        
        if (error) throw error;
        toast.success('Agent created successfully');
      }

      loadData();
      setSelectedAgent(null);
      setIsNewAgent(false);
    } catch (error) {
      console.error('Failed to save agent:', error);
      toast.error('Failed to save agent');
    }
  };

  const saveTask = async (taskData: Partial<AgentTask>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      if (taskData.id) {
        // Update existing
        const { error } = await supabase
          .from('ai_agent_tasks')
          .update(taskData)
          .eq('id', taskData.id);
        
        if (error) throw error;
        toast.success('Task updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('ai_agent_tasks')
          .insert([{
            task_name: taskData.task_name || '',
            department: taskData.department || '',
            task_type: taskData.task_type || '',
            task_config: taskData.task_config || {},
            schedule_cron: taskData.schedule_cron,
            is_active: taskData.is_active ?? true,
            priority: taskData.priority || 5,
            customer_id: profile.customer_id
          }]);
        
        if (error) throw error;
        toast.success('Task created successfully');
      }

      loadData();
      setEditingTask(null);
      setIsNewTask(false);
    } catch (error) {
      console.error('Failed to save task:', error);
      toast.error('Failed to save task');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase
        .from('ai_agent_tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
      toast.success('Task deleted');
      loadData();
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  if (loading) {
    return <Card><CardContent className="p-6">Loading configuration...</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>AI Agent Configuration</CardTitle>
            </div>
            <div className="flex gap-2">
              <Dialog open={isNewAgent} onOpenChange={setIsNewAgent}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Agent
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Agent</DialogTitle>
                    <DialogDescription>
                      Configure a new AI agent for a department
                    </DialogDescription>
                  </DialogHeader>
                  <AgentForm
                    agent={null}
                    onSave={saveAgent}
                    onCancel={() => setIsNewAgent(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <CardDescription>
            Configure AI agents and their automated tasks per department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="agents">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="agents">Agents ({agents.length})</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="agents" className="space-y-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-4">
                  {agents.map((agent) => (
                    <Card key={agent.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4" />
                              <span className="font-semibold">{agent.agent_name}</span>
                              <Badge variant="outline">{agent.department}</Badge>
                              <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                                {agent.status}
                              </Badge>
                            </div>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Agent</DialogTitle>
                              </DialogHeader>
                              <AgentForm
                                agent={agent}
                                onSave={saveAgent}
                                onCancel={() => {}}
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {agents.length === 0 && (
                    <div className="text-center text-muted-foreground p-8">
                      No agents configured. Click "New Agent" to create one.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={isNewTask} onOpenChange={setIsNewTask}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                      <DialogDescription>
                        Configure a new automated task for an agent
                      </DialogDescription>
                    </DialogHeader>
                    <TaskForm
                      task={null}
                      onSave={saveTask}
                      onCancel={() => setIsNewTask(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <ScrollArea className="h-[450px]">
                <div className="space-y-2 pr-4">
                  {tasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span className="font-semibold">{task.task_name}</span>
                              <Badge variant="outline">{task.department}</Badge>
                              <Badge variant="secondary">{task.task_type}</Badge>
                              {task.is_active ? (
                                <Badge variant="default">Active</Badge>
                              ) : (
                                <Badge variant="outline">Inactive</Badge>
                              )}
                            </div>
                            {task.schedule_cron && (
                              <p className="text-xs text-muted-foreground">
                                Schedule: {task.schedule_cron}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Task</DialogTitle>
                                </DialogHeader>
                                <TaskForm
                                  task={task}
                                  onSave={saveTask}
                                  onCancel={() => {}}
                                />
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center text-muted-foreground p-8">
                      No tasks configured. Click "New Task" to create one.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const AgentForm = ({ 
  agent, 
  onSave, 
  onCancel 
}: { 
  agent: AgentState | null; 
  onSave: (data: Partial<AgentState>) => void; 
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    agent_name: agent?.agent_name || '',
    department: agent?.department || '',
    status: agent?.status || 'active',
    configuration: agent?.configuration || {}
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Agent Name</Label>
        <Input
          value={formData.agent_name}
          onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
          placeholder="e.g., HR Assistant"
        />
      </div>

      <div className="space-y-2">
        <Label>Department</Label>
        <Select
          value={formData.department}
          onValueChange={(value) => setFormData({ ...formData, department: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...agent, ...formData })}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );
};

const TaskForm = ({ 
  task, 
  onSave, 
  onCancel 
}: { 
  task: AgentTask | null; 
  onSave: (data: Partial<AgentTask>) => void; 
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    task_name: task?.task_name || '',
    department: task?.department || '',
    task_type: task?.task_type || '',
    schedule_cron: task?.schedule_cron || '',
    is_active: task?.is_active ?? true,
    priority: task?.priority || 5,
    task_config: task?.task_config || {}
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Task Name</Label>
          <Input
            value={formData.task_name}
            onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
            placeholder="e.g., Monitor Workflows"
          />
        </div>

        <div className="space-y-2">
          <Label>Department</Label>
          <Select
            value={formData.department}
            onValueChange={(value) => setFormData({ ...formData, department: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Task Type</Label>
          <Select
            value={formData.task_type}
            onValueChange={(value) => setFormData({ ...formData, task_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {TASK_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority (1-10)</Label>
          <Input
            type="number"
            min="1"
            max="10"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Schedule (Cron Expression)</Label>
        <Input
          value={formData.schedule_cron}
          onChange={(e) => setFormData({ ...formData, schedule_cron: e.target.value })}
          placeholder="e.g., */15 * * * * (every 15 minutes)"
        />
        <p className="text-xs text-muted-foreground">
          Use cron syntax: minute hour day month weekday
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label>Active</Label>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...task, ...formData })}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );
};