import { Progress } from "@/components/ui/progress";

interface EmotionAnalysisProps {
  emotions: { expression: string; probability: number }[];
}

export const EmotionAnalysis = ({ emotions }: EmotionAnalysisProps) => {
  const getEmotionColor = (expression: string) => {
    const colors: { [key: string]: string } = {
      happy: "text-green-500",
      neutral: "text-blue-500",
      sad: "text-purple-500",
      angry: "text-red-500",
      fearful: "text-orange-500",
      disgusted: "text-yellow-500",
      surprised: "text-pink-500",
    };
    return colors[expression.toLowerCase()] || "text-gray-500";
  };

  const getDominantEmotion = () => {
    if (emotions.length === 0) return null;
    return emotions[0];
  };

  const dominantEmotion = getDominantEmotion();

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      {dominantEmotion && (
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">Current Emotion</h3>
          <p className={`text-2xl font-bold ${getEmotionColor(dominantEmotion.expression)}`}>
            {dominantEmotion.expression.charAt(0).toUpperCase() + dominantEmotion.expression.slice(1)}
          </p>
        </div>
      )}
      
      <div className="space-y-3">
        {emotions.map(({ expression, probability }) => (
          <div key={expression} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className={`font-medium ${getEmotionColor(expression)}`}>
                {expression.charAt(0).toUpperCase() + expression.slice(1)}
              </span>
              <span className="text-gray-500">
                {Math.round(probability * 100)}%
              </span>
            </div>
            <Progress value={probability * 100} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  );
}; 