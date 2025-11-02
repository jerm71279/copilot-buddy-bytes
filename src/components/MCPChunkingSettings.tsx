import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Scissors, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function MCPChunkingSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    strategy: 'paragraph' as 'paragraph' | 'token' | 'semantic' | 'hybrid',
    chunkSize: 1000,
    chunkOverlap: 200,
    minChunkSize: 100,
    separator: '\n\n',
    isActive: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (!profile?.customer_id) return;

      const { data, error } = await supabase
        .from('mcp_chunking_settings')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          strategy: data.strategy as any,
          chunkSize: data.chunk_size,
          chunkOverlap: data.chunk_overlap,
          minChunkSize: data.min_chunk_size,
          separator: data.separator,
          isActive: data.is_active,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (!profile?.customer_id) {
        toast.error('Customer profile not found');
        return;
      }

      const { error } = await supabase
        .from('mcp_chunking_settings')
        .upsert({
          customer_id: profile.customer_id,
          strategy: settings.strategy,
          chunk_size: settings.chunkSize,
          chunk_overlap: settings.chunkOverlap,
          min_chunk_size: settings.minChunkSize,
          separator: settings.separator,
          is_active: settings.isActive,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'customer_id',
        });

      if (error) throw error;

      toast.success('Chunking settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Scissors className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Document Chunking Settings</CardTitle>
            <CardDescription>
              Configure how documents are split for optimal RAG performance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Chunking</Label>
            <p className="text-sm text-muted-foreground">
              Split large documents into smaller semantic chunks
            </p>
          </div>
          <Switch
            checked={settings.isActive}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, isActive: checked })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="strategy">Chunking Strategy</Label>
          <Select
            value={settings.strategy}
            onValueChange={(value: any) =>
              setSettings({ ...settings, strategy: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paragraph">Paragraph - Split on paragraph boundaries</SelectItem>
              <SelectItem value="token">Token - Split by token count</SelectItem>
              <SelectItem value="semantic">Semantic - Split on sentence boundaries</SelectItem>
              <SelectItem value="hybrid">Hybrid - Best of semantic & paragraph</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="chunkSize">Chunk Size (tokens)</Label>
            <Input
              id="chunkSize"
              type="number"
              min="100"
              max="8000"
              value={settings.chunkSize}
              onChange={(e) =>
                setSettings({ ...settings, chunkSize: parseInt(e.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 500-2000
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chunkOverlap">Chunk Overlap (tokens)</Label>
            <Input
              id="chunkOverlap"
              type="number"
              min="0"
              max="500"
              value={settings.chunkOverlap}
              onChange={(e) =>
                setSettings({ ...settings, chunkOverlap: parseInt(e.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 10-20% of chunk size
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minChunkSize">Minimum Chunk Size (characters)</Label>
          <Input
            id="minChunkSize"
            type="number"
            min="50"
            max="1000"
            value={settings.minChunkSize}
            onChange={(e) =>
              setSettings({ ...settings, minChunkSize: parseInt(e.target.value) })
            }
          />
          <p className="text-xs text-muted-foreground">
            Chunks smaller than this will be merged or discarded
          </p>
        </div>

        {settings.strategy === 'paragraph' && (
          <div className="space-y-2">
            <Label htmlFor="separator">Paragraph Separator</Label>
            <Input
              id="separator"
              value={settings.separator}
              onChange={(e) =>
                setSettings({ ...settings, separator: e.target.value })
              }
              placeholder="\n\n"
            />
            <p className="text-xs text-muted-foreground">
              Character sequence that separates paragraphs
            </p>
          </div>
        )}

        <Button
          onClick={saveSettings}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
