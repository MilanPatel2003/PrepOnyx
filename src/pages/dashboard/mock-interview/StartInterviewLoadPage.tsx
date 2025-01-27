import { db } from "@/config/firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { Interview } from "@/types";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoaderPage } from "@/pages/LoaderPage";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Webcam from "react-webcam";
import { LightbulbIcon, Stars, WebcamIcon, Clock, CheckCircle2, Star } from "lucide-react";

const StartInterviewLoadPage = () => {
  const { id } = useParams<{ id: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWebCamEnabled, setIsWebCamEnabled] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInterview = async () => {
      if (!id) {
        navigate("/dashboard/mock-interview", { replace: true });
        return;
      }

      setLoading(true);
      try {
        const docRef = doc(db, "interviews", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Interview;
          setInterview({ ...data, id: docSnap.id });
        } else {
          console.error("No such document!");
          navigate("/dashboard/mock-interview", { replace: true });
        }
      } catch (error) {
        console.error("Error fetching interview:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id, navigate]);

  if (loading) {
    return <LoaderPage />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-secondary/20 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl space-y-6 sm:space-y-8 relative">
        {/* Background gradient effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/5 via-primary/5 to-transparent blur-2xl" />
        
        {/* Content */}
        <div className="relative space-y-6 sm:space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <Badge 
                variant="secondary" 
                className="px-3 py-1.5 text-sm bg-primary/10 text-primary"
              >
                AI-Powered Interview
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-500 via-primary to-indigo-500 bg-clip-text text-transparent leading-tight">
              {interview?.position}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              {interview?.description}
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4 px-4">
              <Badge className="px-3 py-1.5 text-sm sm:text-base bg-gradient-to-r from-violet-500 to-primary text-white">
                {interview?.experience}+ YOE
              </Badge>
              {interview?.techStack.split(',').map((tech, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="px-3 py-1.5 text-sm sm:text-base bg-white/5 border border-primary/10 hover:bg-primary/5 transition-all"
                >
                  {tech.trim()}
                </Badge>
              ))}
            </div>
          </div>

          {/* Main Card */}
          <Card className="border border-primary/10 bg-white/5 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-primary/10 px-6 py-4 sm:py-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <LightbulbIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-violet-500 to-primary bg-clip-text text-transparent">
                    Important Information
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Duration: ~30 mins</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-8">
              <div className="grid sm:grid-cols-2 gap-4 text-muted-foreground">
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Before You Start</h4>
                  <ul className="space-y-2">
                    {[
                      'Find a quiet environment',
                      'Ensure good lighting',
                      'Test your microphone',
                      'Have water nearby',
                      'Take deep breaths'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">What to Expect</h4>
                  <ul className="space-y-2">
                    {[
                      '5 technical questions',
                      'Real-time AI feedback',
                      'Performance analysis',
                      'Detailed report',
                      'Improvement suggestions'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Star className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div className="w-full max-w-3xl mx-auto">
                  <div className="aspect-video w-full bg-black/20 rounded-xl border border-primary/10 overflow-hidden backdrop-blur-sm shadow-lg">
                    {isWebCamEnabled ? (
                      <Webcam
                        onUserMedia={() => setIsWebCamEnabled(true)}
                        onUserMediaError={() => setIsWebCamEnabled(false)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                        <WebcamIcon className="w-16 sm:w-24 h-16 sm:h-24 text-primary/40 animate-pulse" />
                        <p className="text-muted-foreground font-medium text-sm sm:text-base">
                          Click 'Enable Webcam' to begin
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
                  <Button 
                    onClick={() => setIsWebCamEnabled(!isWebCamEnabled)}
                    className="flex-1 bg-white/5 border border-primary/10 hover:bg-primary/5 text-foreground gap-2 h-12 sm:h-14 text-base sm:text-lg transition-all duration-300"
                  >
                    <WebcamIcon className="w-5 h-5" />
                    {isWebCamEnabled ? "Disable Webcam" : "Enable Webcam"}
                  </Button>
                  <Button
                    onClick={() => navigate(`/dashboard/mock-interview/${id}/start`)}
                    className="flex-1 bg-gradient-to-r from-violet-500 to-primary hover:from-violet-600 hover:to-primary/90 text-white gap-2 h-12 sm:h-14 text-base sm:text-lg shadow-lg hover:shadow-primary/25 transition-all duration-300"
                  >
                    Start Interview 
                    <Stars className="w-5 h-5 animate-pulse"/>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StartInterviewLoadPage;
