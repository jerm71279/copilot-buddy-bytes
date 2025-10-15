import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData = await req.json();
    
    // Validate input
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const customer_id = String(requestData.customer_id || '').slice(0, 100);

    if (!customer_id) {
      return new Response(
        JSON.stringify({ error: 'customer_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Seeding comprehensive security training for customer:', customer_id);

    // 1. Create comprehensive training modules
    const modules = [
      {
        customer_id,
        module_name: 'Introduction to Cybersecurity',
        module_type: 'platform_security',
        description: 'Learn the fundamentals of cybersecurity, common threats, and how to protect yourself and the organization.',
        duration_minutes: 20,
        content_url: null,
        is_mandatory: true,
        passing_score: 80,
        version: '1.0',
      },
      {
        customer_id,
        module_name: 'Phishing Detection & Prevention',
        module_type: 'data_handling',
        description: 'Master the art of identifying phishing attempts, understand common tactics used by attackers, and learn best practices for reporting suspicious emails.',
        duration_minutes: 25,
        content_url: null,
        is_mandatory: true,
        passing_score: 85,
        version: '1.0',
      },
      {
        customer_id,
        module_name: 'Password Security & Multi-Factor Authentication',
        module_type: 'platform_security',
        description: 'Understand password best practices, learn how to create strong passwords, and discover why MFA is critical for security.',
        duration_minutes: 15,
        content_url: null,
        is_mandatory: true,
        passing_score: 80,
        version: '1.0',
      },
      {
        customer_id,
        module_name: 'Data Classification & Handling',
        module_type: 'data_handling',
        description: 'Learn how to classify data based on sensitivity, understand proper handling procedures, and know when to escalate concerns.',
        duration_minutes: 20,
        content_url: null,
        is_mandatory: true,
        passing_score: 85,
        version: '1.0',
      },
      {
        customer_id,
        module_name: 'Social Engineering Awareness',
        module_type: 'compliance',
        description: 'Recognize social engineering tactics, understand psychological manipulation techniques, and learn defensive strategies.',
        duration_minutes: 20,
        content_url: null,
        is_mandatory: true,
        passing_score: 80,
        version: '1.0',
      },
      {
        customer_id,
        module_name: 'Incident Response & Reporting',
        module_type: 'incident_response',
        description: 'Know what constitutes a security incident, understand reporting procedures, and learn your role in incident response.',
        duration_minutes: 15,
        content_url: null,
        is_mandatory: true,
        passing_score: 85,
        version: '1.0',
      },
      {
        customer_id,
        module_name: 'Secure Remote Work Practices',
        module_type: 'platform_security',
        description: 'Learn best practices for working remotely securely, including VPN usage, public Wi-Fi risks, and device security.',
        duration_minutes: 20,
        content_url: null,
        is_mandatory: false,
        passing_score: 75,
        version: '1.0',
      },
      {
        customer_id,
        module_name: 'Mobile Device Security',
        module_type: 'platform_security',
        description: 'Protect company data on mobile devices, understand BYOD policies, and learn mobile-specific threats.',
        duration_minutes: 15,
        content_url: null,
        is_mandatory: false,
        passing_score: 75,
        version: '1.0',
      },
      {
        customer_id,
        module_name: 'Compliance & Regulatory Requirements',
        module_type: 'compliance',
        description: 'Understand relevant compliance frameworks (GDPR, HIPAA, SOC 2) and your responsibilities in maintaining compliance.',
        duration_minutes: 30,
        content_url: null,
        is_mandatory: true,
        passing_score: 85,
        version: '1.0',
      },
      {
        customer_id,
        module_name: 'Advanced Threat Detection',
        module_type: 'platform_security',
        description: 'Deep dive into advanced persistent threats, ransomware, and sophisticated attack vectors.',
        duration_minutes: 35,
        content_url: null,
        is_mandatory: false,
        passing_score: 80,
        version: '1.0',
      }
    ];

    const { data: insertedModules, error: modulesError } = await supabase
      .from('security_training_modules')
      .upsert(modules, { onConflict: 'customer_id,module_name' })
      .select();

    if (modulesError) throw modulesError;

    console.log(`Created ${insertedModules.length} training modules`);

    // 2. Create quiz questions for phishing module
    const phishingModule = insertedModules.find(m => m.module_name === 'Phishing Detection & Prevention');
    
    if (phishingModule) {
      const questions = [
        {
          module_id: phishingModule.id,
          question_text: 'Which of the following is a common indicator of a phishing email?',
          question_type: 'multiple_choice',
          options: JSON.stringify([
            'Generic greetings like "Dear Customer"',
            'Urgent language creating a sense of panic',
            'Suspicious sender email address',
            'All of the above'
          ]),
          correct_answers: JSON.stringify([3]),
          explanation: 'Phishing emails often use multiple tactics: generic greetings, urgent language, and suspicious sender addresses to trick recipients.',
          points: 2,
          sequence_order: 1
        },
        {
          module_id: phishingModule.id,
          question_text: 'What should you do if you receive a suspicious email asking for your password?',
          question_type: 'multiple_choice',
          options: JSON.stringify([
            'Reply with your password if it seems legitimate',
            'Click the link to verify your account',
            'Delete it immediately and report it to IT security',
            'Forward it to coworkers to warn them'
          ]),
          correct_answers: JSON.stringify([2]),
          explanation: 'Never provide your password via email. Always delete suspicious emails and report them to your IT security team immediately.',
          points: 2,
          sequence_order: 2
        },
        {
          module_id: phishingModule.id,
          question_text: 'Hovering over a link in an email will show you the actual URL destination.',
          question_type: 'true_false',
          options: JSON.stringify(['True', 'False']),
          correct_answers: JSON.stringify([0]),
          explanation: 'True. Hovering over a link (without clicking) reveals the actual destination URL, which may differ from the displayed text.',
          points: 1,
          sequence_order: 3
        },
        {
          module_id: phishingModule.id,
          question_text: 'Select all that are red flags in a phishing email:',
          question_type: 'multi_select',
          options: JSON.stringify([
            'Spelling and grammar errors',
            'Requests for sensitive information',
            'Mismatched or suspicious URLs',
            'Unexpected attachments',
            'Professional company logo'
          ]),
          correct_answers: JSON.stringify([0, 1, 2, 3]),
          explanation: 'Multiple red flags can appear together. A professional logo alone doesn\'t guarantee legitimacy - attackers often copy company branding.',
          points: 3,
          sequence_order: 4
        },
        {
          module_id: phishingModule.id,
          question_text: 'If an email claims to be from your CEO requesting an urgent wire transfer, you should:',
          question_type: 'multiple_choice',
          options: JSON.stringify([
            'Process it immediately since it\'s from the CEO',
            'Verify the request through a separate, known communication channel',
            'Reply to the email asking for confirmation',
            'Forward it to accounting to handle'
          ]),
          correct_answers: JSON.stringify([1]),
          explanation: 'Always verify unusual requests through a separate channel (phone call, in-person) even if they appear to come from executives. This is a common "CEO fraud" tactic.',
          points: 2,
          sequence_order: 5
        }
      ];

      const { error: questionsError } = await supabase
        .from('security_training_questions')
        .upsert(questions, { onConflict: 'module_id,sequence_order' });

      if (questionsError) throw questionsError;

      console.log(`Created ${questions.length} quiz questions for phishing module`);
    }

    // 3. Create phishing simulation campaigns
    const simulations = [
      {
        customer_id,
        campaign_name: 'Password Reset Scam',
        description: 'Simulates a fake password reset email from IT department',
        simulation_type: 'email',
        difficulty_level: 'easy',
        template_content: JSON.stringify({
          subject: 'URGENT: Password Reset Required',
          from_name: 'IT Support',
          from_email: 'it-support@{company-domain}.com',
          body: `Dear Employee,

Our systems have detected unusual activity on your account. For security purposes, you must reset your password immediately.

Click here to reset your password: [PHISHING_LINK]

If you do not reset your password within 24 hours, your account will be suspended.

Best regards,
IT Security Team`,
          call_to_action: 'Click here to reset your password'
        }),
        target_indicators: JSON.stringify([
          'Urgent language and threats',
          'Suspicious sender email',
          'Generic greeting',
          'Unusual link destination',
          'Pressure to act quickly'
        ]),
        educational_content: 'Legitimate IT departments will never ask you to reset your password via email links. Always navigate directly to the official website or contact IT directly.',
        is_active: true
      },
      {
        customer_id,
        campaign_name: 'Executive Impersonation',
        description: 'Simulates an email from company executive requesting urgent action',
        simulation_type: 'email',
        difficulty_level: 'medium',
        template_content: JSON.stringify({
          subject: 'Urgent: Need your help',
          from_name: 'CEO Name',
          from_email: 'ceo@{company-domain}.co',
          body: `Hi,

I'm in a meeting and need you to handle something urgently. Can you purchase some gift cards for a client event? I'll reimburse you.

Please get $500 in iTunes gift cards and send me the codes ASAP.

Thanks!`,
          call_to_action: 'Reply with gift card codes'
        }),
        target_indicators: JSON.stringify([
          'Slight domain variation (.co instead of .com)',
          'Unusual request from executive',
          'Request for gift cards',
          'Urgency and time pressure',
          'Personal tone unlike typical business communication'
        ]),
        educational_content: 'CEO fraud and executive impersonation are common. Always verify unusual requests through a known phone number or in-person, especially for financial transactions.',
        is_active: true
      },
      {
        customer_id,
        campaign_name: 'Shipping Notification Scam',
        description: 'Fake package delivery notification with malicious tracking link',
        simulation_type: 'email',
        difficulty_level: 'medium',
        template_content: JSON.stringify({
          subject: 'Package Delivery Attempted - Action Required',
          from_name: 'FedEx Delivery',
          from_email: 'notify@fedex-delivery.com',
          body: `Dear Customer,

We attempted to deliver your package today but no one was available to receive it.

Your package will be returned to sender unless you schedule a redelivery within 48 hours.

Track your package: [PHISHING_LINK]

Package ID: PKG-7382910-US
Delivery Date: Today

FedEx Customer Service`,
          call_to_action: 'Track your package'
        }),
        target_indicators: JSON.stringify([
          'Unexpected package notification',
          'Suspicious sender domain',
          'Time pressure (48 hours)',
          'Generic greeting',
          'Link doesn\'t go to official FedEx website'
        ]),
        educational_content: 'Be cautious of unexpected delivery notifications. Verify tracking numbers directly on the carrier\'s official website rather than clicking email links.',
        is_active: true
      },
      {
        customer_id,
        campaign_name: 'Microsoft 365 Security Alert',
        description: 'Fake security alert claiming Microsoft account compromise',
        simulation_type: 'email',
        difficulty_level: 'hard',
        template_content: JSON.stringify({
          subject: 'Microsoft Account: Unusual sign-in activity',
          from_name: 'Microsoft Account Team',
          from_email: 'account-security@microsoft.com',
          body: `We detected unusual sign-in activity on your Microsoft account.

Sign-in details:
Location: Russia, Moscow
Device: Unknown Windows PC
Time: 2 hours ago

If this wasn't you, secure your account immediately:
[PHISHING_LINK]

Microsoft Account Team
This is an automated message. Please do not reply.`,
          call_to_action: 'Secure your account'
        }),
        target_indicators: JSON.stringify([
          'Look-alike domain (may use unicode characters)',
          'Creates fear with foreign location',
          'Professional formatting mimics real Microsoft emails',
          'Subtle URL differences',
          'No personalization with your name'
        ]),
        educational_content: 'Advanced phishing uses professional templates and creates urgency through fear. Always verify security alerts by logging in directly through official websites, not email links.',
        is_active: true
      },
      {
        customer_id,
        campaign_name: 'LinkedIn Connection Scam',
        description: 'Fake LinkedIn connection request with malicious profile link',
        simulation_type: 'social_media',
        difficulty_level: 'hard',
        template_content: JSON.stringify({
          subject: 'Professional wants to connect with you on LinkedIn',
          from_name: 'LinkedIn',
          from_email: 'invitations@linkedln.com',
          body: `Hi there,

John Smith wants to connect with you on LinkedIn.

John Smith
Senior Recruiter at Fortune 500 Company
500+ connections

View John's full profile: [PHISHING_LINK]

You are receiving LinkedIn invitation emails. Unsubscribe here.

© 2025 LinkedIn Corporation`,
          call_to_action: 'View profile and connect'
        }),
        target_indicators: JSON.stringify([
          'Domain typosquatting: "linkedln" vs "linkedin"',
          'Vague job title and company',
          'Generic message',
          'Link doesn\'t go to linkedin.com',
          'May target employees who might be job hunting'
        ]),
        educational_content: 'Attackers use social media impersonation to gather information or deliver malware. Verify connections directly on the official platform, not through email links.',
        is_active: true
      }
    ];

    const { data: insertedSimulations, error: simulationsError } = await supabase
      .from('phishing_simulations')
      .upsert(simulations, { onConflict: 'customer_id,campaign_name' })
      .select();

    if (simulationsError) throw simulationsError;

    console.log(`Created ${insertedSimulations.length} phishing simulations`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Comprehensive security training seeded successfully',
        modules_created: insertedModules.length,
        simulations_created: insertedSimulations.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error seeding security training:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});