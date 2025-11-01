import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthService } from "@/services/authService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, CheckCircle, XCircle, AlertCircle, Award, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const SecurityTrainingModule = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [completionId, setCompletionId] = useState<string | null>(null);

  const { data: module } = useQuery({
    queryKey: ["security-module", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_training_modules")
        .select("*")
        .eq("id", moduleId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: questions } = useQuery({
    queryKey: ["module-questions", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_training_questions")
        .select("*")
        .eq("module_id", moduleId)
        .order("sequence_order");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: completion } = useQuery({
    queryKey: ["module-completion", moduleId],
    queryFn: async () => {
      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("security_training_completions")
        .select("*")
        .eq("module_id", moduleId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (completion?.id) {
      setCompletionId(completion.id);
    }
  }, [completion]);

  const submitAnswersMutation = useMutation({
    mutationFn: async (submittedAnswers: Record<string, any>) => {
      if (!completionId || !questions) throw new Error("Missing data");

      const user = await AuthService.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      // Calculate score
      let totalPoints = 0;
      let earnedPoints = 0;

      const answerRecords = questions.map((q) => {
        const userAnswer = submittedAnswers[q.id];
        const correctAnswers = JSON.parse(q.correct_answers as string);
        let isCorrect = false;

        if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
          isCorrect = userAnswer === correctAnswers[0];
        } else if (q.question_type === 'multi_select') {
          const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [];
          isCorrect = JSON.stringify(userAnswerArray.sort()) === JSON.stringify(correctAnswers.sort());
        }

        totalPoints += q.points;
        const pointsEarned = isCorrect ? q.points : 0;
        earnedPoints += pointsEarned;

        return {
          completion_id: completionId,
          question_id: q.id,
          user_answer: JSON.stringify(userAnswer),
          is_correct: isCorrect,
          points_earned: pointsEarned,
        };
      });

      const score = Math.round((earnedPoints / totalPoints) * 100);
      const passingScore = (module as any).passing_score || 80;
      const passed = score >= passingScore;

      // Insert answers
      const { error: answersError } = await supabase
        .from("security_training_answers")
        .upsert(answerRecords, { onConflict: 'completion_id,question_id' });

      if (answersError) throw answersError;

      // Update completion
      const { error: completionError } = await supabase
        .from("security_training_completions")
        .update({
          completed_at: new Date().toISOString(),
          score,
          passed,
          certificate_issued: passed,
        })
        .eq("id", completionId);

      if (completionError) throw completionError;

      return { score, passed };
    },
    onSuccess: ({ score, passed }) => {
      setShowResults(true);
      queryClient.invalidateQueries({ queryKey: ["security-training-completions"] });
      queryClient.invalidateQueries({ queryKey: ["module-completion", moduleId] });
      
      if (passed) {
        toast.success(`Congratulations! You passed with ${score}%`);
      } else {
        const passingScore = (module as any).passing_score || 80;
        toast.error(`You scored ${score}%. You need ${passingScore}% to pass.`);
      }
    },
    onError: (error) => {
      toast.error("Failed to submit answers");
      console.error(error);
    },
  });

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultiSelectChange = (questionId: string, optionIndex: number, checked: boolean) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, optionIndex] };
      } else {
        return { ...prev, [questionId]: current.filter((i: number) => i !== optionIndex) };
      }
    });
  };

  const handleSubmit = () => {
    if (!questions || Object.keys(answers).length < questions.length) {
      toast.error("Please answer all questions before submitting");
      return;
    }
    submitAnswersMutation.mutate(answers);
  };

  const currentQuestion = questions?.[currentQuestionIndex];
  const progress = questions ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (!module || !questions) {
    return <div className="p-8">Loading...</div>;
  }

  if (showResults) {
    const score = completion?.score || 0;
    const passed = completion?.passed || false;

    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {passed ? (
                <CheckCircle className="w-20 h-20 text-success" />
              ) : (
                <XCircle className="w-20 h-20 text-destructive" />
              )}
            </div>
            <CardTitle className="text-3xl">
              {passed ? "Congratulations!" : "Not Quite There"}
            </CardTitle>
            <CardDescription className="text-lg">
              You scored {score}% on this assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Your Score</span>
                <span className="font-bold">{score}%</span>
              </div>
              <Progress value={score} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Passing Score: {(module as any).passing_score || 80}%</span>
                {passed && <span className="text-success">✓ Passed</span>}
              </div>
            </div>

            {passed && (
              <Alert className="bg-success/5 border-success/20">
                <Award className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  A certificate has been issued for completing this training module.
                  You can view it in your training history.
                </AlertDescription>
              </Alert>
            )}

            {!passed && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  You need at least {(module as any).passing_score || 80}% to pass. Review the material and try again.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => navigate("/security-training")}
                className="flex-1"
              >
                Return to Training Dashboard
              </Button>
              {!passed && (
                <Button
                  onClick={() => {
                    setShowResults(false);
                    setCurrentQuestionIndex(0);
                    setAnswers({});
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Retake Assessment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/security-training")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Training
        </Button>
        <h1 className="text-3xl font-bold mb-2">{module.module_name}</h1>
        <p className="text-muted-foreground">{module.description}</p>
        <div className="flex gap-2 mt-3">
          <Badge variant="outline">{module.module_type}</Badge>
          <Badge>Version {module.version}</Badge>
          {module.is_mandatory && <Badge variant="destructive">Mandatory</Badge>}
        </div>
      </div>

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      {currentQuestion && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-start gap-2">
              <BookOpen className="w-5 h-5 mt-1 flex-shrink-0" />
              <span>{currentQuestion.question_text}</span>
            </CardTitle>
            <CardDescription>
              {currentQuestion.question_type === 'multiple_choice' && 'Select one answer'}
              {currentQuestion.question_type === 'true_false' && 'Select True or False'}
              {currentQuestion.question_type === 'multi_select' && 'Select all that apply'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'true_false' ? (
              <RadioGroup
                value={answers[currentQuestion.id]?.toString()}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
              >
                {JSON.parse(currentQuestion.options as string).map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-2">
                {JSON.parse(currentQuestion.options as string).map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
                    <Checkbox
                      id={`option-${index}`}
                      checked={(answers[currentQuestion.id] || []).includes(index)}
                      onCheckedChange={(checked) =>
                        handleMultiSelectChange(currentQuestion.id, index, checked as boolean)
                      }
                    />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentQuestionIndex < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            disabled={!answers[currentQuestion?.id]}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length || submitAnswersMutation.isPending}
          >
            Submit Assessment
          </Button>
        )}
      </div>
    </div>
  );
};

export default SecurityTrainingModule;