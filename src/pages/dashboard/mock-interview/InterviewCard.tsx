import { Interview } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, MessageSquare, Play, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface InterviewCardProps {
  interview: Interview;
  onDelete: (id: string) => void;
}

const InterviewCard = ({ interview, onDelete }: InterviewCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/20 flex flex-col">
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
      <CardContent className="flex-grow">
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
      <CardFooter className="flex flex-wrap gap-2 p-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-[80px]"
          onClick={() => navigate(`/dashboard/mock-interview/${interview.id}`)}
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">View</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-[80px]"
          onClick={() => navigate(`/dashboard/mock-interview/${interview.id}/feedback`)}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">Feedback</span>
        </Button>
        <Button
          size="sm"
          className="flex-1 min-w-[80px]"
          onClick={() => navigate(`/dashboard/mock-interview/${interview.id}/loadpage`)}
        >
          <Play className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">Start</span>
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1 min-w-[80px]"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(interview.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">Delete</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InterviewCard;