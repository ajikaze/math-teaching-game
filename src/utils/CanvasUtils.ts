import { Point, Shape, ViewConfig, FunctionConfig, FunctionParameters, CANVAS_CONSTANTS } from '../types/MathTypes';

export class CanvasUtils {
    static drawGrid(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        gridSize: number = CANVAS_CONSTANTS.DEFAULT_GRID_SIZE
    ): void {
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 0.5;

        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    static drawAxes(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        viewConfig: ViewConfig,
        xOffset: number,
        yOffset: number
    ): void {
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;

        // X-axis
        if (viewConfig.yMin <= 0 && viewConfig.yMax >= 0) {
            ctx.beginPath();
            ctx.moveTo(0, yOffset);
            ctx.lineTo(width, yOffset);
            ctx.stroke();
        }

        // Y-axis
        if (viewConfig.xMin <= 0 && viewConfig.xMax >= 0) {
            ctx.beginPath();
            ctx.moveTo(xOffset, 0);
            ctx.lineTo(xOffset, height);
            ctx.stroke();
        }

        // Labels
        if (viewConfig.showLabels) {
            ctx.fillStyle = '#374151';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('x', width - 15, yOffset - 5);
            ctx.save();
            ctx.translate(xOffset + 15, 15);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('y', 0, 0);
            ctx.restore();
        }
    }

    static drawFunctionGrid(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        xScale: number,
        yScale: number,
        xOffset: number,
        yOffset: number,
        viewConfig: ViewConfig
    ): void {
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 0.5;

        // Vertical lines
        for (let x = viewConfig.xMin; x <= viewConfig.xMax; x += viewConfig.gridSize) {
            const canvasX = x * xScale + xOffset;
            ctx.beginPath();
            ctx.moveTo(canvasX, 0);
            ctx.lineTo(canvasX, height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = viewConfig.yMin; y <= viewConfig.yMax; y += viewConfig.gridSize) {
            const canvasY = yOffset - y * yScale;
            ctx.beginPath();
            ctx.moveTo(0, canvasY);
            ctx.lineTo(width, canvasY);
            ctx.stroke();
        }
    }

    static drawCircle(ctx: CanvasRenderingContext2D, shape: Shape): void {
        const center = shape.points[0];
        const edge = shape.points[1];
        const radius = Math.sqrt(
            Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
        );
        
        ctx.fillStyle = shape.color + '40';
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Draw radius line
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(edge.x, edge.y);
        ctx.stroke();

        // Draw center point
        ctx.fillStyle = shape.color;
        ctx.beginPath();
        ctx.arc(center.x, center.y, 3, 0, 2 * Math.PI);
        ctx.fill();

        // Draw edge point (draggable)
        if (shape.draggable) {
            ctx.fillStyle = '#EF4444';
            ctx.beginPath();
            ctx.arc(edge.x, edge.y, 5, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Label
        if (shape.label) {
            ctx.fillStyle = '#374151';
            ctx.font = '14px Arial';
            const midX = (center.x + edge.x) / 2;
            const midY = (center.y + edge.y) / 2 - 10;
            ctx.fillText(shape.label, midX, midY);
        }
    }

    static drawTriangle(ctx: CanvasRenderingContext2D, shape: Shape): void {
        ctx.fillStyle = shape.color + '40';
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        shape.points.forEach((point, index) => {
            if (index > 0) {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw vertices
        if (shape.draggable) {
            shape.points.forEach(point => {
                ctx.fillStyle = '#EF4444';
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
    }

    static drawRectangle(ctx: CanvasRenderingContext2D, shape: Shape): void {
        const width = Math.abs(shape.points[1].x - shape.points[0].x);
        const height = Math.abs(shape.points[1].y - shape.points[0].y);
        
        ctx.fillStyle = shape.color + '40';
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 2;
        
        ctx.fillRect(shape.points[0].x, shape.points[0].y, width, height);
        ctx.strokeRect(shape.points[0].x, shape.points[0].y, width, height);
    }

    static drawShape(ctx: CanvasRenderingContext2D, shape: Shape): void {
        switch (shape.type) {
            case 'circle':
                this.drawCircle(ctx, shape);
                break;
            case 'triangle':
                this.drawTriangle(ctx, shape);
                break;
            case 'rectangle':
                this.drawRectangle(ctx, shape);
                break;
        }
    }

    static drawFunction(
        ctx: CanvasRenderingContext2D,
        func: FunctionConfig,
        xScale: number,
        yScale: number,
        xOffset: number,
        yOffset: number,
        viewConfig: ViewConfig,
        parameters: FunctionParameters,
        animationTime: number = 0
    ): void {
        ctx.strokeStyle = func.color;
        ctx.lineWidth = 3;
        ctx.beginPath();

        let isFirst = true;

        for (let x = viewConfig.xMin; x <= viewConfig.xMax; x += 0.1) {
            let y = this.evaluateFunction(func, x, parameters, animationTime);

            const canvasX = x * xScale + xOffset;
            const canvasY = yOffset - y * yScale;

            if (isFirst) {
                ctx.moveTo(canvasX, canvasY);
                isFirst = false;
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        }

        ctx.stroke();
    }

    static evaluateFunction(
        func: FunctionConfig,
        x: number,
        parameters: FunctionParameters,
        animationTime: number = 0
    ): number {
        switch (func.id) {
            case 'linear':
                return parameters.a * x + parameters.b;
            case 'quadratic':
                return parameters.a * x * x + parameters.b * x + parameters.c;
            case 'sine':
                if (func.animated) {
                    return parameters.amplitude * Math.sin(parameters.frequency * x + animationTime);
                }
                return parameters.amplitude * Math.sin(parameters.frequency * x + parameters.phase);
            case 'cosine':
                return parameters.amplitude * Math.cos(parameters.frequency * x + parameters.phase);
            case 'exponential':
                return Math.pow(parameters.a, x);
            case 'logarithm':
                return Math.log(x) / Math.log(parameters.a);
            default:
                return 0;
        }
    }

    static calculateDistance(point1: Point, point2: Point): number {
        return Math.sqrt(
            Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
        );
    }

    static isPointNearShape(point: Point, shape: Shape, tolerance: number = CANVAS_CONSTANTS.DRAG_TOLERANCE): boolean {
        if (!shape.draggable) return false;

        if (shape.type === 'circle') {
            const edge = shape.points[1];
            return this.calculateDistance(point, edge) < tolerance;
        } else if (shape.type === 'triangle') {
            return shape.points.some(shapePoint => 
                this.calculateDistance(point, shapePoint) < tolerance
            );
        }

        return false;
    }

    static getCircleMeasurements(shape: Shape): { radius: number; area: number; circumference: number } {
        if (shape.type !== 'circle') {
            throw new Error('Shape must be a circle');
        }

        const center = shape.points[0];
        const edge = shape.points[1];
        const radius = this.calculateDistance(center, edge);
        
        return {
            radius,
            area: Math.PI * radius * radius,
            circumference: 2 * Math.PI * radius
        };
    }
}