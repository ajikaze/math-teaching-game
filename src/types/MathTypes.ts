export interface Point {
    x: number;
    y: number;
}

export interface Shape {
    id: string;
    type: 'circle' | 'rectangle' | 'triangle' | 'line';
    points: Point[];
    color: string;
    label?: string;
    draggable?: boolean;
}

export interface VisualProblem {
    id: string;
    title: string;
    description: string;
    category: 'geometry' | 'algebra' | 'functions';
    shapes: Shape[];
    answer?: number;
    explanation?: string;
}

export interface FunctionConfig {
    id: string;
    name: string;
    expression: string;
    color: string;
    visible: boolean;
    animated?: boolean;
    animationSpeed?: number;
}

export interface FunctionParameters {
    a: number;
    b: number;
    c: number;
    amplitude: number;
    frequency: number;
    phase: number;
}

export interface ViewConfig {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    gridSize: number;
    showGrid: boolean;
    showAxes: boolean;
    showLabels: boolean;
}

export interface CanvasConfig {
    width: number;
    height: number;
    zoom: number;
    showGrid: boolean;
    showMeasurements: boolean;
}

export interface DragState {
    isDragging: string | null;
    dragOffset: Point;
}

export type VisualizationType = 'function' | '3d' | 'animation';

export type TabType = 'interactive' | 'functions' | '3d' | 'animations';

export interface CircleMeasurements {
    radius: string;
    area: string;
    circumference: string;
}

export const CANVAS_CONSTANTS = {
    DEFAULT_WIDTH: 400,
    DEFAULT_HEIGHT: 300,
    DEFAULT_GRID_SIZE: 20,
    MIN_ZOOM: 0.5,
    MAX_ZOOM: 2,
    DRAG_TOLERANCE: 10,
} as const;