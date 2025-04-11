import React from 'react';
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
  Plus,
  X,
  Brain
} from 'lucide-react';
import { nanoid } from 'nanoid';
import Draggable from 'react-draggable';
import { Tool, Shape, MathResult, ResultType, Step } from '@/types/skribble';
import { FeatureHeader } from "@/components/FeatureHeader";

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

const preprocessImage = async (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64Str);

      // Draw white background first
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the image
      ctx.drawImage(img, 0, 0);
      
      // Enhance contrast
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        // Apply threshold for better contrast
        const threshold = 128;
        const value = avg < threshold ? 0 : 255;
        
        data[i] = value;     // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };
  });
};

// Add new toolbar components
const ToolbarButton = ({ active, onClick, icon, label, className = '' }: { 
  active?: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  className?: string;
}) => (
  <Button
    variant={active ? "default" : "ghost"}
    size="icon"
    className={`relative group ${className}`}
    onClick={onClick}
  >
    {icon}
    <span className="sr-only">{label}</span>
    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
      {label}
    </div>
  </Button>
);

const MobileToolbar = ({ 
  tool, 
  setTool, 
  color, 
  setColor, 
  lineWidth, 
  setLineWidth,
  darkMode,
  setDarkMode,
  setShapes,
  calculateResult,
  isCalculating
}: any) => (
  <div className="fixed bottom-4 left-4 right-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg shadow-lg border p-2 z-50 lg:hidden">
    <div className="flex items-center justify-between">
      <ScrollArea className="w-auto max-w-[50%]">
        <div className="flex gap-1">
          {TOOLS.map((toolItem) => (
            <ToolbarButton
              key={toolItem.id}
              active={tool === toolItem.id}
              onClick={() => setTool(toolItem.id)}
              icon={toolItem.icon}
              label={toolItem.label}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
          size="sm"
          className="whitespace-nowrap"
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
);

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
  const [stageScale, setStageScale] = useState<number>(1);
  const [stagePosition, setStagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef<number>(0);

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

  const getDistance = (p1: Touch, p2: Touch) => {
    return Math.sqrt(Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2));
  };

  const handleTouch = (e: any) => {
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      // Handle pinch
      if (e.evt.type === 'touchmove') {
        const dist = getDistance(touch1, touch2);
        const center = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };

        if (!lastDist.current) {
          lastDist.current = dist;
        }
        if (!lastCenter.current) {
          lastCenter.current = center;
        }

        const scale = Math.min(Math.max(stageScale * (dist / lastDist.current), 0.5), 3);
        const x = stagePosition.x + (center.x - lastCenter.current.x);
        const y = stagePosition.y + (center.y - lastCenter.current.y);

        setStageScale(scale);
        setStagePosition({ x, y });

        lastDist.current = dist;
        lastCenter.current = center;
      }
    } else {
      // Handle single touch drawing
      const touch = e.evt.touches[0];
      if (touch) {
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        if (pos) {
          if (e.evt.type === 'touchstart') {
            handleMouseDown(e);
          } else if (e.evt.type === 'touchmove') {
            handleMouseMove(e);
          }
        }
      }
    }
  };

  const handleTouchEnd = () => {
    lastCenter.current = null;
    lastDist.current = 0;
    handleMouseUp();
  };

  const calculateResult = async () => {
    try {
      setIsCalculating(true);
      const stage = stageRef.current;
      if (!stage) return;

      // Get stage data and preprocess it
      let imageData = stage.toDataURL();
      imageData = await resizeImage(imageData);
      imageData = await preprocessImage(imageData);
      const base64Data = imageData.split(',')[1];

      // Enhanced prompt for better mathematical analysis
      const prompt = `You are a highly specialized mathematical expression analyzer with expertise in handwritten mathematics recognition. Analyze the provided image with these specific guidelines:

      1. Recognition Priority:
         - Mathematical symbols (×,÷,±,≠,≈,≤,≥,∫,∑,∏,√,∞)
         - Fractions and mixed numbers
         - Exponents and subscripts
         - Matrices and vectors
         - Calculus notation
         - Greek letters (α,β,γ,θ,π,etc.)

      2. Context Awareness:
         - Identify if this is part of a larger equation system
         - Detect if this is calculus, algebra, geometry, or other mathematical domains
         - Consider standard mathematical notation conventions

      3. Error Handling:
         - If symbols are ambiguous, provide all possible interpretations
         - For unclear numbers/variables, note the ambiguity
         - Handle incomplete expressions appropriately

      Response Format (JSON):
      [
        {
          "expr": "detailed mathematical expression",
          "type": "expression|equation|calculus|matrix|graph",
          "domain": "algebra|calculus|geometry|statistics",
          "confidence": 0-1 confidence score,
          "steps": [
            {
              "step": "step description",
              "operation": "what's being done",
              "result": "intermediate result"
            }
          ],
          "result": "final result with units if applicable",
          "alternatives": ["possible alternative interpretations"],
          "warnings": ["any ambiguity or recognition warnings"]
        }
      ]

      Focus on mathematical accuracy and show all steps clearly.`;

      // Generate content with enhanced model parameters
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          topK: 40
        }
      });

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: "image/png" } },
      ]);
      
      const response = await result.response;
      const text = response.text();
      
      try {
        const cleanText = text.replace(/```json\n|\n```/g, '');
        const parsedResult = JSON.parse(cleanText);
        
        // Validate and format the result structure
        if (!Array.isArray(parsedResult)) {
          throw new Error('Invalid result format');
        }
        
        const formattedResults = parsedResult.map(item => {
          // Ensure steps are properly formatted
          const formattedSteps = Array.isArray(item.steps) 
            ? item.steps.map((step: unknown) => {
                if (typeof step === 'string') {
                  // Convert string steps to proper Step objects
                  return {
                    step: step,
                    operation: undefined,
                    result: undefined
                  };
                } else if (typeof step === 'object' && step !== null) {
                  // Ensure step object has required properties
                  const stepObj = step as Record<string, unknown>;
                  return {
                    step: typeof stepObj.step === 'string' ? stepObj.step : 'Unknown step',
                    operation: typeof stepObj.operation === 'string' ? stepObj.operation : undefined,
                    result: typeof stepObj.result === 'string' ? stepObj.result : undefined
                  };
                }
                return {
                  step: 'Invalid step format',
                  operation: undefined,
                  result: undefined
                };
              })
            : [];

          return {
            expr: item.expr || 'Unknown expression',
            type: item.type || 'expression',
            domain: item.domain,
            confidence: item.confidence,
            steps: formattedSteps,
            result: item.result || 'No result available',
            alternatives: Array.isArray(item.alternatives) ? item.alternatives : undefined,
            warnings: Array.isArray(item.warnings) ? item.warnings : undefined
          } as MathResult;
        });

        setResults(formattedResults);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        setResults([{
          expr: "Error parsing result",
          type: "error" as ResultType,
          steps: [{
            step: "Could not process the mathematical expression correctly",
            operation: undefined,
            result: undefined
          }],
          result: parseError instanceof Error ? parseError.message : "An unknown error occurred"
        }]);
      }
    } catch (error) {
      console.error('Error calculating result:', error);
      setResults([{ 
        expr: "Error", 
        type: "error" as ResultType,
        steps: [{
          step: error instanceof Error ? error.message : "An unknown error occurred",
          operation: undefined,
          result: undefined
        }],
        result: "An error occurred while processing"
      }]);
    } finally {
      setIsCalculating(false);
    }
  };

  const ResultCard = ({ result }: { result: MathResult }) => (
    <Draggable handle=".drag-handle">
      <Card className="w-full sm:w-96 shadow-lg mb-4 hover:shadow-xl transition-shadow">
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
          <div className="bg-primary/10 p-3 rounded-lg">
            <p className="font-medium text-sm sm:text-base">Result</p>
            <p className="text-base sm:text-lg font-mono break-words">{result.result}</p>
          </div>
          {result.steps && result.steps.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-sm sm:text-base">Steps</p>
              <div className="max-h-[150px] sm:max-h-[200px] overflow-y-auto">
                {result.steps.map((step, index) => (
                  <div key={index} className="border-l-2 border-primary/20 pl-3 py-1 mb-2">
                    <p className="text-xs sm:text-sm font-medium">{step.step}</p>
                    {step.operation && (
                      <p className="text-xs text-muted-foreground mt-1">{step.operation}</p>
                    )}
                    {step.result && (
                      <p className="text-xs font-mono mt-1">{step.result}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.alternatives && result.alternatives.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-sm">Alternative Interpretations</p>
              <div className="space-y-1">
                {result.alternatives.map((alt, index) => (
                  <p key={index} className="text-xs text-muted-foreground">{alt}</p>
                ))}
              </div>
            </div>
          )}
          {result.warnings && result.warnings.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-sm">Warnings</p>
              <div className="space-y-1">
                {result.warnings.map((warning, index) => (
                  <p key={index} className="text-xs text-yellow-600 dark:text-yellow-400">{warning}</p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Draggable>
  );

  return (
    <div ref={containerRef} className="h-[calc(100vh-4rem)] p-2 sm:p-4 flex flex-col gap-2 sm:gap-4">
      <FeatureHeader
        title="Skribble AI"
        description="Solve handwritten math problems with AI-powered recognition"
        icon={<Brain className="h-6 w-6" />}
        badge="Beta"
        usageSteps={[
          "Use the drawing tools to write your math problem",
          "Select the appropriate tool (pen, shapes, etc.)",
          "Adjust color and brush size as needed",
          "Click 'Calculate' to get the solution"
        ]}
        className="mb-4"
      />
      
      {/* Desktop Toolbar */}
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg shadow-lg border p-1 sm:p-2 hidden lg:block">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          {/* Tools - Responsive Grid */}
          <div className="flex flex-wrap items-center gap-1">
            {TOOLS.map((toolItem) => (
              <Button
                key={toolItem.id}
                variant={tool === toolItem.id ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => setTool(toolItem.id)}
                title={toolItem.label}
              >
                {React.cloneElement(toolItem.icon as React.ReactElement, { className: "h-3 w-3 sm:h-4 sm:w-4" })}
              </Button>
            ))}
          </div>
          
          <Separator orientation="vertical" className="h-6 sm:h-8 hidden sm:block" />
          
          {/* Brush Size - Responsive */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Minus className="h-2 w-2 sm:h-3 sm:w-3" />
            <ScrollArea className="w-32 sm:w-auto">
              <div className="flex gap-1">
                {BRUSH_SIZES.map((size) => (
                  <Button
                    key={size}
                    variant={lineWidth === size ? "default" : "ghost"}
                    size="icon"
                    className="h-6 w-6 sm:h-8 sm:w-8 rounded-full p-0"
                    onClick={() => setLineWidth(size)}
                  >
                    <div 
                      className="rounded-full bg-foreground"
                      style={{ 
                        width: Math.min(size, 12),
                        height: Math.min(size, 12)
                      }} 
                    />
                  </Button>
                ))}
              </div>
            </ScrollArea>
            <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
          </div>

          <Separator orientation="vertical" className="h-6 sm:h-8 hidden sm:block" />

          {/* Colors - Responsive */}
          <ScrollArea className="w-24 sm:w-auto">
            <div className="flex gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 ${
                    color === c ? 'border-primary' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </ScrollArea>

          <Separator orientation="vertical" className="h-6 sm:h-8 hidden sm:block" />

          {/* Actions - Responsive */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? (
                <Sun className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <Moon className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => setShapes([])}
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              onClick={calculateResult}
              disabled={isCalculating}
              className="h-8 px-2 sm:h-10 sm:px-4"
            >
              {isCalculating ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
              ) : (
                <Calculator className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              <span className="text-xs sm:text-sm">Calculate</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 relative">
        {/* Canvas Container with Zoom Controls */}
        <div className="flex-1 border rounded-lg overflow-hidden min-h-[300px] sm:min-h-[400px] relative">
          <div className="absolute top-2 right-2 z-10 flex gap-2 bg-background/80 backdrop-blur rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStageScale(Math.min(stageScale * 1.2, 3))}
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStageScale(Math.max(stageScale / 1.2, 0.5))}
              className="h-8 w-8"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setStageScale(1);
                setStagePosition({ x: 0, y: 0 });
              }}
              className="h-8 w-8"
            >
              <FunctionSquare className="h-4 w-4" />
            </Button>
          </div>
          
          <Stage
            width={dimensions.width}
            height={dimensions.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouch}
            onTouchMove={handleTouch}
            onTouchEnd={handleTouchEnd}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePosition.x}
            y={stagePosition.y}
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
          <div className="fixed inset-x-0 bottom-0 lg:relative lg:w-80 xl:w-96 lg:bottom-auto lg:right-auto z-40 lg:z-0">
            <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t lg:border rounded-t-lg lg:rounded-lg p-3 sm:p-4 shadow-lg max-h-[60vh] lg:max-h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-3 sticky top-0 bg-background/95 backdrop-blur py-2">
                <h3 className="text-lg font-semibold">Results</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setResults(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <ResultCard key={index} result={result} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Toolbar */}
      <MobileToolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        lineWidth={lineWidth}
        setLineWidth={setLineWidth}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        setShapes={setShapes}
        calculateResult={calculateResult}
        isCalculating={isCalculating}
      />
    </div>
  );
}