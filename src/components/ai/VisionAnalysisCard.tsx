import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, Upload, Loader2 } from "lucide-react";
import { useAIFunctions } from "@/hooks/useAIFunctions";

export const VisionAnalysisCard = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [analysisType, setAnalysisType] = useState("compliance");
  const [result, setResult] = useState<string>("");
  const { toast } = useToast();
  const { visionAnalysis } = useAIFunctions();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!imageFile || !prompt) {
      toast({
        title: "Missing Information",
        description: "Please upload an image and provide a prompt.",
        variant: "destructive",
      });
      return;
    }

    setResult("");

    // Convert image to base64
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onloadend = async () => {
      const base64Image = reader.result as string;

      const data = await visionAnalysis.invoke({
        imageBase64: base64Image,
        prompt: prompt,
        analysisType: analysisType,
        customerId: "demo-customer-id", // Replace with actual customer ID
      });

      if (data) {
        setResult(data.analysis);
        toast({
          title: "Analysis Complete",
          description: `Processed in ${data.processingTime}ms`,
        });
      }
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Vision Analysis
        </CardTitle>
        <CardDescription>
          Upload images for AI-powered analysis - perfect for compliance checks, document processing, and visual inspections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Analysis Type</Label>
          <Select value={analysisType} onValueChange={setAnalysisType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compliance">Compliance Check</SelectItem>
              <SelectItem value="safety">Safety Inspection</SelectItem>
              <SelectItem value="document">Document Extraction</SelectItem>
              <SelectItem value="inventory">Inventory Count</SelectItem>
              <SelectItem value="general">General Analysis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="image-upload">Upload Image</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => document.getElementById("image-upload")?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {imageFile ? imageFile.name : "Choose Image"}
            </Button>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-md border"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt">Analysis Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="What would you like to know about this image? E.g., 'Identify any safety hazards', 'Extract text from this document', 'Count the items visible'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={analyzeImage}
          disabled={!imageFile || !prompt || visionAnalysis.isLoading}
          className="w-full"
        >
          {visionAnalysis.isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Image"
          )}
        </Button>

        {result && (
          <div className="space-y-2">
            <Label>Analysis Result</Label>
            <div className="p-4 bg-muted rounded-md whitespace-pre-wrap text-sm">
              {result}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
