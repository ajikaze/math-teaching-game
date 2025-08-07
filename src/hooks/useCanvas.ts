import { useRef, useEffect, useState, useCallback } from 'react';
import { Point, Shape, DragState, CanvasConfig, CANVAS_CONSTANTS } from '../types/MathTypes';
import { CanvasUtils } from '../utils/CanvasUtils';

export const useCanvas = (shapes: Shape[], canvasConfig: CanvasConfig) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dragState, setDragState] = useState<DragState>({
        isDragging: null,
        dragOffset: { x: 0, y: 0 }
    });

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(canvasConfig.zoom, canvasConfig.zoom);

        // Draw grid
        if (canvasConfig.showGrid) {
            CanvasUtils.drawGrid(ctx, canvas.width, canvas.height);
        }

        // Draw shapes
        shapes.forEach(shape => {
            CanvasUtils.drawShape(ctx, shape);
        });

        // Draw measurements
        if (canvasConfig.showMeasurements) {
            drawMeasurements(ctx);
        }

        ctx.restore();
    }, [shapes, canvasConfig]);

    const drawMeasurements = useCallback((ctx: CanvasRenderingContext2D) => {
        shapes.forEach(shape => {
            if (shape.type === 'circle') {
                try {
                    const measurements = CanvasUtils.getCircleMeasurements(shape);
                    const center = shape.points[0];

                    ctx.fillStyle = '#374151';
                    ctx.font = '12px Arial';
                    ctx.fillText(`半径: ${measurements.radius.toFixed(1)}px`, center.x + 10, center.y - 30);
                    ctx.fillText(`面積: ${measurements.area.toFixed(1)}px²`, center.x + 10, center.y - 15);
                } catch (error) {
                    console.warn('Failed to calculate measurements:', error);
                }
            }
        });
    }, [shapes]);

    const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / canvasConfig.zoom,
            y: (e.clientY - rect.top) / canvasConfig.zoom
        };
    }, [canvasConfig.zoom]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const point = getCanvasPoint(e);

        // Check if clicking on draggable points
        shapes.forEach(shape => {
            if (!shape.draggable) return;

            if (shape.type === 'circle') {
                const edge = shape.points[1];
                if (CanvasUtils.calculateDistance(point, edge) < CANVAS_CONSTANTS.DRAG_TOLERANCE) {
                    setDragState({
                        isDragging: shape.id,
                        dragOffset: { x: point.x - edge.x, y: point.y - edge.y }
                    });
                }
            } else if (shape.type === 'triangle') {
                shape.points.forEach((shapePoint, index) => {
                    if (CanvasUtils.calculateDistance(point, shapePoint) < CANVAS_CONSTANTS.DRAG_TOLERANCE) {
                        setDragState({
                            isDragging: `${shape.id}-${index}`,
                            dragOffset: { x: point.x - shapePoint.x, y: point.y - shapePoint.y }
                        });
                    }
                });
            }
        });
    }, [shapes, getCanvasPoint]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!dragState.isDragging) return;

        const point = getCanvasPoint(e);
        const newPoint = {
            x: point.x - dragState.dragOffset.x,
            y: point.y - dragState.dragOffset.y
        };

        return {
            dragId: dragState.isDragging,
            newPoint
        };
    }, [dragState, getCanvasPoint]);

    const handleMouseUp = useCallback(() => {
        setDragState({
            isDragging: null,
            dragOffset: { x: 0, y: 0 }
        });
    }, []);

    useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);

    return {
        canvasRef,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        drawCanvas,
        dragState
    };
};