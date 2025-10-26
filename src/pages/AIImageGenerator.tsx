import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Download, Image as ImageIcon } from 'lucide-react';

const AIImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for the image you want to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt: prompt.trim() }
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Generation failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast({
          title: "Image generated!",
          description: "Your image has been created successfully.",
        });
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Image Generator</h1>
          <p className="text-muted-foreground">
            Create stunning images from text descriptions using AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Describe Your Image
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter a detailed description of the image you want to create
                </p>
              </div>

              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: A serene landscape with mountains at sunset, vibrant colors, photorealistic style..."
                className="min-h-[200px] resize-none"
                disabled={isGenerating}
              />

              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Image'
                )}
              </Button>

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Tips for better results:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Be specific about style (photorealistic, artistic, cartoon, etc.)</li>
                  <li>Include details about lighting and colors</li>
                  <li>Describe the composition and perspective</li>
                  <li>Mention the mood or atmosphere you want</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Output Section */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Generated Image</h2>
                <p className="text-sm text-muted-foreground">
                  Your AI-generated image will appear here
                </p>
              </div>

              <div className="relative aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Creating your image...</p>
                  </div>
                ) : generatedImage ? (
                  <img 
                    src={generatedImage} 
                    alt="AI Generated" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-8">
                    <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Enter a prompt and click generate to create an image
                    </p>
                  </div>
                )}
              </div>

              {generatedImage && !isGenerating && (
                <Button 
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Image
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIImageGenerator;
