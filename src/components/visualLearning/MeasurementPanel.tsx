import React from 'react';
import { Calculator } from 'lucide-react';
import { Shape, CircleMeasurements } from '../../types/MathTypes';
import { CanvasUtils } from '../../utils/CanvasUtils';

interface MeasurementPanelProps {
    shapes: Shape[];
}

const MeasurementPanel: React.FC<MeasurementPanelProps> = ({ shapes }) => {
    const getCurrentMeasurements = (): CircleMeasurements | null => {
        const circleShape = shapes.find(shape => shape.type === 'circle');
        if (!circleShape) return null;

        try {
            const measurements = CanvasUtils.getCircleMeasurements(circleShape);
            return {
                radius: measurements.radius.toFixed(1),
                area: measurements.area.toFixed(1),
                circumference: measurements.circumference.toFixed(1)
            };
        } catch (error) {
            console.warn('Failed to calculate measurements:', error);
            return null;
        }
    };

    const getTriangleAngles = (shape: Shape): number[] => {
        if (shape.type !== 'triangle' || shape.points.length !== 3) return [];

        const [p1, p2, p3] = shape.points;
        
        // Calculate angles using dot product
        const angle1 = calculateAngle(p2, p1, p3);
        const angle2 = calculateAngle(p1, p2, p3);
        const angle3 = calculateAngle(p1, p3, p2);

        return [angle1, angle2, angle3];
    };

    const calculateAngle = (center: { x: number; y: number }, point1: { x: number; y: number }, point2: { x: number; y: number }): number => {
        const v1 = { x: point1.x - center.x, y: point1.y - center.y };
        const v2 = { x: point2.x - center.x, y: point2.y - center.y };
        
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        
        const cosAngle = dot / (mag1 * mag2);
        const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
        
        return (angle * 180) / Math.PI;
    };

    const measurements = getCurrentMeasurements();
    const triangleShape = shapes.find(shape => shape.type === 'triangle');
    const triangleAngles = triangleShape ? getTriangleAngles(triangleShape) : [];

    if (!measurements && !triangleShape) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Calculator className="w-4 h-4 mr-2" />
                計算結果
            </h4>

            {/* Circle Measurements */}
            {measurements && (
                <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                        <span className="text-gray-600">半径:</span>
                        <span className="font-medium">{measurements.radius}px</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">面積:</span>
                        <span className="font-medium">{measurements.area}px²</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">円周:</span>
                        <span className="font-medium">{measurements.circumference}px</span>
                    </div>
                </div>
            )}

            {/* Triangle Measurements */}
            {triangleShape && triangleAngles.length === 3 && (
                <div className="space-y-2 text-sm">
                    <div className="font-medium text-gray-700 mb-2">三角形の内角:</div>
                    {triangleAngles.map((angle, index) => (
                        <div key={index} className="flex justify-between">
                            <span className="text-gray-600">角{index + 1}:</span>
                            <span className="font-medium">{angle.toFixed(1)}°</span>
                        </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-gray-600 font-medium">合計:</span>
                        <span className="font-medium text-blue-600">
                            {triangleAngles.reduce((sum, angle) => sum + angle, 0).toFixed(1)}°
                        </span>
                    </div>
                </div>
            )}

            {/* Formula Display */}
            {measurements && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 space-y-1">
                        <div>面積 = π × r²</div>
                        <div>円周 = 2π × r</div>
                    </div>
                </div>
            )}

            {triangleShape && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                        内角の和 = 180°
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeasurementPanel;