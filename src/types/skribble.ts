export type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'triangle' | 'arrow';

export type ResultType = 'expression' | 'equation' | 'variable' | 'graph' | 'word_problem' | 'error' | 'calculus' | 'matrix';

export type Shape = {
  id: string;
  tool: Tool;
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth: number;
};

export type Step = {
  step: string;
  operation?: string;
  result?: string;
};

export type MathResult = {
  expr: string;
  type: ResultType;
  domain?: string;
  confidence?: number;
  steps: Step[];
  result: string;
  alternatives?: string[];
  warnings?: string[];
}; 