import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RefreshCw, Square, Ruler } from 'lucide-react';
import { VisualProblem, Shape, CanvasConfig, CANVAS_CONSTANTS } from '../../types/MathTypes';
import { useCanvas } from '../../hooks/useCanvas';

interface InteractiveCanvasProps {
    problem: VisualProblem;
    shapes: Shape[];
    onShapeUpdate: (shapes: Shape[]) => void;
}

const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
    problem,
    shapes,
    onShapeUpdate
}) => {
    const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>({
        width: CANVAS_CONSTANTS.DEFAULT_WIDTH,
        height: CANVAS_CONSTANTS.DEFAULT_HEIGHT,
        zoom: 1,
        showGrid: true,
        showMeasurements: false
    });

    const {
        canvasRef,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp
    } = useCanvas(shapes, canvasConfig);

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const moveResult = handleMouseMove(e);
        if (!moveResult) return;

        const { dragId, newPoint } = moveResult;

        const updatedShapes = shapes.map(shape => {
            if (dragId === shape.id && shape.type === 'circle') {
                return {
                    ...shape,
                    points: [shape.points[0], newPoint]
                };
            } else if (dragId.startsWith(shape.id) && shape.type === 'triangle') {
                const pointIndex = parseInt(dragId.split('-')[1]);
                const newPoints = [...shape.points];
                newPoints[pointIndex] = newPoint;
                return {
                    ...shape,
                    points: newPoints
                };
            }
            return shape;
        });

        onShapeUpdate(updatedShapes);
    };

    const resetShape = () => {
        onShapeUpdate([...problem.shapes]);
    };

    const updateZoom = (newZoom: number) => {
        const clampedZoom = Math.max(
            CANVAS_CONSTANTS.MIN_ZOOM,
            Math.min(CANVAS_CONSTANTS.MAX_ZOOM, newZoom)
        );
        setCanvasConfig(prev => ({ ...prev, zoom: clampedZoom }));
    };

    const toggleGrid = () => {
        setCanvasConfig(prev => ({ ...prev, showGrid: !prev.showGrid }));
    };

    const toggleMeasurements = () => {
        setCanvasConfig(prev => ({ ...prev, showMeasurements: !prev.showMeasurements }));
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">{problem.title}</h3>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={toggleGrid}
                        className={`p-2 rounded transition-colors ${
                            canvasConfig.showGrid ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'
                        }`}
                        title="グリッド表示"
                    >
                        <Square className="w-4 h-4" />
                    </button>
                    <button
                        onClick={toggleMeasurements}
                        className={`p-2 rounded transition-colors ${
                            canvasConfig.showMeasurements ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}
                        title="寸法表示"
                    >
                        <Ruler className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => updateZoom(canvasConfig.zoom * 1.2)}
                        className="p-2 bg-gray-100 text-gray-500 rounded hover:bg-gray-200"
                        title="拡大"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => updateZoom(canvasConfig.zoom / 1.2)}
                        className="p-2 bg-gray-100 text-gray-500 rounded hover:bg-gray-200"
                        title="縮小"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                        onClick={resetShape}
                        className="p-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                        title="リセット"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={canvasConfig.width}
                    height={canvasConfig.height}
                    className="cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
            </div>

            <p className="text-sm text-gray-600 mt-2">
                {problem.description}
            </p>

            {/* Zoom Control */}
            <div className="mt-4">
                <label className="block text-sm text-gray-600 mb-1">拡大率</label>
                <input
                    type="range"
                    min={CANVAS_CONSTANTS.MIN_ZOOM}
                    max={CANVAS_CONSTANTS.MAX_ZOOM}
                    step={0.1}
                    value={canvasConfig.zoom}
                    onChange={(e) => updateZoom(parseFloat(e.target.value))}
                    className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">
                    {Math.round(canvasConfig.zoom * 100)}%
                </div>
            </div>

            {/* Settings */}
            <div className="mt-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="showGrid"
                        checked={canvasConfig.showGrid}
                        onChange={toggleGrid}
                        className="rounded"
                    />
                    <label htmlFor="showGrid" className="text-sm text-gray-600">
                        グリッド表示
                    </label>
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="showMeasurements"
                        checked={canvasConfig.showMeasurements}
                        onChange={toggleMeasurements}
                        className="rounded"
                    />
                    <label htmlFor="showMeasurements" className="text-sm text-gray-600">
                        寸法表示
                    </label>
                </div>
            </div>
        </div>
    );
};

export default InteractiveCanvas;