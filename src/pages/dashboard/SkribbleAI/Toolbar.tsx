import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Tool } from '@/types/skribble';
import { EraserIcon, MoonIcon, PenIcon, SunIcon } from "lucide-react";

interface ToolbarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onReset: () => void;
  onCalculate: () => void;
  isCalculating: boolean;
  colors: string[];
  tools: Tool[];
}

export function Toolbar({
  tool,
  setTool,
  color,
  setColor,
  lineWidth,
  setLineWidth,
  darkMode,
  setDarkMode,
  onReset,
  onCalculate,
  isCalculating,
  colors,
  tools
}: ToolbarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-b z-50">
      <div className="p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            {tools.map((t) => (
              <Button
                key={t}
                variant={tool === t ? "default" : "outline"}
                size="icon"
                onClick={() => setTool(t)}
              >
                {t === 'pen' ? <PenIcon /> : <EraserIcon />}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                className={cn(
                  "w-8 h-8 rounded-full transition-all",
                  c === '#FFFFFF' && "border border-border",
                  color === c && "ring-2 ring-primary ring-offset-2"
                )}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Slider
              value={[lineWidth]}
              onValueChange={(value) => setLineWidth(value[0])}
              min={1}
              max={20}
              step={1}
              className="w-32"
            />
            <span className="text-sm">{lineWidth}px</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={onReset}
            >
              Reset
            </Button>
            <Button
              variant="default"
              onClick={onCalculate}
              disabled={isCalculating}
            >
              {isCalculating ? 'Calculating...' : 'Calculate'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <MoonIcon /> : <SunIcon />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}