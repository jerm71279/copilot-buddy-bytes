import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Brain, BarChart3, AlertTriangle, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PredictiveAnalyticsService } from "@/services/predictiveAnalyticsService";

const PredictiveAnalyticsDashboard = () => {
  const { data: predictions, isLoading } = useQuery({
    queryKey: ['predictive-analytics'],
    queryFn: () => PredictiveAnalyticsService.getForecast('30days')
  });

  const forecastCards = [
    {
      title: "Data Volume Forecast",
      description: "Next 30 days prediction",
      icon: BarChart3,
      trend: "+23%",
      confidence: "92%",
      color: "text-primary"
    },
    {
      title: "Quality Score Trend",
      description: "Expected quality metrics",
      icon: Target,
      trend: "+5%",
      confidence: "88%",
      color: "text-secondary"
    },
    {
      title: "Resource Usage",
      description: "Projected compute needs",
      icon: TrendingUp,
      trend: "+15%",
      confidence: "85%",
      color: "text-primary"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pb-8 pt-8" style={{ marginTop: 'var(--lanes-height, 0px)' }}>
        
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">Predictive Analytics</h1>
              <p className="text-muted-foreground text-lg">ML-powered forecasting and insights</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {forecastCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.trend}</div>
                <p className="text-xs text-muted-foreground mb-2">{card.description}</p>
                <Badge variant="outline" className="text-xs">
                  {card.confidence} confidence
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Anomaly Detection</CardTitle>
            <CardDescription>AI-identified patterns and outliers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'Warning', message: 'Unusual spike in data ingestion detected', severity: 'medium', time: '2 hours ago' },
                { type: 'Info', message: 'New pattern identified in user behavior', severity: 'low', time: '5 hours ago' },
                { type: 'Critical', message: 'Quality score dropped below threshold', severity: 'high', time: '1 day ago' }
              ].map((anomaly, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 border rounded-lg">
                  <AlertTriangle className={`h-5 w-5 ${
                    anomaly.severity === 'high' ? 'text-destructive' :
                    anomaly.severity === 'medium' ? 'text-secondary' :
                    'text-muted-foreground'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{anomaly.type}</p>
                      <span className="text-xs text-muted-foreground">{anomaly.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{anomaly.message}</p>
                  </div>
                  <Badge variant={
                    anomaly.severity === 'high' ? 'destructive' :
                    anomaly.severity === 'medium' ? 'secondary' :
                    'outline'
                  }>
                    {anomaly.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Time Series Forecast</CardTitle>
              <CardDescription>Historical trends and predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">Chart visualization placeholder</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Performance</CardTitle>
              <CardDescription>Prediction accuracy metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { model: 'Volume Forecasting', accuracy: 92, status: 'Excellent' },
                  { model: 'Quality Prediction', accuracy: 88, status: 'Good' },
                  { model: 'Anomaly Detection', accuracy: 95, status: 'Excellent' }
                ].map((model) => (
                  <div key={model.model} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{model.model}</span>
                      <span className="text-muted-foreground">{model.accuracy}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2" 
                          style={{ width: `${model.accuracy}%` }}
                        />
                      </div>
                      <Badge variant="outline" className="text-xs">{model.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default PredictiveAnalyticsDashboard;
