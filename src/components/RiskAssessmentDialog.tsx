import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface RiskAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RiskAssessmentDialog({ open, onOpenChange, onSuccess }: RiskAssessmentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    risk_title: "",
    risk_description: "",
    category: "cybersecurity",
    inherent_likelihood: 3,
    inherent_impact: 3,
    treatment_type: "mitigate",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("customer_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.customer_id) throw new Error("Customer ID not found");

      // Calculate inherent score (likelihood * impact)
      const inherentScore = formData.inherent_likelihood * formData.inherent_impact;

      const { error } = await supabase
        .from("risk_assessments")
        .insert({
          customer_id: profile.customer_id,
          risk_title: formData.risk_title,
          risk_description: formData.risk_description,
          category: formData.category as any,
          inherent_likelihood: formData.inherent_likelihood as any,
          inherent_impact: formData.inherent_impact as any,
          inherent_score: inherentScore,
          treatment_type: formData.treatment_type as any,
          status: "identified" as any,
          created_by: user.id,
          identified_by: user.id,
          risk_id: crypto.randomUUID(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Risk assessment created successfully",
      });

      setFormData({
        risk_title: "",
        risk_description: "",
        category: "cybersecurity",
        inherent_likelihood: 3,
        inherent_impact: 3,
        treatment_type: "mitigate",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Risk Assessment</DialogTitle>
          <DialogDescription>
            Create a new risk assessment for your organization
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="risk_title">Risk Title *</Label>
            <Input
              id="risk_title"
              value={formData.risk_title}
              onChange={(e) => setFormData({ ...formData, risk_title: e.target.value })}
              placeholder="e.g., Unauthorized data access"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="risk_description">Risk Description *</Label>
            <Textarea
              id="risk_description"
              value={formData.risk_description}
              onChange={(e) => setFormData({ ...formData, risk_description: e.target.value })}
              placeholder="Describe the risk in detail..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="reputational">Reputational</SelectItem>
                  <SelectItem value="strategic">Strategic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment_type">Treatment Type *</Label>
              <Select
                value={formData.treatment_type}
                onValueChange={(value) => setFormData({ ...formData, treatment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mitigate">Mitigate</SelectItem>
                  <SelectItem value="accept">Accept</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="avoid">Avoid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inherent_likelihood">Likelihood (1-5) *</Label>
              <Select
                value={formData.inherent_likelihood.toString()}
                onValueChange={(value) => setFormData({ ...formData, inherent_likelihood: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Rare</SelectItem>
                  <SelectItem value="2">2 - Unlikely</SelectItem>
                  <SelectItem value="3">3 - Possible</SelectItem>
                  <SelectItem value="4">4 - Likely</SelectItem>
                  <SelectItem value="5">5 - Almost Certain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inherent_impact">Impact (1-5) *</Label>
              <Select
                value={formData.inherent_impact.toString()}
                onValueChange={(value) => setFormData({ ...formData, inherent_impact: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Insignificant</SelectItem>
                  <SelectItem value="2">2 - Minor</SelectItem>
                  <SelectItem value="3">3 - Moderate</SelectItem>
                  <SelectItem value="4">4 - Major</SelectItem>
                  <SelectItem value="5">5 - Catastrophic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Risk Assessment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
