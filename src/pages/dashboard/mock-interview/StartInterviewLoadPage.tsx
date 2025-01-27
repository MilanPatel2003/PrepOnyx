import { db } from "@/config/firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { Interview } from "@/types";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoaderPage } from "@/pages/LoaderPage";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Webcam from "react-webcam";
import { LightbulbIcon, Stars, WebcamIcon } from "lucide-react";

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
    <div className="p-6 space-y-6 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-center">{interview?.position}</h1>
      <h2 className="text-xl text-center text-gray-600">{interview?.description}</h2>
      <div className="flex flex-col md:flex-row justify-center space-y-2 md:space-y-0 md:space-x-2 mt-4">
        <Badge variant="default">{interview?.experience}+ YOE</Badge>
        {interview?.techStack.split(',').map((tech, index) => (
          <Badge key={index} variant="secondary">{tech.trim()}</Badge>
        ))}
      </div>
      <Card className="mt-6 p-4 rounded-lg shadow">
        <CardHeader>
          <h3 className="text-lg font-semibold text-yellow-500"><LightbulbIcon/>Important Information</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-500">
            Please enable your webcam and microphone to start the AI-generated mock interview. The interview consists of five questions. You'll receive a personalized report based on your responses at the end.
          </p>
          <p className="text-sm text-yellow-500 mt-2">
            Note: Your video is <strong>never recorded</strong>. You can disable your webcam at any time.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <div className="flex items-center justify-center w-full h-full">
            <div className="w-full h-[400px] md:w-96 flex flex-col items-center justify-center border bg-gray-50 rounded-md">
              {isWebCamEnabled ? (
                <Webcam
                  onUserMedia={() => setIsWebCamEnabled(true)}
                  onUserMediaError={() => setIsWebCamEnabled(false)}
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <WebcamIcon className="min-w-24 min-h-24 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="flex mt-2 items-center justify-center">
            <Button onClick={() => setIsWebCamEnabled(!isWebCamEnabled)} className="w-full md:w-auto">
              {isWebCamEnabled ? "Disable Webcam" : "Enable Webcam"}
            </Button>
          </div>
          <Button
            onClick={() => navigate(`/dashboard/mock-interview/${id}/start`)}
            className="mt-4 bg-blue-600 text-white hover:bg-blue-700 w-full md:w-auto"
          >
            Start Interview <Stars/>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StartInterviewLoadPage;
