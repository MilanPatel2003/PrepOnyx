import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  Eraser,
  Pen,
  Square,
  Circle as CircleIcon,
  Minus,
  Sun,
  Moon,
  Trash2,
  Loader2,
  FunctionSquare,
  Triangle,
  ArrowRight,
  Plus
} from 'lucide-react';
import { nanoid } from 'nanoid';
import Draggable from 'react-draggable';
import { Tool, Shape, MathResult, ResultType } from '@/types/skribble';

// Your provided prompt

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

const COLORS = [
  '#000000', '#FFFFFF', '#FF3B30', '#FF2D55', 
  '#AF52DE', '#5856D6', '#007AFF', '#34C759', 
  '#FFCC00', '#FF9500', '#8E8E93'
];

const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: 'pen', icon: <Pen className="h-4 w-4" />, label: 'Pen' },
  { id: 'eraser', icon: <Eraser className="h-4 w-4" />, label: 'Eraser' },
  { id: 'rectangle', icon: <Square className="h-4 w-4" />, label: 'Rectangle' },
  { id: 'circle', icon: <CircleIcon className="h-4 w-4" />, label: 'Circle' },
  { id: 'line', icon: <Minus className="h-4 w-4" />, label: 'Line' },
  { id: 'triangle', icon: <Triangle className="h-4 w-4" />, label: 'Triangle' },
  { id: 'arrow', icon: <ArrowRight className="h-4 w-4" />, label: 'Arrow' },
];

