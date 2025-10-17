import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function DocumentationIngestion() {
  const [url, setUrl] = useState("https://www.sonicwall.com/support/technical-documentation/docs/sonicos-7.3-release_notes");
  const [source, setSource] = useState("SonicWall");
  const [category, setCategory] = useState("technical_documentation");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleIngest = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to ingest documentation",
          variant: "destructive",
        });
        return;
      }

      // Try to get user's customer
      let { data: profile } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      // If no customer linked yet, attempt to complete signup to auto-link profile -> customer
      if (!profile?.customer_id) {
        const fullName = (user.user_metadata?.full_name as string | undefined) || (user.email ?? 'User');
        const emailUsername = (user.email || '').split('@')[0] || 'user';
        const { error: completeError } = await supabase.functions.invoke('complete-user-signup', {
          body: { userId: user.id, fullName, emailUsername }
        });
        if (completeError) {
          toast({
            title: "Profile setup required",
            description: "We couldn't auto-complete your profile. Please contact an admin.",
            variant: "destructive",
          });
          return;
        }
        // Re-fetch profile after completion
        const refreshed = await supabase
          .from('user_profiles')
          .select('customer_id')
          .eq('user_id', user.id)
          .maybeSingle();
        profile = refreshed.data ?? null;

        if (!profile?.customer_id) {
          toast({
            title: "Profile setup required",
            description: "Your account is missing an organization link.",
            variant: "destructive",
          });
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke('ingest-documentation', {
        body: {
          url,
          source,
          category,
          customerId: profile.customer_id
        }
      });

      if (error) throw error;

      toast({
        title: "Documentation ingested",
        description: `Successfully added: ${data.title}`,
      });

      setUrl("");
    } catch (error) {
      console.error('Error ingesting documentation:', error);
      toast({
        title: "Ingestion failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Documentation Ingestion</CardTitle>
          <CardDescription>
            Ingest external documentation into the AI knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="url">Documentation URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.sonicwall.com/support/..."
            />
          </div>
          <div>
            <Label htmlFor="source">Source Name</Label>
            <Input
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="SonicWall"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="technical_documentation"
            />
          </div>
          <Button onClick={handleIngest} disabled={loading || !url}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ingest Documentation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
