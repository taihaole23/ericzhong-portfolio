export type Point = { x: number; y: number };

export type PenType = 'normal' | 'calligraphy' | 'eraser';

export type Stroke = {
    points: Point[];
    type: PenType;
    width?: number; // Optional width for normal strokes
};

