import  { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useCanvas } from '@/hooks/useCanvas';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Toolbar } from './Toolbar';
import { Award, Variable, FunctionSquare } from 'lucide-react';
import Heading from '@/components/Heading';

// Define TypeScript interfaces
interface ResultType {
  expr: string;
  result: string;
  assign?: boolean;
  type: string;
}

type Tool = 'pen' | 'eraser';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');


const COLORS = [
  '#000000', '#FFFFFF', '#FF3B30', '#FF2D55', 
  '#AF52DE', '#5856D6', '#007AFF', '#34C759', 
  '#FFCC00', '#FF9500', '#8E8E93'
];

const TOOLS: Tool[] = ['pen', 'eraser'];

const resizeImage = async (base64Str: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL());
    };
  });
};

export default function Skribble() {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [result, setResult] = useState<ResultType[] | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  const { canvasRef, startDrawing, stopDrawing, draw } = useCanvas({
    darkMode,
    lineWidth,
    color,
    tool,
  });

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = darkMode ? 'black' : 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setResult(null);
  };

  const calculateResult = async () => {
    try {
      setIsCalculating(true);
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Get canvas data and resize it
      let imageData = canvas.toDataURL('image/png');
      imageData = await resizeImage(imageData);
      const base64Data = imageData.split(',')[1];

      // Enhanced prompt for better mathematical analysis
      const prompt = `You are a mathematical expression analyzer. Examine the handwritten mathematical content in the image and provide a detailed solution.

      Important: Your response must be valid JSON in the following format:
      [
        {
          "expr": "original expression or equation",
          "steps": ["step 1", "step 2", ...],
          "result": "final answer",
          "type": "expression|equation|variable|graph",
          "assign": boolean
        }
      ]

      Guidelines:
      1. For basic expressions (e.g., 2 + 3 × 4):
         - Show each step following PEMDAS
         - Include intermediate calculations
      
      2. For equations (e.g., 2x + 5 = 15):
         - Show isolation of variables
         - Show all algebraic steps
         - Set "type": "equation"
      
      3. For variable assignments:
         - Set "assign": true
         - Set "type": "variable"
      
      4. For graphical problems:
         - Set "type": "graph"
         - Describe key points, intersections, or relevant features
      
      5. For word problems:
         - Break down the problem into mathematical steps
         - Show the equation formation
      
      Ensure all mathematical operations are precise and verified.
      Do not include any explanations outside the JSON structure.`;

      // Generate content
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: "image/png" } },
      ]);
      
      const response = await result.response;
      const text = response.text();
      
      // Enhanced result parsing
      try {
        const cleanText = text.replace(/```json\n|\n```/g, '');
        const formattedResult = JSON.parse(cleanText);
        
        // Validate the result structure
        if (!Array.isArray(formattedResult)) {
          throw new Error('Invalid result format');
        }
        
        setResult(formattedResult.map(item => ({
          ...item,
          expr: item.expr || 'Unknown expression',
          result: Array.isArray(item.steps) && item.steps.length > 0
            ? `${item.steps.join('\n')}\n\nFinal answer: ${item.result}`
            : item.result || 'No result available'
        })));
      } catch (parseError) {
        setResult([{
          expr: "Error parsing result",
          result: "Could not process the mathematical expression correctly",
          type: "error"
        }]);
      }
    } catch (error) {
      console.error('Error calculating result:', error);
      setResult([{ 
        expr: "Error", 
        result: error instanceof Error ? error.message : "An unknown error occurred",
        type: "error"
      }]);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-6 flex flex-col gap-4">
      <Heading
        title="Skribble AI"
        description="Draw mathematical expressions and get instant solutions."
      />

      <div className="relative flex-1 border rounded-lg overflow-hidden">
        <Toolbar
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          lineWidth={lineWidth}
          setLineWidth={setLineWidth}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onReset={resetCanvas}
          onCalculate={calculateResult}
          isCalculating={isCalculating}
          colors={COLORS}
          tools={TOOLS}
        />

        <main className="relative h-full pt-16">
          <canvas
            ref={canvasRef}
            className="touch-none w-full h-full z-0"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          
          {result && (
            <div className="absolute right-0 top-0 pt-20 w-full max-w-sm mx-4 lg:mx-6 lg:right-6 z-40">
              <Card className="border-primary/10 bg-background/95 backdrop-blur-xl shadow-lg dark:shadow-primary/10">
                <CardHeader className="border-b border-border/50 bg-primary/5">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="h-5 w-5 text-primary" />
                    Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {result.map((item, index) => (
                    <div 
                      key={index} 
                      className="p-3 rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/20 hover:bg-primary/5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          {item.assign ? (
                            <Variable className="h-4 w-4 text-primary" />
                          ) : (
                            <FunctionSquare className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{item.expr}</p>
                          <p className="text-sm text-muted-foreground mt-1">{item.result}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}