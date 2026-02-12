"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stroke, Point, PenType } from '@/types/types';
import styles from './Canvas.module.css';

interface CanvasProps {
    width: number;
    height: number;
    penType: PenType;
    strokeWidth: number;
    strokes: Stroke[];
    onStrokesChange: (strokes: Stroke[]) => void;
    theme: 'light' | 'dark';
}

const Canvas: React.FC<CanvasProps> = ({ width, height, penType, strokeWidth, strokes, onStrokesChange, theme }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

    // Function to draw a single stroke
    const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
        if (stroke.points.length < 2 && stroke.type !== 'eraser') return;

        ctx.beginPath();

        if (stroke.type === 'normal') {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = stroke.width || strokeWidth; // Use stored width or fallback to current
            ctx.strokeStyle = theme === 'dark' ? '#f8fafc' : '#000';
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        } else if (stroke.type === 'calligraphy') {
            // Simulate calligraphy with a flat nib at 45 degrees
            ctx.fillStyle = theme === 'dark' ? '#f8fafc' : '#000';
            const nibWidth = 12;
            const nibHeight = 3;
            const angle = -45 * (Math.PI / 180);

            for (let i = 0; i < stroke.points.length; i++) {
                const p = stroke.points[i];

                // Draw nib at current point
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(angle);
                ctx.fillRect(-nibWidth / 2, -nibHeight / 2, nibWidth, nibHeight);
                ctx.restore();

                // Fill gap between current and previous point
                if (i > 0) {
                    const prev = stroke.points[i - 1];
                    const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
                    const steps = Math.ceil(dist / 2);
                    for (let j = 1; j <= steps; j++) {
                        const t = j / steps;
                        const x = prev.x + (p.x - prev.x) * t;
                        const y = prev.y + (p.y - prev.y) * t;
                        ctx.save();
                        ctx.translate(x, y);
                        ctx.rotate(angle);
                        ctx.fillRect(-nibWidth / 2, -nibHeight / 2, nibWidth, nibHeight);
                        ctx.restore();
                    }
                }
            }
        } else if (stroke.type === 'eraser') {
            // We handle eraser by "destination-out" composite operation
            // But here we are drawing it. To visualize it (e.g. while drawing), we can use white.
            // However, for correct rendering of the final image, we should use destination-out.
            // The issue is: destination-out clears the canvas.
            // If we want to support layering (e.g. guidelines behind), we might need a separate layer for strokes.
            // For simplicity, let's just use destination-out on the same layer, but redraw guidelines after?
            // No, guidelines are usually background.
            // We can draw guidelines, then strokes.
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 20;
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
            ctx.restore();
        }
    }, [strokeWidth, theme]);

    // Main render loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Clear Canvas
        ctx.clearRect(0, 0, width, height);

        // 2. Draw Guidelines (Background)
        ctx.save();
        ctx.strokeStyle = theme === 'dark' ? '#334155' : '#e5e7eb'; // adaptive gray
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Baseline
        const baselineY = height * 0.75;
        ctx.moveTo(0, baselineY);
        ctx.lineTo(width, baselineY);
        // Cap height (approx 50% of height above baseline?)
        const capHeightY = height * 0.25;
        ctx.moveTo(0, capHeightY);
        ctx.lineTo(width, capHeightY);
        // X-height (middle)
        const xHeightY = height * 0.5;
        // dashed
        ctx.setLineDash([5, 5]);
        ctx.moveTo(0, xHeightY);
        ctx.lineTo(width, xHeightY);
        ctx.stroke();
        ctx.restore();

        // 3. Draw All Strokes
        // We need to group them or just draw them in order.
        // Eraser strokes need to apply to everything drawn BEFORE them.
        strokes.forEach(stroke => drawStroke(ctx, stroke));

        // 4. Draw Current Stroke (if drawing)
        if (isDrawing && currentPoints.length > 0) {
            // If eraser, we visualize it
            // The type is passed as prop 'penType'
            const tempStroke: Stroke = { points: currentPoints, type: penType };
            drawStroke(ctx, tempStroke);
        }

    }, [strokes, isDrawing, currentPoints, width, height, penType, drawStroke, theme]);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDrawing(true);
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCurrentPoints([{ x, y }]);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCurrentPoints(prev => [...prev, { x, y }]);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        setIsDrawing(false);
        if (currentPoints.length > 0) {
            // Add new stroke with current width for normal strokes
            const newStroke: Stroke = {
                points: currentPoints,
                type: penType,
                width: penType === 'normal' ? strokeWidth : undefined
            };
            onStrokesChange([...strokes, newStroke]);
        }
        setCurrentPoints([]);
    };

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={styles.canvasContainer}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp} // Also stop drawing if leaving canvas
        />
    );
};

export default Canvas;
