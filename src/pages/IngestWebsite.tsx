import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useDocumentationFunctions } from '@/hooks/useDocumentationFunctions';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function IngestWebsite() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { ingestDocumentation } = useDocumentationFunctions();
  const { customerId, isLoading: profileLoading } = useUserProfile();

  const handleFetchWebsite = async () => {
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    setIsLoading(true);
    try {
      // This would normally call a fetch website function
      // For now, we'll let the user paste the content
      toast.info('Fetch the website content and paste it below, or use the browser console to scrape it');
    } catch (error) {
      console.error('Error fetching website:', error);
      toast.error('Failed to fetch website');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngest = async () => {
    if (!content || !title) {
      toast.error('Please provide both title and content');
      return;
    }

    if (!customerId) {
      toast.error('Unable to fetch your customer ID. Please try refreshing the page.');
      return;
    }

    setIsLoading(true);
    try {
      await ingestDocumentation.invoke({
        url: url || 'manual-input',
        title,
        content,
        source: url || 'manual-input',
        customerId,
        category: 'website',
        metadata: {
          tags: ['website', 'documentation']
        }
      });

      toast.success('Content ingested successfully');
      setUrl('');
      setTitle('');
      setContent('');
    } catch (error) {
      console.error('Error ingesting content:', error);
      toast.error('Failed to ingest content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>Ingest Website Content</CardTitle>
            <CardDescription>
              Import website content into your knowledge base for AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium">
                Website URL
              </label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Button onClick={handleFetchWebsite} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                placeholder="Content title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                Content
              </label>
              <Textarea
                id="content"
                placeholder="Paste the website content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleIngest}
              disabled={isLoading || !content || !title || profileLoading || !customerId}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingesting...
                </>
              ) : profileLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Ingest Content'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