const BRUSH_SIZES = [2, 4, 6, 8, 12, 16, 20];

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
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [results, setResults] = useState<MathResult[] | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const stageRef = useRef<any>(null);
  const isDrawing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth,
          height: clientHeight - 2, // Subtract border width
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleMouseDown = (e: any) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    
    const newShape: Shape = {
      id: nanoid(),
      tool,
      points: tool === 'pen' || tool === 'eraser' ? [pos.x, pos.y] : [],
      x: pos.x,
      y: pos.y,
      color: tool === 'eraser' ? (darkMode ? '#000000' : '#FFFFFF') : color,
      strokeWidth: lineWidth,
    };

    setCurrentShape(newShape);
    if (tool !== 'pen' && tool !== 'eraser') {
      setShapes([...shapes, newShape]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current || !currentShape) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    if (tool === 'pen' || tool === 'eraser') {
      setCurrentShape({
        ...currentShape,
        points: [...(currentShape.points || []), point.x, point.y],
      });
    } else {
      const lastShape = [...shapes].pop();
      if (!lastShape) return;

      if (tool === 'rectangle' || tool === 'circle') {
        const newShapes = shapes.slice(0, -1).concat({
          ...lastShape,
          width: point.x - lastShape.x!,
          height: point.y - lastShape.y!,
        });
        setShapes(newShapes);
      } else if (tool === 'line' || tool === 'arrow') {
        const newShapes = shapes.slice(0, -1).concat({
          ...lastShape,
          points: [lastShape.x!, lastShape.y!, point.x, point.y],
        });
        setShapes(newShapes);
      } else if (tool === 'triangle') {
        const newShapes = shapes.slice(0, -1).concat({
          ...lastShape,
          points: [
            lastShape.x!,
            lastShape.y!,
            point.x,
            point.y,
            lastShape.x! + (point.x - lastShape.x!) / 2,
            lastShape.y! - Math.abs(point.y - lastShape.y!),
          ],
        });
        setShapes(newShapes);
      }
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    if (currentShape && (tool === 'pen' || tool === 'eraser')) {
      setShapes([...shapes, currentShape]);
    }
    setCurrentShape(null);
  };

  const calculateResult = async () => {
    try {
      setIsCalculating(true);
      const stage = stageRef.current;
      if (!stage) return;

      // Get stage data and resize it
      let imageData = stage.toDataURL();
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
        
        setResults(formattedResult.map(item => ({
          ...item,
          expr: item.expr || 'Unknown expression',
          result: Array.isArray(item.steps) && item.steps.length > 0
            ? `${item.steps.join('\n')}\n\nFinal answer: ${item.result}`
            : item.result || 'No result available'
        })));
      } catch (parseError) {
        setResults([{
          expr: "Error parsing result",
          result: "Could not process the mathematical expression correctly",
          type: "error" as ResultType,
          steps: []
        }]);
      }
    } catch (error) {
      console.error('Error calculating result:', error);
      setResults([{ 
        expr: "Error", 
        result: error instanceof Error ? error.message : "An unknown error occurred",
        type: "error" as ResultType,
        steps: []
      }]);
    } finally {
      setIsCalculating(false);
    }
  };

  const ResultCard = ({ result }: { result: MathResult }) => (
    <Draggable handle=".drag-handle">
      <Card className="w-96 shadow-lg mb-4">
        <CardHeader className="drag-handle cursor-move pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FunctionSquare className="h-5 w-5" />
              <CardTitle className="text-lg">{result.expr}</CardTitle>
            </div>
            <Badge variant="outline">{result.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Final Result */}
          <div className="bg-primary/10 p-4 rounded-lg">
            <p className="font-medium">Result</p>
            <p className="text-lg font-mono">{result.result}</p>
          </div>

          {/* Steps */}
          {result.steps && result.steps.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium">Steps</p>
              <ScrollArea className="h-[200px]">
                {result.steps.map((step, index) => (
                  <div key={index} className="border-l-2 border-primary/20 pl-4 py-2 mb-2">
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </Draggable>
  );

  return (
    <div ref={containerRef} className="h-[calc(100vh-4rem)] p-6 flex flex-col gap-4">
      {/* Toolbar */}
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg shadow-lg border p-2">
        <div className="flex items-center gap-2">
          {/* Tools */}
          <div className="flex items-center gap-1">
            {TOOLS.map((toolItem) => (
              <Button
                key={toolItem.id}
                variant={tool === toolItem.id ? "default" : "ghost"}
                size="icon"
                onClick={() => setTool(toolItem.id)}
                title={toolItem.label}
              >
                {toolItem.icon}
              </Button>
            ))}
          </div>
          
          <Separator orientation="vertical" className="h-8" />
          
          {/* Brush Size */}
          <div className="flex items-center gap-2">
            <Minus className="h-3 w-3" />
            {BRUSH_SIZES.map((size) => (
              <Button
                key={size}
                variant={lineWidth === size ? "default" : "ghost"}
                size="icon"
                className="w-8 h-8 rounded-full p-0"
                onClick={() => setLineWidth(size)}
              >
                <div 
                  className="rounded-full bg-foreground"
                  style={{ 
                    width: Math.min(size, 16),
                    height: Math.min(size, 16)
                  }} 
                />
              </Button>
            ))}
            <Plus className="h-3 w-3" />
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Colors */}
          <div className="flex items-center gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`w-6 h-6 rounded-full border-2 ${
                  color === c ? 'border-primary' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShapes([])}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={calculateResult}
              disabled={isCalculating}
            >
              {isCalculating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Calculator className="h-4 w-4 mr-2" />
              )}
              Calculate
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4">
        {/* Canvas */}
        <div className="flex-1 border rounded-lg overflow-hidden">
          <Stage
            width={dimensions.width}
            height={dimensions.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            ref={stageRef}
          >
            <Layer>
              <Rect
                width={dimensions.width}
                height={dimensions.height}
                fill={darkMode ? '#000000' : '#FFFFFF'}
              />
              {shapes.map((shape) => {
                if (shape.tool === 'pen' || shape.tool === 'eraser') {
                  return (
                    <Line
                      key={shape.id}
                      points={shape.points}
                      stroke={shape.color}
                      strokeWidth={shape.strokeWidth}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                    />
                  );
                } else if (shape.tool === 'rectangle') {
                  return (
                    <Rect
                      key={shape.id}
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={shape.height}
                      stroke={shape.color}
                      strokeWidth={shape.strokeWidth}
                    />
                  );
                } else if (shape.tool === 'circle') {
                  return (
                    <Circle
                      key={shape.id}
                      x={shape.x}
                      y={shape.y}
                      radius={Math.abs(shape.width || 0) / 2}
                      stroke={shape.color}
                      strokeWidth={shape.strokeWidth}
                    />
                  );
                } else if (shape.tool === 'line' || shape.tool === 'arrow') {
                  return (
                    <Line
                      key={shape.id}
                      points={shape.points}
                      stroke={shape.color}
                      strokeWidth={shape.strokeWidth}
                      lineCap="round"
                      {...(shape.tool === 'arrow' && {
                        arrow: true,
                        arrowSize: shape.strokeWidth * 2
                      })}
                    />
                  );
                } else if (shape.tool === 'triangle') {
                  return (
                    <Line
                      key={shape.id}
                      points={shape.points}
                      stroke={shape.color}
                      strokeWidth={shape.strokeWidth}
                      closed={true}
                    />
                  );
                }
                return null;
              })}
              {currentShape && (
                <Line
                  points={currentShape.points}
                  stroke={currentShape.color}
                  strokeWidth={currentShape.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
            </Layer>
          </Stage>
        </div>

        {/* Results Panel */}
        {results && (
          <div className="w-[400px] border rounded-lg p-4">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              {results.map((result, index) => (
                <ResultCard key={index} result={result} />
              ))}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}