import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useForm } from "@/hooks/useForm";
import { sanitizeText } from "@/utils/validation";
import { RiskService } from "@/services/riskService";
import { AuthService } from "@/services/authService";

interface RiskAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RiskAssessmentDialog({ open, onOpenChange, onSuccess }: RiskAssessmentDialogProps) {
  const { toast } = useToast();

  const form = useForm({
    initialValues: {
      risk_title: "",
      risk_description: "",
      category: "cybersecurity",
      inherent_likelihood: 3,
      inherent_impact: 3,
      treatment_type: "mitigate",
    },
    validate: (values) => {
      const errors: Record<string, string> = {};

      const sanitizedTitle = sanitizeText(values.risk_title, 200);
      if (!sanitizedTitle) {
        errors.risk_title = "Risk title is required";
      } else if (sanitizedTitle.length < 3) {
        errors.risk_title = "Risk title must be at least 3 characters";
      }

      const sanitizedDescription = sanitizeText(values.risk_description, 1000);
      if (!sanitizedDescription) {
        errors.risk_description = "Risk description is required";
      } else if (sanitizedDescription.length < 10) {
        errors.risk_description = "Risk description must be at least 10 characters";
      }

      if (values.inherent_likelihood < 1 || values.inherent_likelihood > 5) {
        errors.inherent_likelihood = "Likelihood must be between 1 and 5";
      }

      if (values.inherent_impact < 1 || values.inherent_impact > 5) {
        errors.inherent_impact = "Impact must be between 1 and 5";
      }

      return errors;
    },
    onSubmit: async (values) => {
      try {
        const user = await AuthService.getCurrentUser();
        if (!user) throw new Error("Not authenticated");

        const profile = await AuthService.getUserProfile(user.id);
        if (!profile?.customer_id) throw new Error("Customer ID not found");

        // Sanitize inputs
        const sanitizedTitle = sanitizeText(values.risk_title, 200);
        const sanitizedDescription = sanitizeText(values.risk_description, 1000);

        // Calculate inherent score (likelihood * impact)
        const inherentScore = values.inherent_likelihood * values.inherent_impact;

        await RiskService.createRiskAssessment({
          customer_id: profile.customer_id,
          risk_title: sanitizedTitle,
          risk_description: sanitizedDescription,
          category: values.category,
          inherent_likelihood: values.inherent_likelihood,
          inherent_impact: values.inherent_impact,
          inherent_score: inherentScore,
          treatment_type: values.treatment_type,
          status: "identified",
          created_by: user.id,
          identified_by: user.id,
          risk_id: crypto.randomUUID(),
        });

        toast({
          title: "Success",
          description: "Risk assessment created successfully",
        });

        onOpenChange(false);
        onSuccess();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    resetOnSubmit: true,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Risk Assessment</DialogTitle>
          <DialogDescription>
            Create a new risk assessment for your organization
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="risk_title">Risk Title *</Label>
            <Input
              id="risk_title"
              value={form.values.risk_title}
              onChange={(e) => form.handleChange("risk_title", e.target.value)}
              onBlur={() => form.handleBlur("risk_title")}
              placeholder="e.g., Unauthorized data access"
              className={form.touched.risk_title && form.errors.risk_title ? "border-destructive" : ""}
            />
            {form.touched.risk_title && form.errors.risk_title && (
              <p className="text-sm text-destructive">{form.errors.risk_title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="risk_description">Risk Description *</Label>
            <Textarea
              id="risk_description"
              value={form.values.risk_description}
              onChange={(e) => form.handleChange("risk_description", e.target.value)}
              onBlur={() => form.handleBlur("risk_description")}
              placeholder="Describe the risk in detail..."
              rows={4}
              className={form.touched.risk_description && form.errors.risk_description ? "border-destructive" : ""}
            />
            {form.touched.risk_description && form.errors.risk_description && (
              <p className="text-sm text-destructive">{form.errors.risk_description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={form.values.category}
                onValueChange={(value) => form.handleChange("category", value)}
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
                value={form.values.treatment_type}
                onValueChange={(value) => form.handleChange("treatment_type", value)}
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
                value={form.values.inherent_likelihood.toString()}
                onValueChange={(value) => form.handleChange("inherent_likelihood", parseInt(value))}
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
              {form.touched.inherent_likelihood && form.errors.inherent_likelihood && (
                <p className="text-sm text-destructive">{form.errors.inherent_likelihood}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inherent_impact">Impact (1-5) *</Label>
              <Select
                value={form.values.inherent_impact.toString()}
                onValueChange={(value) => form.handleChange("inherent_impact", parseInt(value))}
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
              {form.touched.inherent_impact && form.errors.inherent_impact && (
                <p className="text-sm text-destructive">{form.errors.inherent_impact}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={form.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.isSubmitting}>
              {form.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Risk Assessment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
