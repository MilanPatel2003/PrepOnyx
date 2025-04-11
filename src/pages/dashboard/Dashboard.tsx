import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  FileText, 
  BookOpen, 
  School, 
  Brain, 
  CreditCard,
  Rocket,
  Sparkles
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: MessageSquare,
    title: "AI Mock Interviews",
    description: "Practice with AI-powered mock interviews",
    href: "/dashboard/mock-interview",
    badge: "New"
  },
  {
    icon: FileText,
    title: "PDF Analyzer",
    description: "Analyze and generate quizzes from PDFs",
    href: "/dashboard/pdf-analyzer",
    badge: "Popular"
  },
  {
    icon: BookOpen,
    title: "Flashcards",
    description: "Create and study with AI-generated flashcards",
    href: "/dashboard/flashcards"
  },
  {
    icon: School,
    title: "Course Creator",
    description: "Personalized learning paths",
    href: "/dashboard/course-generator"
  },
  {
    icon: Brain,
    title: "Skribble AI",
    description: "Solve handwritten math problems",
    href: "/dashboard/skribbleAI",
    badge: "Beta"
  }
];

const Dashboard = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSignedIn) {
      navigate("/signin");
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Explore your learning tools
            </p>
          </div>
          <Button variant="outline" className="space-x-2">
            <Rocket className="h-4 w-4" />
            <span>Upgrade Plan</span>
          </Button>
        </div>
        <Separator />
      </div>

      {/* Credits Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Credits Remaining
            </CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">142</div>
            <div className="flex items-center space-x-2 mt-2">
              <Progress value={65} className="h-2" />
              <span className="text-sm text-muted-foreground">65% used</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              +12 credits added this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-secondary/10 to-secondary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Activity
            </CardTitle>
            <Sparkles className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Mock Interview</span>
                <span className="text-sm text-muted-foreground">-3 credits</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">PDF Analysis</span>
                <span className="text-sm text-muted-foreground">-5 credits</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Your Learning Tools</h2>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate(feature.href)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-medium">
                    {feature.title}
                  </CardTitle>
                </div>
                {feature.badge && (
                  <Badge variant="secondary">{feature.badge}</Badge>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h3 className="text-xl font-bold">Need more credits?</h3>
            <p className="text-muted-foreground">
              Upgrade your plan to unlock unlimited access
            </p>
          </div>
          <Button className="space-x-2">
            <Rocket className="h-4 w-4" />
            <span>Upgrade Now</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
