import { getAuthContext } from '../_shared/supabaseAuth.ts';

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
    // Authenticate user and get context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { supabase, userId, customerId } = await getAuthContext(authHeader);

    // Validate request body
    const rawBody = await req.json();
    if (!rawBody || typeof rawBody !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ...requestData } = rawBody;

    // Validate action
    const validActions = ['grant', 'revoke', 'list'];
    if (!action || typeof action !== 'string' || !validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be grant, revoke, or list' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's customer_id (redundant since we have it from shared auth, but keeping for validation)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('customer_id')
      .eq('user_id', userId)
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
        result = await grantPermission(requestData as PermissionRequest, customerId, userId, supabase);
        break;
      case 'revoke':
        result = await revokePermission(requestData.permission_id, supabase);
        break;
      case 'list':
        result = await listPermissions(requestData.file_id, supabase);
        break;
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to manage permissions';
    return new Response(
      JSON.stringify({ error: errorMessage }),
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
  // Validate file_id (UUID format)
  const file_id = String(request.file_id || '').trim();
  if (!file_id || file_id.length > 100) {
    throw new Error('file_id is required and must be valid');
  }

  // Validate permission_level
  const validLevels = ['read', 'write', 'admin', 'owner'];
  if (!request.permission_level || !validLevels.includes(request.permission_level)) {
    throw new Error('permission_level must be read, write, admin, or owner');
  }

  // Validate at least one target is provided
  if (!request.user_id && !request.role_id && !request.department) {
    throw new Error('At least one of user_id, role_id, or department must be provided');
  }

  // Validate user_id if provided
  if (request.user_id) {
    const user_id = String(request.user_id).trim();
    if (user_id.length > 100) {
      throw new Error('user_id must be less than 100 characters');
    }
  }

  // Validate role_id if provided
  if (request.role_id) {
    const role_id = String(request.role_id).trim();
    if (role_id.length > 100) {
      throw new Error('role_id must be less than 100 characters');
    }
  }

  // Validate department if provided
  if (request.department) {
    const department = String(request.department).trim();
    if (department.length > 100) {
      throw new Error('department must be less than 100 characters');
    }
  }

  // Validate expires_at if provided (ISO date string)
  if (request.expires_at) {
    const expires_at = String(request.expires_at).trim();
    if (expires_at.length > 50 || !expires_at.match(/^\d{4}-\d{2}-\d{2}/)) {
      throw new Error('expires_at must be a valid ISO date string');
    }
  }

  // Get file to verify it exists
  const { data: file, error: fileError } = await supabase
    .from('file_metadata')
    .select('id, customer_id')
    .eq('id', file_id)
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
    .eq('file_id', file_id);

  if (request.user_id) query = query.eq('user_id', request.user_id);
  if (request.role_id) query = query.eq('role_id', request.role_id);
  if (request.department) query = query.eq('department', request.department);

  const { data: existing } = await query.maybeSingle();

  const permissionData = {
    customer_id: customerId,
    file_id: file_id,
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
  // Validate permission_id (UUID format)
  const permission_id = String(permissionId || '').trim();
  if (!permission_id || permission_id.length > 100) {
    throw new Error('permission_id is required and must be valid');
  }

  const { error } = await supabase
    .from('file_permissions')
    .delete()
    .eq('id', permission_id);

  if (error) throw error;

  return { message: 'Permission revoked successfully' };
}

async function listPermissions(fileId: string, supabase: any) {
  // Validate file_id (UUID format)
  const file_id = String(fileId || '').trim();
  if (!file_id || file_id.length > 100) {
    throw new Error('file_id is required and must be valid');
  }

  const { data, error } = await supabase
    .from('file_permissions')
    .select(`
      *,
      user_profiles!file_permissions_user_id_fkey(user_id, full_name),
      roles!file_permissions_role_id_fkey(id, name)
    `)
    .eq('file_id', file_id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}
