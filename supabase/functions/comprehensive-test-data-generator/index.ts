import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  component: string;
  success: boolean;
  records_created: number;
  errors: string[];
  duration_ms: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting comprehensive test data generation...');
    
    const results: TestResult[] = [];
    const startTime = Date.now();

    // Get test customer
    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    const customerId = customers?.[0]?.id || '710092dc-c33c-4f8e-8c65-11fc62982c96';
    
    // Try to get the dedicated test user first (test.user@obera.app)
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    let testUserId = users?.find(u => u.email === 'test.user@obera.app')?.id;
    
    // If test user doesn't exist, use first available user
    if (!testUserId && users && users.length > 0) {
      testUserId = users[0].id;
    }
    
    // Skip tests that require a user if no user exists
    if (!testUserId) {
      console.log('Warning: No user found. Please create a test user first.');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No test user found. Please create a test user using the "Create Test User" button in the Testing Dashboard.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Knowledge Base Component
    const kbStart = Date.now();
    const kbErrors: string[] = [];
    let kbCount = 0;

    try {
      // Create categories
      const { data: categories, error: catError } = await supabase
        .from('knowledge_categories')
        .insert([
          { name: 'Security', description: 'Security policies', icon_name: 'Shield' },
          { name: 'IT Ops', description: 'IT procedures', icon_name: 'Server' },
        ])
        .select();

      if (catError) throw catError;
      kbCount += categories?.length || 0;

      // Create articles
      const { data: articles, error: artError } = await supabase
        .from('knowledge_articles')
        .insert([
          {
            customer_id: customerId,
            category_id: categories?.[0]?.id,
            title: 'Password Policy',
            content: 'Passwords must be 12+ chars.',
            article_type: 'sop',
            status: 'published',
            created_by: testUserId,
            tags: ['security']
          },
        ])
        .select();

      if (artError) throw artError;
      kbCount += articles?.length || 0;

    } catch (err) {
      const errorMsg = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null
        ? JSON.stringify(err)
        : String(err);
      kbErrors.push(errorMsg);
    }

    results.push({
      component: 'Knowledge Base',
      success: kbErrors.length === 0,
      records_created: kbCount,
      errors: kbErrors,
      duration_ms: Date.now() - kbStart
    });

    // 2. AI Interactions Component
    const aiStart = Date.now();
    const aiErrors: string[] = [];
    let aiCount = 0;

    try {
      const conversationId = crypto.randomUUID();
      
      const { data: interactions, error: aiError } = await supabase
        .from('ai_interactions')
        .insert([
          {
            customer_id: customerId,
            user_id: testUserId,
            conversation_id: conversationId,
            interaction_type: 'query',
            user_query: 'What is our password policy?',
            ai_response: 'Passwords must be 12+ characters.',
            confidence_score: 0.95,
            insight_generated: true,
            was_helpful: true,
            feedback_rating: 5,
            compliance_tags: ['security']
          },
        ])
        .select();

      if (aiError) throw aiError;
      aiCount = interactions?.length || 0;

    } catch (err) {
      const errorMsg = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null
        ? JSON.stringify(err)
        : String(err);
      aiErrors.push(errorMsg);
    }

    results.push({
      component: 'AI Interactions',
      success: aiErrors.length === 0,
      records_created: aiCount,
      errors: aiErrors,
      duration_ms: Date.now() - aiStart
    });

    // 3. Audit Logs Component
    const auditStart = Date.now();
    const auditErrors: string[] = [];
    let auditCount = 0;

    try {
      const { data: logs, error: auditError } = await supabase
        .from('audit_logs')
        .insert([
          {
            customer_id: customerId,
            user_id: testUserId,
            system_name: 'users',
            action_type: 'created',
            action_details: { username: 'testuser' },
            compliance_tags: ['access']
          },
        ])
        .select();

      if (auditError) throw auditError;
      auditCount = logs?.length || 0;

    } catch (err) {
      const errorMsg = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null
        ? JSON.stringify(err)
        : String(err);
      auditErrors.push(errorMsg);
    }

    results.push({
      component: 'Audit Logs',
      success: auditErrors.length === 0,
      records_created: auditCount,
      errors: auditErrors,
      duration_ms: Date.now() - auditStart
    });

    // 4. Behavioral Events Component
    const behaviorStart = Date.now();
    const behaviorErrors: string[] = [];
    let behaviorCount = 0;

    try {
      const { data: events, error: behaviorError } = await supabase
        .from('behavioral_events')
        .insert([
          {
            customer_id: customerId,
            user_id: testUserId,
            system_name: 'portal',
            event_type: 'page_view',
            action: 'viewed_dashboard',
            duration_ms: 45000,
            context: { page: '/dashboard' },
            compliance_tags: ['usage']
          },
        ])
        .select();

      if (behaviorError) throw behaviorError;
      behaviorCount = events?.length || 0;

    } catch (err) {
      const errorMsg = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null
        ? JSON.stringify(err)
        : String(err);
      behaviorErrors.push(errorMsg);
    }

    results.push({
      component: 'Behavioral Events',
      success: behaviorErrors.length === 0,
      records_created: behaviorCount,
      errors: behaviorErrors,
      duration_ms: Date.now() - behaviorStart
    });

    // 5. Anomaly Detection Component
    const anomalyStart = Date.now();
    const anomalyErrors: string[] = [];
    let anomalyCount = 0;

    try {
      const { data: anomalies, error: anomalyError } = await supabase
        .from('anomaly_detections')
        .insert([
          {
            customer_id: customerId,
            affected_user_id: testUserId,
            anomaly_type: 'unusual_access',
            severity: 'medium',
            system_name: 'access',
            description: 'Unusual access pattern detected',
            detection_method: 'ml',
            confidence_score: 0.82,
            status: 'investigating',
            compliance_tags: ['security']
          },
          {
            customer_id: customerId,
            anomaly_type: 'failed_login',
            severity: 'high',
            system_name: 'auth',
            description: 'Multiple failed logins',
            detection_method: 'threshold',
            confidence_score: 0.95,
            status: 'new',
            compliance_tags: ['security']
          }
        ])
        .select();

      if (anomalyError) throw anomalyError;
      anomalyCount = anomalies?.length || 0;

    } catch (err) {
      const errorMsg = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null
        ? JSON.stringify(err)
        : String(err);
      anomalyErrors.push(errorMsg);
    }

    results.push({
      component: 'Anomaly Detection',
      success: anomalyErrors.length === 0,
      records_created: anomalyCount,
      errors: anomalyErrors,
      duration_ms: Date.now() - anomalyStart
    });

    // 6. MCP Servers Component
    const mcpStart = Date.now();
    const mcpErrors: string[] = [];
    let mcpCount = 0;

    try {
      const { data: servers, error: serverError } = await supabase
        .from('mcp_servers')
        .insert([
          {
            customer_id: customerId,
            server_name: 'Compliance Server',
            server_type: 'compliance',
            description: 'Compliance automation',
            status: 'active',
            capabilities: ['validation'],
            last_health_check: new Date().toISOString()
          },
          {
            customer_id: customerId,
            server_name: 'Operations Server',
            server_type: 'operations',
            description: 'Operations automation',
            status: 'active',
            capabilities: ['monitoring'],
            last_health_check: new Date().toISOString()
          }
        ])
        .select();

      if (serverError) throw serverError;
      mcpCount = servers?.length || 0;

      // Create tools for servers
      if (servers && servers.length > 0) {
        const { data: tools, error: toolError } = await supabase
          .from('mcp_tools')
          .insert([
            {
              server_id: servers[0].id,
              tool_name: 'validate_evidence',
              description: 'Validates compliance evidence files',
              input_schema: { type: 'object', properties: { file_id: { type: 'string' } } },
              execution_count: 15
            },
            {
              server_id: servers[1].id,
              tool_name: 'check_backup_status',
              description: 'Checks the status of system backups',
              input_schema: { type: 'object', properties: { system_id: { type: 'string' } } },
              execution_count: 42
            }
          ])
          .select();

        if (!toolError) mcpCount += tools?.length || 0;
      }

    } catch (err) {
      const errorMsg = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null
        ? JSON.stringify(err)
        : String(err);
      mcpErrors.push(errorMsg);
    }

    results.push({
      component: 'MCP Servers',
      success: mcpErrors.length === 0,
      records_created: mcpCount,
      errors: mcpErrors,
      duration_ms: Date.now() - mcpStart
    });

    // 7. ML Insights Component
    const mlStart = Date.now();
    const mlErrors: string[] = [];
    let mlCount = 0;

    try {
      const { data: insights, error: mlError } = await supabase
        .from('ml_insights')
        .insert([
          {
            customer_id: customerId,
            insight_type: 'risk',
            title: 'Access Control Gap',
            description: 'Gap detected in documentation',
            confidence_score: 0.87,
            priority: 'high',
            status: 'pending_review',
            recommended_actions: ['Review policies']
          },
          {
            customer_id: customerId,
            insight_type: 'optimization',
            title: 'Workflow Improvement',
            description: 'Workflow could be optimized',
            confidence_score: 0.92,
            priority: 'medium',
            status: 'pending_review',
            recommended_actions: ['Enable optimization']
          }
        ])
        .select();

      if (mlError) throw mlError;
      mlCount = insights?.length || 0;

    } catch (err) {
      const errorMsg = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null
        ? JSON.stringify(err)
        : String(err);
      mlErrors.push(errorMsg);
    }

    results.push({
      component: 'ML Insights',
      success: mlErrors.length === 0,
      records_created: mlCount,
      errors: mlErrors,
      duration_ms: Date.now() - mlStart
    });

    // 8. Client Onboarding Component
    const onboardingStart = Date.now();
    const onboardingErrors: string[] = [];
    let onboardingCount = 0;

    try {
      // Get a template
      const { data: templates } = await supabase
        .from('onboarding_templates')
        .select('id')
        .limit(1);

      if (templates && templates.length > 0) {
        const { data: onboardings, error: onboardingError } = await supabase
          .from('client_onboardings')
          .insert([
            {
              customer_id: customerId,
              template_id: templates[0].id,
              client_name: 'Test Corp',
              client_contact_email: 'test@test.com',
              client_contact_name: 'Test User',
              status: 'in_progress',
              start_date: new Date().toISOString().split('T')[0],
              created_by: testUserId,
              completion_percentage: 35
            }
          ])
          .select();

        if (onboardingError) throw onboardingError;
        onboardingCount = onboardings?.length || 0;
      }

    } catch (err) {
      const errorMsg = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null
        ? JSON.stringify(err)
        : String(err);
      onboardingErrors.push(errorMsg);
    }

    results.push({
      component: 'Client Onboarding',
      success: onboardingErrors.length === 0,
      records_created: onboardingCount,
      errors: onboardingErrors,
      duration_ms: Date.now() - onboardingStart
    });

    const totalDuration = Date.now() - startTime;
    const totalRecords = results.reduce((sum, r) => sum + r.records_created, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log(`Test data generation complete: ${totalRecords} records in ${totalDuration}ms`);

    return new Response(
      JSON.stringify({
        success: totalErrors === 0,
        summary: {
          total_components: results.length,
          total_records_created: totalRecords,
          total_errors: totalErrors,
          total_duration_ms: totalDuration
        },
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in comprehensive-test-data-generator:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
