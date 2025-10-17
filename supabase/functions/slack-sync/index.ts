import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const requestData = await req.json();
    
    // Validate input
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const syncConfigId = requestData.syncConfigId;
    const accessToken = String(requestData.accessToken || '').slice(0, 1000);
    
    if (!syncConfigId || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'Sync config ID and access token are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Starting Slack sync for config:", syncConfigId);

    // Get sync configuration
    const { data: syncConfig, error: configError } = await supabaseClient
      .from("slack_sync_config")
      .select("*")
      .eq("id", syncConfigId)
      .maybeSingle();

    if (configError || !syncConfig) {
      throw new Error(`Failed to get sync config: ${configError?.message}`);
    }

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabaseClient
      .from("slack_sync_logs")
      .insert({
        sync_config_id: syncConfigId,
        status: "running",
      })
      .select()
      .maybeSingle();

    if (logError) {
      throw new Error(`Failed to create sync log: ${logError.message}`);
    }
    if (!syncLog) {
      throw new Error('Failed to create sync log record');
    }

    let messagesSynced = 0;
    let messagesFailed = 0;
    const syncDetails: any = {
      channels: [],
      errors: [],
    };

    try {
      // Process each channel
      for (const channelId of syncConfig.channel_ids) {
        console.log("Fetching messages from channel:", channelId);
        
        const channelDetails: any = {
          channel_id: channelId,
          messages_synced: 0,
          messages_failed: 0,
        };

        try {
          // Get channel info
          const channelInfoResponse = await fetch(
            `https://slack.com/api/conversations.info?channel=${channelId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!channelInfoResponse.ok) {
            throw new Error(`Failed to get channel info: ${channelInfoResponse.status}`);
          }

          const channelInfo = await channelInfoResponse.json();
          if (!channelInfo.ok) {
            throw new Error(`Slack API error: ${channelInfo.error}`);
          }

          const channelName = channelInfo.channel.name;
          channelDetails.channel_name = channelName;

          // Fetch messages from channel (last 7 days)
          const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
          const messagesResponse = await fetch(
            `https://slack.com/api/conversations.history?channel=${channelId}&oldest=${sevenDaysAgo}&limit=100`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!messagesResponse.ok) {
            throw new Error(`Failed to fetch messages: ${messagesResponse.status}`);
          }

          const messagesData = await messagesResponse.json();
          if (!messagesData.ok) {
            throw new Error(`Slack API error: ${messagesData.error}`);
          }

          const messages = messagesData.messages || [];
          console.log(`Found ${messages.length} messages in #${channelName}`);

          // Process each message
          for (const message of messages) {
            try {
              // Skip bot messages and messages without text
              if (message.subtype === 'bot_message' || !message.text || message.text.trim() === '') {
                continue;
              }

              // Get user info for message author
              let userName = 'Unknown User';
              if (message.user) {
                const userResponse = await fetch(
                  `https://slack.com/api/users.info?user=${message.user}`,
                  {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      "Content-Type": "application/json",
                    },
                  }
                );

                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  if (userData.ok && userData.user) {
                    userName = userData.user.real_name || userData.user.name;
                  }
                }
              }

              // Create knowledge article title and content
              const messageDate = new Date(parseFloat(message.ts) * 1000);
              const title = `Slack: #${channelName} - ${userName} - ${messageDate.toLocaleDateString()}`;
              const content = `**Channel:** #${channelName}\n**Author:** ${userName}\n**Date:** ${messageDate.toLocaleString()}\n\n${message.text}`;

              // Check if this message was already synced
              const { data: existingArticle } = await supabaseClient
                .from("knowledge_articles")
                .select("id")
                .eq("customer_id", syncConfig.customer_id)
                .eq("source_type", "slack")
                .eq("source_metadata->>message_ts", message.ts)
                .eq("source_metadata->>channel_id", channelId)
                .maybeSingle();

              if (existingArticle) {
                console.log("Message already synced, skipping");
                continue;
              }

              // Insert into knowledge_articles
              const { error: articleError } = await supabaseClient
                .from("knowledge_articles")
                .insert({
                  customer_id: syncConfig.customer_id,
                  title: title,
                  content: content,
                  article_type: "guide",
                  status: "published",
                  tags: ["slack", channelName, "team-communication"],
                  accessible_departments: ["all"],
                  source_type: "slack",
                  source_metadata: {
                    workspace_id: syncConfig.workspace_id,
                    workspace_name: syncConfig.workspace_name,
                    channel_id: channelId,
                    channel_name: channelName,
                    message_ts: message.ts,
                    user_id: message.user,
                    user_name: userName,
                    synced_at: new Date().toISOString(),
                  },
                });

              if (articleError) {
                throw new Error(`Failed to create knowledge article: ${articleError.message}`);
              }

              messagesSynced++;
              channelDetails.messages_synced++;
            } catch (msgError) {
              console.error("Error processing message:", msgError);
              messagesFailed++;
              channelDetails.messages_failed++;
              syncDetails.errors.push({
                channel_id: channelId,
                message_ts: message.ts,
                error: msgError instanceof Error ? msgError.message : String(msgError),
              });
            }
          }
        } catch (channelError) {
          console.error("Error processing channel:", channelError);
          channelDetails.error = channelError instanceof Error ? channelError.message : String(channelError);
          syncDetails.errors.push({
            channel_id: channelId,
            error: channelError instanceof Error ? channelError.message : String(channelError),
          });
        }

        syncDetails.channels.push(channelDetails);
      }

      // Update sync log with success
      await supabaseClient
        .from("slack_sync_logs")
        .update({
          sync_completed_at: new Date().toISOString(),
          status: "completed",
          messages_synced: messagesSynced,
          messages_failed: messagesFailed,
          sync_details: syncDetails,
        })
        .eq("id", syncLog.id);

      // Update last sync time on config
      await supabaseClient
        .from("slack_sync_config")
        .update({
          last_sync_at: new Date().toISOString(),
        })
        .eq("id", syncConfigId);

      return new Response(
        JSON.stringify({
          success: true,
          messages_synced: messagesSynced,
          messages_failed: messagesFailed,
          channels_processed: syncConfig.channel_ids.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      // Update sync log with failure
      await supabaseClient
        .from("slack_sync_logs")
        .update({
          sync_completed_at: new Date().toISOString(),
          status: "failed",
          error_message: error instanceof Error ? error.message : String(error),
          messages_synced: messagesSynced,
          messages_failed: messagesFailed,
          sync_details: syncDetails,
        })
        .eq("id", syncLog.id);

      throw error;
    }
  } catch (error) {
    console.error("Slack sync error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});