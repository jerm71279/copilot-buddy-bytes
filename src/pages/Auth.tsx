import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";

import { userProfileSchema, sanitizeText } from "@/lib/validation";
import { handleUserSignUp, handleUserSignIn } from "@/lib/authHelpers";
import { 
  getOrCreateDefaultCustomer, 
  linkUserToCustomer, 
  createEmployeeOnboarding 
} from "@/lib/onboardingHelpers";

// Enhanced validation schemas with security requirements
const loginSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(1, "Password is required")
    .max(128, "Password must be less than 128 characters"),
});

const signupSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens and apostrophes"),
  emailUsername: z.string()
    .trim()
    .min(2, "Email username must be at least 2 characters")
    .max(64, "Email username must be less than 64 characters")
    .regex(/^[a-z]+\.[a-z]+$/i, "Email must be in Firstname.Lastname format"),
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
});

const resetPasswordSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmailUsername, setSignupEmailUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await redirectToDepartmentDashboard(session.user.id);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await redirectToDepartmentDashboard(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const redirectToDepartmentDashboard = async (userId: string) => {
    // Check if user has Super Admin/Admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", userId);

    let hasAdmin = roles?.some((ur: any) => ur.roles?.name === 'Super Admin' || ur.roles?.name === 'Admin');

    if (!hasAdmin) {
      const { data: rpcHasAdmin } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });
      hasAdmin = !!rpcHasAdmin;
    }

    if (hasAdmin) {
      navigate("/admin");
      return;
    }

    // Check user profile for department
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("department")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.department) {
      const dashboardRoutes: Record<string, string> = {
        compliance: "/dashboard/compliance",
        it: "/dashboard/it",
        operations: "/dashboard/operations",
        hr: "/dashboard/hr",
        finance: "/dashboard/finance",
        executive: "/dashboard/executive"
      };

      const route = dashboardRoutes[profile.department];
      if (route) {
        navigate(route);
        return;
      }
    }

    // Default to portal for users without specific department
    navigate("/portal");
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedEmail = z.string().trim().email().parse(resetEmail);
      
      const { error } = await supabase.auth.resetPasswordForEmail(validatedEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      // Log security event - no customer_id available for password reset
      // Skip audit log to avoid foreign key constraint
      toast.success("Password reset email sent! Check your inbox.");
      setShowResetForm(false);
      setResetEmail("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error("Please enter a valid email address");
      } else {
        toast.error("Failed to send reset email");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate inputs
      const validatedData = loginSchema.parse({
        email: loginEmail,
        password: loginPassword,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        // Log failed login attempt - no customer_id available yet
        // Skip audit log for failed login to avoid foreign key constraint
        toast.error(error.message === 'Invalid login credentials' ? 'Invalid email or password' : error.message);
      } else {
        // Log successful login - fetch customer_id first
        if (data.user) {
        const { data: profileData } = await supabase
            .from('user_profiles')
            .select('customer_id')
            .eq('user_id', data.user.id)
            .maybeSingle();

          if (profileData?.customer_id) {
            await supabase.from('audit_logs').insert({
              user_id: data.user.id,
              customer_id: profileData.customer_id,
              system_name: 'auth',
              action_type: 'login_success',
              action_details: { 
                email: validatedData.email,
                timestamp: new Date().toISOString() 
              },
              compliance_tags: ['security', 'authentication']
            });
          }
        }
        toast.success("Logged in successfully");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An error occurred during login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'openid email profile User.Read Calendars.Read Mail.Read Files.Read.All Chat.Read',
          redirectTo: `${window.location.origin}/portal`,
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Microsoft");
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate inputs
      const validatedData = signupSchema.parse({
        fullName: signupName,
        emailUsername: signupEmailUsername,
        password: signupPassword,
      });

      // Use centralized auth helper
      const signUpResult = await handleUserSignUp({
        emailUsername: validatedData.emailUsername,
        password: validatedData.password,
        fullName: validatedData.fullName
      });

      if (!signUpResult.success || !signUpResult.userId) {
        toast.error(signUpResult.error || "Signup failed - please try again");
        setIsLoading(false);
        return;
      }

      // Call edge function to complete signup with service role privileges
      const { data: signupResult, error: signupCompleteError } = await supabase.functions.invoke(
        'complete-user-signup',
        {
          body: {
            userId: signUpResult.userId,
            fullName: validatedData.fullName,
            emailUsername: validatedData.emailUsername
          }
        }
      );

      if (signupCompleteError || !signupResult?.success) {
        console.error("Failed to complete signup:", signupCompleteError);
        toast.error("Account created but setup incomplete. Please contact support or try logging in.");
        setIsLoading(false);
        return;
      }

      toast.success("Account created successfully! Your onboarding has been initiated.");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        const errorMessage = error.message?.includes('already registered')
          ? 'An account with this email already exists'
          : error.message || "An error occurred during signup";
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">OBERACONNECT Employee Portal</CardTitle>
          <CardDescription>Sign in to access your employee portal or create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Customer Portal Link */}
          <div className="mb-6">
            <Link to="/client-auth">
              <Button variant="outline" className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                Customer Portal Login
              </Button>
            </Link>
            <Separator className="my-4" />
          </div>

          {/* Microsoft 365 SSO - Primary Authentication */}
          <div className="space-y-4 mb-6">
            <Button 
              onClick={handleMicrosoftSignIn}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 text-base font-medium"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23">
                <path fill="#f35325" d="M0 0h11v11H0z"/>
                <path fill="#81bc06" d="M12 0h11v11H12z"/>
                <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                <path fill="#ffba08" d="M12 12h11v11H12z"/>
              </svg>
              Sign in with Microsoft 365
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              {showResetForm ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setShowResetForm(false);
                        setResetEmail("");
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowResetForm(true)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors text-center w-full"
                  >
                    Forgot your password?
                  </button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-company">Company Name</Label>
                  <Input
                    id="signup-company"
                    type="text"
                    value="OBERACONNECT, LLC"
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Username</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="signup-email"
                      type="text"
                      placeholder="Firstname.Lastname"
                      value={signupEmailUsername}
                      onChange={(e) => setSignupEmailUsername(e.target.value)}
                      required
                      className="flex-1"
                    />
                    <span className="text-muted-foreground text-sm whitespace-nowrap">@oberaconnect.com</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Format: Firstname.Lastname</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={12}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be 12+ characters with uppercase, lowercase, number, and special character
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;