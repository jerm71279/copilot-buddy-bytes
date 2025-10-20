import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { filePath, customerId, source } = await req.json();

    if (!filePath || !customerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('business-documents')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert file to text (simplified - in production use proper parsing libraries)
    const arrayBuffer = await fileData.arrayBuffer();
    const text = new TextDecoder().decode(arrayBuffer);
    
    // Extract filename and metadata
    const fileName = filePath.split('/').pop() || 'Unknown Document';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    // Determine source type based on file extension
    const sourceType = fileExtension === 'pdf' ? 'file_import' : 
                      fileExtension === 'docx' ? 'file_import' : 
                      fileExtension === 'txt' ? 'file_import' : 
                      'file_import';

    // Store in knowledge_articles
    const { data: article, error: insertError } = await supabase
      .from('knowledge_articles')
      .insert({
        customer_id: customerId,
        title: fileName,
        content: text,
        source_type: sourceType,
        source_metadata: {
          source: source || 'File Upload',
          filePath: filePath,
          fileType: fileExtension,
          uploadedAt: new Date().toISOString()
        },
        tags: [fileExtension || 'document', 'upload']
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store document' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, articleId: article.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-document function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
