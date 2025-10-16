import { supabase } from "@/integrations/supabase/client";
import { 
  sanitizeFullName, 
  sanitizeEmailUsername, 
  hasControlCharacters 
} from "./sanitization";

interface SignUpParams {
  emailUsername: string;
  password: string;
  fullName: string;
}

interface SignUpResult {
  success: boolean;
  error?: string;
  userId?: string;
}

/**
 * Handle user signup with sanitization and validation
 */
export async function handleUserSignUp(params: SignUpParams): Promise<SignUpResult> {
  const { emailUsername, password, fullName } = params;

  // Validate password doesn't contain control characters
  if (hasControlCharacters(password)) {
    return {
      success: false,
      error: "Password contains invalid characters. Please remove control characters."
    };
  }

  // Sanitize inputs
  const safeEmailUsername = sanitizeEmailUsername(emailUsername);
  const safeFullName = sanitizeFullName(fullName);
  const fullEmail = `${safeEmailUsername}@oberaconnect.com`;
  const redirectUrl = `${window.location.origin}/`;

  // Attempt signup
  const { data, error } = await supabase.auth.signUp({
    email: fullEmail,
    password: password,
    options: {
      emailRedirectTo: redirectUrl,
      data: { full_name: safeFullName }
    }
  });

  if (error) {
    return {
      success: false,
      error: error.message
    };
  }

  if (!data.user) {
    return {
      success: false,
      error: "Signup failed - no user returned"
    };
  }

  return {
    success: true,
    userId: data.user.id
  };
}

/**
 * Handle user sign in
 */
export async function handleUserSignIn(emailUsername: string, password: string): Promise<SignUpResult> {
  const safeEmailUsername = sanitizeEmailUsername(emailUsername);
  const fullEmail = `${safeEmailUsername}@oberaconnect.com`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: fullEmail,
    password: password,
  });

  if (error) {
    return {
      success: false,
      error: error.message
    };
  }

  if (!data.user) {
    return {
      success: false,
      error: "Sign in failed - no user returned"
    };
  }

  return {
    success: true,
    userId: data.user.id
  };
}
