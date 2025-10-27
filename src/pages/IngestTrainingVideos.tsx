import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Video, Plus, Trash2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useStandardToast } from "@/hooks/useStandardToast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface VideoInput {
  id: string;
  url: string;
  title: string;
  description: string;
}

export default function IngestTrainingVideos() {
  const navigate = useNavigate();
  const { customerId } = useUserProfile();
  const toast = useStandardToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videos, setVideos] = useState<VideoInput[]>([
    {
      id: '1',
      url: 'https://www.youtube.com/watch?v=gglTU0QTGaM',
      title: 'Characterizing the Existing Network and Sites',
      description: 'Deep dive into auditing, traffic analysis, and planning timelines',
    },
    {
      id: '2',
      url: 'https://www.youtube.com/watch?v=mkvvbWg-oGQ',
      title: 'Real Life Example: Network Discovery (Basic)',
      description: 'Hands-on troubleshooting and host tracking using IP-based methods',
    },
    {
      id: '3',
      url: 'https://www.youtube.com/watch?v=hFV2J0eEeFY',
      title: 'Mapping out a Network with Cisco Discovery Protocol (CDP)',
      description: 'Topology discovery using CDP and neighbor relationships',
    },
    {
      id: '4',
      url: 'https://www.youtube.com/watch?v=EV9LYUdkyrQ',
      title: 'Network Planning Fundamentals',
      description: 'Scoping, cabling, operational cost planning, and project timelines',
    },
    {
      id: '5',
      url: 'https://www.youtube.com/watch?v=ubHo1fW9iLQ',
      title: 'Application Discovery with VMware Aria Operations',
      description: 'Application layer discovery using vRealize Network Insight',
    },
  ]);

  const addVideo = () => {
    setVideos([
      ...videos,
      {
        id: Date.now().toString(),
        url: '',
        title: '',
        description: '',
      },
    ]);
  };

  const removeVideo = (id: string) => {
    setVideos(videos.filter(v => v.id !== id));
  };

  const updateVideo = (id: string, field: keyof VideoInput, value: string) => {
    setVideos(videos.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleAnalyzeVideos = async () => {
    setIsAnalyzing(true);
    try {
      if (!customerId) {
        toast.error("Customer profile not found");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Filter out empty videos
      const validVideos = videos.filter(v => v.url && v.title);
      if (validVideos.length === 0) {
        toast.error("Please add at least one video with URL and title");
        return;
      }

      const loadingToast = toast.loading(`Analyzing ${validVideos.length} training videos with AI...`);

      const { data, error } = await supabase.functions.invoke('analyze-training-videos', {
        body: {
          videos: validVideos,
          customerId,
          userId: user.id,
        },
      });

      if (error) throw error;

      toast.dismiss(loadingToast);
      toast.success(data.message, {
        description: 'View the insights and enhanced checklist in the Knowledge Base'
      });

      // Navigate to the enhanced checklist
      if (data.checklistId) {
        navigate(`/knowledge/${data.checklistId}`);
      } else {
        navigate('/knowledge');
      }

    } catch (error) {
      console.error("Error analyzing videos:", error);
      toast.error("Failed to analyze training videos");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DashboardLayout className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <CardTitle>AI-Powered Training Video Analysis</CardTitle>
            </div>
            <CardDescription>
              Ingest YouTube training videos, analyze them with AI, and automatically generate an enhanced network discovery checklist based on professional insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                This tool will:
              </p>
              <ol>
                <li><strong>Analyze</strong> each training video's content and best practices</li>
                <li><strong>Extract</strong> key insights, techniques, and procedures</li>
                <li><strong>Store</strong> insights as searchable knowledge articles</li>
                <li><strong>Generate</strong> an AI-enhanced checklist incorporating all learnings</li>
              </ol>
              <p className="text-sm text-muted-foreground">
                Note: For best results, ensure video URLs are publicly accessible. The AI will analyze based on video titles, descriptions, and available metadata.
              </p>
            </div>

            <div className="space-y-4">
              {videos.map((video, index) => (
                <Card key={video.id} className="border-muted">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Video {index + 1}</span>
                      </div>
                      {videos.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVideo(video.id)}
                          disabled={isAnalyzing}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`url-${video.id}`}>YouTube URL *</Label>
                      <Input
                        id={`url-${video.id}`}
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={video.url}
                        onChange={(e) => updateVideo(video.id, 'url', e.target.value)}
                        disabled={isAnalyzing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`title-${video.id}`}>Video Title *</Label>
                      <Input
                        id={`title-${video.id}`}
                        placeholder="e.g., Network Discovery Best Practices"
                        value={video.title}
                        onChange={(e) => updateVideo(video.id, 'title', e.target.value)}
                        disabled={isAnalyzing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`desc-${video.id}`}>Description (Optional)</Label>
                      <Textarea
                        id={`desc-${video.id}`}
                        placeholder="Brief description of what the video covers..."
                        value={video.description}
                        onChange={(e) => updateVideo(video.id, 'description', e.target.value)}
                        disabled={isAnalyzing}
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={addVideo}
              disabled={isAnalyzing}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Video
            </Button>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAnalyzeVideos}
                disabled={isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze & Generate Enhanced Checklist
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/knowledge")}
                disabled={isAnalyzing}
              >
                Cancel
              </Button>
            </div>

            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">What happens next:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• AI will analyze each video and extract key insights</li>
                <li>• Individual insight articles will be created in the Knowledge Base</li>
                <li>• An AI-enhanced checklist will be generated combining all learnings</li>
                <li>• You'll be redirected to view the enhanced checklist</li>
              </ul>
            </div>
          </CardContent>
        </Card>
    </DashboardLayout>
  );
}
