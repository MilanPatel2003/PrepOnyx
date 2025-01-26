import { Brain } from "lucide-react";

const MathNotes = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Brain className="h-8 w-8 text-blue-500" />
        <h1 className="text-3xl font-bold">AI Math Notes Converter</h1>
      </div>
      
      <p className="text-muted-foreground">
        Transform your handwritten math notes into detailed digital solutions and explanations.
      </p>

      {/* Add your feature implementation here */}
    </div>
  );
};

export default MathNotes; 