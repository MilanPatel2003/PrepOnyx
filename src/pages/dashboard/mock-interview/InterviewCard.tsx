import { Interview } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, MessageSquare, Play } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface InterviewCardProps {
  interview: Interview;
}

const InterviewCard = ({ interview }: InterviewCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/20">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{interview.position}</h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(interview.createdAt.toDate())}
            </p>
          </div>
          <Badge variant="secondary">{interview.experience}+ YOE</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {interview.description}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {interview.techStack.split(",").map((tech) => (
            <Badge key={tech} variant="outline">
              {tech.trim()}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => navigate(`/dashboard/mock-interview/${interview.id}`)}
        >
          <Eye className="w-4 h-4 mr-2" />
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => navigate(`/dashboard/mock-interview/${interview.id}/feedback`)}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Feedback
        </Button>
        <Button
          size="sm"
          className="flex-1"
          
          onClick={() => navigate(`/dashboard/mock-interview/${interview.id}/loadpage`)}
        >
          <Play className="w-4 h-4 mr-2" />
          Start
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InterviewCard;