import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PermissionRequest {
  file_id: string;
  user_id?: string;
  role_id?: string;
  department?: string;
  permission_level: 'read' | 'write' | 'admin' | 'owner';
  expires_at?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = await req.json();
    
    if (!requestBody || typeof requestBody !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const action = String(requestBody.action || '').slice(0, 20);

    if (!['grant', 'revoke', 'list'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be grant, revoke, or list' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's customer_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    switch (action) {
      case 'grant':
        result = await grantPermission(requestBody as PermissionRequest, profile.customer_id, user.id, supabase);
        break;
      case 'revoke':
        result = await revokePermission(requestBody.permission_id, supabase);
        break;
      case 'list':
        result = await listPermissions(requestBody.file_id, supabase);
        break;
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to manage permissions' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function grantPermission(
  request: PermissionRequest,
  customerId: string,
  grantedBy: string,
  supabase: any
) {
  // Validate input
  if (!request.file_id || !request.permission_level) {
    throw new Error('file_id and permission_level are required');
  }

  if (!request.user_id && !request.role_id && !request.department) {
    throw new Error('At least one of user_id, role_id, or department must be provided');
  }

  // Get file to verify it exists
  const { data: file, error: fileError } = await supabase
    .from('file_metadata')
    .select('id, customer_id')
    .eq('id', request.file_id)
    .maybeSingle();

  if (fileError || !file) {
    throw new Error('File not found');
  }

  if (file.customer_id !== customerId) {
    throw new Error('Unauthorized: File belongs to different organization');
  }

  // Check for existing permission
  let query = supabase
    .from('file_permissions')
    .select('id')
    .eq('file_id', request.file_id);

  if (request.user_id) query = query.eq('user_id', request.user_id);
  if (request.role_id) query = query.eq('role_id', request.role_id);
  if (request.department) query = query.eq('department', request.department);

  const { data: existing } = await query.maybeSingle();

  const permissionData = {
    customer_id: customerId,
    file_id: request.file_id,
    user_id: request.user_id,
    role_id: request.role_id,
    department: request.department,
    permission_level: request.permission_level,
    granted_by: grantedBy,
    expires_at: request.expires_at,
    is_inherited: false
  };

  if (existing) {
    // Update existing permission
    const { data, error } = await supabase
      .from('file_permissions')
      .update(permissionData)
      .eq('id', existing.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } else {
    // Create new permission
    const { data, error } = await supabase
      .from('file_permissions')
      .insert(permissionData)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

async function revokePermission(permissionId: string, supabase: any) {
  if (!permissionId) {
    throw new Error('permission_id is required');
  }

  const { error } = await supabase
    .from('file_permissions')
    .delete()
    .eq('id', permissionId);

  if (error) throw error;

  return { message: 'Permission revoked successfully' };
}

async function listPermissions(fileId: string, supabase: any) {
  if (!fileId) {
    throw new Error('file_id is required');
  }

  const { data, error } = await supabase
    .from('file_permissions')
    .select(`
      *,
      user_profiles!file_permissions_user_id_fkey(user_id, full_name),
      roles!file_permissions_role_id_fkey(id, name)
    `)
    .eq('file_id', fileId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}
