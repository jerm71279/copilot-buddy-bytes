import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { BookOpen, Award, Plus, Search, Users, TrendingUp, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface TrainingCourse {
  id: string;
  course_name: string;
  category: string;
  provider: string;
  duration_hours: number;
  delivery_method: string;
  is_mandatory: boolean;
  status: string;
  enrollment_count?: number;
}

interface Certification {
  id: string;
  certification_name: string;
  issuing_organization: string;
  category: string;
  is_required: boolean;
  employee_count?: number;
}

const TrainingDevelopment = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalEnrollments: 0,
    completionRate: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("customer_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.customer_id) {
        toast.error("No customer profile found");
        return;
      }

      // Load training courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("training_courses")
        .select("*")
        .eq("customer_id", profile.customer_id)
        .order("course_name");

      if (coursesError) throw coursesError;

      // Load enrollments
      const { data: enrollmentsData } = await supabase
        .from("employee_training_enrollments")
        .select("course_id, status")
        .eq("customer_id", profile.customer_id);

      const enrollmentCounts = enrollmentsData?.reduce((acc: any, enr) => {
        acc[enr.course_id] = (acc[enr.course_id] || 0) + 1;
        return acc;
      }, {});

      const coursesWithCounts = coursesData?.map(course => ({
        ...course,
        enrollment_count: enrollmentCounts?.[course.id] || 0
      })) || [];

      setCourses(coursesWithCounts);

      // Load certifications
      const { data: certsData, error: certsError } = await supabase
        .from("certifications")
        .select("*")
        .eq("customer_id", profile.customer_id)
        .order("certification_name");

      if (certsError) throw certsError;

      // Load employee certifications
      const { data: empCertsData } = await supabase
        .from("employee_certifications")
        .select("certification_id")
        .eq("customer_id", profile.customer_id)
        .eq("status", "active");

      const certCounts = empCertsData?.reduce((acc: any, cert) => {
        acc[cert.certification_id] = (acc[cert.certification_id] || 0) + 1;
        return acc;
      }, {});

      const certsWithCounts = certsData?.map(cert => ({
        ...cert,
        employee_count: certCounts?.[cert.id] || 0
      })) || [];

      setCertifications(certsWithCounts);

      // Calculate stats
      const completedCount = enrollmentsData?.filter(e => e.status === "completed").length || 0;
      const totalEnrollments = enrollmentsData?.length || 0;

      setStats({
        totalCourses: coursesData?.length || 0,
        activeCourses: coursesData?.filter(c => c.status === "active").length || 0,
        totalEnrollments,
        completionRate: totalEnrollments > 0 ? Math.round((completedCount / totalEnrollments) * 100) : 0,
      });

    } catch (error: any) {
      console.error("Error loading training data:", error);
      toast.error("Failed to load training data");
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCertifications = certifications.filter(cert =>
    cert.certification_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.issuing_organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Training & Development</h1>
          <p className="text-muted-foreground">Manage employee training and certifications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">Training Courses</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => navigate("/hr/training/courses/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Course
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredCourses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No training courses found</p>
                </CardContent>
              </Card>
            ) : (
              filteredCourses.map((course) => (
                <Card 
                  key={course.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate(`/hr/training/courses/${course.id}`)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{course.course_name}</CardTitle>
                        <CardDescription>
                          {course.category} • {course.provider} • {course.duration_hours}h • {course.delivery_method}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {course.is_mandatory && <Badge variant="destructive">Mandatory</Badge>}
                        <Badge variant={course.status === "active" ? "default" : "secondary"}>
                          {course.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {course.enrollment_count} enrollments
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => navigate("/hr/training/certifications/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Certification
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredCertifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Award className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No certifications found</p>
                </CardContent>
              </Card>
            ) : (
              filteredCertifications.map((cert) => (
                <Card 
                  key={cert.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate(`/hr/training/certifications/${cert.id}`)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          {cert.certification_name}
                        </CardTitle>
                        <CardDescription>
                          {cert.issuing_organization} • {cert.category}
                        </CardDescription>
                      </div>
                      {cert.is_required && <Badge variant="destructive">Required</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {cert.employee_count} employees certified
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainingDevelopment;