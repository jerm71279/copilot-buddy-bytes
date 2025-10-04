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
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";

// Validation schemas
const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password too long"),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100, "Name too long"),
  companyName: z.string().trim().min(1, "Company name is required").max(100, "Company name too long"),
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password too long"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupCompany, setSignupCompany] = useState("");
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

    // Default to home page
    navigate("/");
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedEmail = z.string().email().parse(resetEmail);
      
      const { error } = await supabase.auth.resetPasswordForEmail(validatedEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

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

      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        toast.error(error.message);
      } else {
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
          scopes: 'openid email profile User.Read Calendars.Read Mail.Read Files.Read.All',
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
        companyName: signupCompany,
        email: signupEmail,
        password: signupPassword,
      });

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: validatedData.fullName,
            company_name: validatedData.companyName,
          }
        }
      });

      if (error) throw error;
      
      if (data.user) {
        // Create customer record
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .insert({
            user_id: data.user.id,
            contact_name: validatedData.fullName,
            company_name: validatedData.companyName,
            email: validatedData.email,
          })
          .select()
          .single();

        if (customerError) throw customerError;

        // Create customer customization
        if (customerData) {
        const { error: customizationError } = await supabase
            .from("customer_customizations")
            .insert({
              customer_id: customerData.id,
              enabled_features: ["dashboard", "integrations", "compliance", "ml_insights"],
              default_dashboard: "executive",
            });

          if (customizationError) throw customizationError;
        }

        // Create user profile
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            user_id: data.user.id,
            full_name: validatedData.fullName,
            department: null,
            customer_id: customerData?.id || null
          });

        if (profileError) throw profileError;

        toast.success("Account created successfully! Redirecting to your dashboard...");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "An error occurred during signup");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
          <CardDescription>Sign in to access your portal or create a new account</CardDescription>
        </CardHeader>
        <CardContent>
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
                    placeholder="Acme Inc"
                    value={signupCompany}
                    onChange={(e) => setSignupCompany(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
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
                      minLength={6}
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