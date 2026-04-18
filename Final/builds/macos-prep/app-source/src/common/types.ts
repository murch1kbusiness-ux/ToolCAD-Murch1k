// Common types and interfaces shared between main and renderer processes

export interface Point {
  x: number;
  y: number;
}

export interface Parameter {
  id: string;
  name: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  description: string;
}

export interface Dimension {
  id: string;
  start: Point;
  end: Point;
  value: number;
  label: string;
  orientation: 'horizontal' | 'vertical' | 'aligned';
  offset: number; // Distance from the measured line
}

export interface DrawingShape {
  id: string;
  type: 'tool-profile' | 'custom';
  points: Point[];
  dimensions: Dimension[];
}

export interface ViewState {
  view: 'front' | 'side' | 'top';
  scale: number;
  offset: Point;
}

export interface BackgroundStyle {
  type: 'solid' | 'grid' | 'millimeter';
  color: string;
  gridColor?: string;
  gridSize?: number;
}

export interface DrawingState {
  parameters: Parameter[];
  shapes: DrawingShape[];
  view: ViewState;
  background: BackgroundStyle;
}

export interface Constraint {
  type: 'fixed-distance' | 'parallel' | 'perpendicular' | 'coincident' | 'symmetric';
  pointIds: string[];
  value?: number;
  reference?: string;
}

// Bezier control point stored as parametric (t along edge, d perpendicular offset in mm)
export interface BezierCP {
  t: number;
  d: number;
}

export interface BezierEdge {
  cp1: BezierCP;
  cp2: BezierCP;
}

// Template definition for built-in and custom tool profiles
export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  parameterOverrides: Partial<Record<string, number>>;
}

// Serializable project state for .tproj files
export interface ProjectState {
  version: string;
  templateId: string;
  parameters: Parameter[];
  background: BackgroundStyle;
  view: ViewState;
  cornerRadius: number;
  bezierEdges: (BezierEdge | null)[];
  createdAt: string;
  updatedAt: string;
}

// Message types for IPC
export interface Message {
  type: string;
  payload: any;
}

export const MessageTypes = {
  UPDATE_PARAMETER: 'update-parameter',
  UPDATE_SHAPE: 'update-shape',
  EXPORT_REQUEST: 'export-request',
  VIEW_CHANGE: 'view-change',
  BACKGROUND_CHANGE: 'background-change',
  DIMENSION_CLICK: 'dimension-click',
} as const;
