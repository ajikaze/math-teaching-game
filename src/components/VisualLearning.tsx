import React, { useState, useRef, useEffect } from 'react';
import { 
    ZoomIn, 
    ZoomOut, 
    RefreshCw,
    Square,
    Ruler,
    Calculator,
    Eye,
    TrendingUp,
    Box,
    Activity
} from 'lucide-react';
import MathVisualizer from './MathVisualizer';

interface Point {
    x: number;
    y: number;
}

interface Shape {
    id: string;
    type: 'circle' | 'rectangle' | 'triangle' | 'line';
    points: Point[];
    color: string;
    label?: string;
    draggable?: boolean;
}

interface VisualProblem {
    id: string;
    title: string;
    description: string;
    category: 'geometry' | 'algebra' | 'functions';
    shapes: Shape[];
    answer?: number;
    explanation?: string;
}

const VisualLearning: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedProblem, setSelectedProblem] = useState<VisualProblem | null>(null);
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [isDragging, setIsDragging] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [showGrid, setShowGrid] = useState(true);
    const [showMeasurements, setShowMeasurements] = useState(false);
    const [currentTab, setCurrentTab] = useState<'interactive' | 'functions' | '3d' | 'animations'>('interactive');

    // Sample visual problems
    const visualProblems: VisualProblem[] = [
        {
            id: 'circle-area',
            title: '円の面積',
            description: '円の半径を変更して、面積の変化を観察しましょう',
            category: 'geometry',
            shapes: [
                {
                    id: 'circle1',
                    type: 'circle',
                    points: [{ x: 200, y: 150 }, { x: 250, y: 150 }], // center, edge point
                    color: '#3B82F6',
                    label: 'r',
                    draggable: true
                }
            ],
            answer: Math.PI * 50 * 50,
            explanation: '面積 = π × r² です'
        },
        {
            id: 'triangle-angles',
            title: '三角形の内角',
            description: '三角形の頂点を動かして、内角の合計を確認しましょう',
            category: 'geometry',
            shapes: [
                {
                    id: 'triangle1',
                    type: 'triangle',
                    points: [
                        { x: 150, y: 100 },
                        { x: 250, y: 200 },
                        { x: 100, y: 200 }
                    ],
                    color: '#10B981',
                    draggable: true
                }
            ],
            answer: 180,
            explanation: '三角形の内角の和は常に180°です'
        },
        {
            id: 'quadratic-function',
            title: '二次関数のグラフ',
            description: 'y = ax² + bx + c のパラメータを変更して、グラフの変化を見てみましょう',
            category: 'functions',
            shapes: [], // Will be generated dynamically
            explanation: '二次関数の係数がグラフの形を決定します'
        }
    ];

    useEffect(() => {
        if (selectedProblem) {
            setShapes([...selectedProblem.shapes]);
            drawCanvas();
        }
    }, [selectedProblem, zoom, showGrid]);

    useEffect(() => {
        drawCanvas();
    }, [shapes, showMeasurements]);

    const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(zoom, zoom);

        // Draw grid
        if (showGrid) {
            drawGrid(ctx);
        }

        // Draw shapes
        shapes.forEach(shape => {
            drawShape(ctx, shape);
        });

        // Draw measurements
        if (showMeasurements) {
            drawMeasurements(ctx);
        }

        ctx.restore();
    };

    const drawGrid = (ctx: CanvasRenderingContext2D) => {
        const gridSize = 20;
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 0.5;

        for (let x = 0; x < 400; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 300);
            ctx.stroke();
        }

        for (let y = 0; y < 300; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(400, y);
            ctx.stroke();
        }
    };

    const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
        ctx.fillStyle = shape.color + '40'; // Add transparency
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 2;

        switch (shape.type) {
            case 'circle':
                const center = shape.points[0];
                const edge = shape.points[1];
                const radius = Math.sqrt(
                    Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
                );
                
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
                break;

            case 'triangle':
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
                break;

            case 'rectangle':
                const width = Math.abs(shape.points[1].x - shape.points[0].x);
                const height = Math.abs(shape.points[1].y - shape.points[0].y);
                ctx.fillRect(shape.points[0].x, shape.points[0].y, width, height);
                ctx.strokeRect(shape.points[0].x, shape.points[0].y, width, height);
                break;
        }
    };

    const drawMeasurements = (ctx: CanvasRenderingContext2D) => {
        shapes.forEach(shape => {
            if (shape.type === 'circle') {
                const center = shape.points[0];
                const edge = shape.points[1];
                const radius = Math.sqrt(
                    Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
                );
                const area = Math.PI * radius * radius;

                ctx.fillStyle = '#374151';
                ctx.font = '12px Arial';
                ctx.fillText(`半径: ${radius.toFixed(1)}px`, center.x + 10, center.y - 30);
                ctx.fillText(`面積: ${area.toFixed(1)}px²`, center.x + 10, center.y - 15);
            }
        });
    };

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;

        // Check if clicking on draggable points
        shapes.forEach(shape => {
            if (!shape.draggable) return;

            if (shape.type === 'circle') {
                const edge = shape.points[1];
                const distance = Math.sqrt(Math.pow(x - edge.x, 2) + Math.pow(y - edge.y, 2));
                if (distance < 10) {
                    setIsDragging(shape.id);
                    setDragOffset({ x: x - edge.x, y: y - edge.y });
                }
            } else if (shape.type === 'triangle') {
                shape.points.forEach((point, index) => {
                    const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
                    if (distance < 10) {
                        setIsDragging(`${shape.id}-${index}`);
                        setDragOffset({ x: x - point.x, y: y - point.y });
                    }
                });
            }
        });
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom - dragOffset.x;
        const y = (e.clientY - rect.top) / zoom - dragOffset.y;

        setShapes(prevShapes => {
            return prevShapes.map(shape => {
                if (isDragging === shape.id && shape.type === 'circle') {
                    return {
                        ...shape,
                        points: [shape.points[0], { x, y }]
                    };
                } else if (isDragging.startsWith(shape.id) && shape.type === 'triangle') {
                    const pointIndex = parseInt(isDragging.split('-')[1]);
                    const newPoints = [...shape.points];
                    newPoints[pointIndex] = { x, y };
                    return {
                        ...shape,
                        points: newPoints
                    };
                }
                return shape;
            });
        });
    };

    const handleCanvasMouseUp = () => {
        setIsDragging(null);
        setDragOffset({ x: 0, y: 0 });
    };

    const resetShape = () => {
        if (selectedProblem) {
            setShapes([...selectedProblem.shapes]);
        }
    };

    const getCurrentMeasurements = () => {
        if (!selectedProblem) return null;

        const shape = shapes[0];
        if (!shape) return null;

        if (shape.type === 'circle') {
            const center = shape.points[0];
            const edge = shape.points[1];
            const radius = Math.sqrt(
                Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
            );
            const area = Math.PI * radius * radius;
            const circumference = 2 * Math.PI * radius;

            return {
                radius: radius.toFixed(1),
                area: area.toFixed(1),
                circumference: circumference.toFixed(1)
            };
        }

        return null;
    };

    const measurements = getCurrentMeasurements();

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center">
                    <Eye className="mr-3 text-purple-500" />
                    ビジュアル学習
                </h2>
                <p className="text-gray-600">数学の概念を視覚的・体験的に理解しましょう</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-6">
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setCurrentTab('interactive')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                            currentTab === 'interactive' 
                                ? 'bg-white text-purple-700 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        <Square className="w-4 h-4" />
                        <span>図形操作</span>
                    </button>
                    <button
                        onClick={() => setCurrentTab('functions')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                            currentTab === 'functions' 
                                ? 'bg-white text-blue-700 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        <span>関数グラフ</span>
                    </button>
                    <button
                        onClick={() => setCurrentTab('3d')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                            currentTab === '3d' 
                                ? 'bg-white text-green-700 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        <Box className="w-4 h-4" />
                        <span>3Dオブジェクト</span>
                    </button>
                    <button
                        onClick={() => setCurrentTab('animations')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                            currentTab === 'animations' 
                                ? 'bg-white text-orange-700 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        <Activity className="w-4 h-4" />
                        <span>アニメーション</span>
                    </button>
                </div>
            </div>

            {/* Content based on selected tab */}
            {currentTab === 'functions' && (
                <MathVisualizer type="function" />
            )}

            {currentTab === '3d' && (
                <MathVisualizer type="3d" />
            )}

            {currentTab === 'animations' && (
                <MathVisualizer type="animation" />
            )}

            {currentTab === 'interactive' && (
                <>
                    {/* Problem Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {visualProblems.map(problem => (
                            <button
                                key={problem.id}
                                onClick={() => setSelectedProblem(problem)}
                                className={`p-4 rounded-lg border-2 text-left transition-all ${
                                    selectedProblem?.id === problem.id
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-gray-200 bg-white hover:border-purple-300'
                                }`}
                            >
                                <div className="flex items-center mb-2">
                                    {problem.category === 'geometry' && <Square className="w-5 h-5 text-blue-500 mr-2" />}
                                    {problem.category === 'algebra' && <Calculator className="w-5 h-5 text-green-500 mr-2" />}
                                    {problem.category === 'functions' && <Ruler className="w-5 h-5 text-purple-500 mr-2" />}
                                    <span className="font-semibold">{problem.title}</span>
                                </div>
                                <p className="text-sm text-gray-600">{problem.description}</p>
                            </button>
                        ))}
                    </div>

            {selectedProblem && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Canvas Area */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-800">{selectedProblem.title}</h3>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setShowGrid(!showGrid)}
                                        className={`p-2 rounded transition-colors ${
                                            showGrid ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'
                                        }`}
                                        title="グリッド表示"
                                    >
                                        <Square className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setShowMeasurements(!showMeasurements)}
                                        className={`p-2 rounded transition-colors ${
                                            showMeasurements ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'
                                        }`}
                                        title="寸法表示"
                                    >
                                        <Ruler className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setZoom(zoom * 1.2)}
                                        className="p-2 bg-gray-100 text-gray-500 rounded hover:bg-gray-200"
                                        title="拡大"
                                    >
                                        <ZoomIn className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setZoom(zoom / 1.2)}
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
                                    width={400}
                                    height={300}
                                    className="cursor-crosshair"
                                    onMouseDown={handleCanvasMouseDown}
                                    onMouseMove={handleCanvasMouseMove}
                                    onMouseUp={handleCanvasMouseUp}
                                    onMouseLeave={handleCanvasMouseUp}
                                />
                            </div>

                            <p className="text-sm text-gray-600 mt-2">
                                {selectedProblem.description}
                            </p>
                        </div>
                    </div>

                    {/* Control Panel */}
                    <div className="space-y-4">
                        {/* Measurements */}
                        {measurements && (
                            <div className="bg-white rounded-lg shadow-sm border p-4">
                                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                    <Calculator className="w-4 h-4 mr-2" />
                                    計算結果
                                </h4>
                                <div className="space-y-2 text-sm">
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
                            </div>
                        )}

                        {/* Explanation */}
                        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                            <h4 className="font-semibold text-blue-800 mb-2">解説</h4>
                            <p className="text-sm text-blue-700">
                                {selectedProblem.explanation}
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="bg-white rounded-lg shadow-sm border p-4">
                            <h4 className="font-semibold text-gray-800 mb-3">コントロール</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">拡大率</label>
                                    <input
                                        type="range"
                                        min={0.5}
                                        max={2}
                                        step={0.1}
                                        value={zoom}
                                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="text-xs text-gray-500 text-center">{Math.round(zoom * 100)}%</div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="showGrid"
                                        checked={showGrid}
                                        onChange={(e) => setShowGrid(e.target.checked)}
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
                                        checked={showMeasurements}
                                        onChange={(e) => setShowMeasurements(e.target.checked)}
                                        className="rounded"
                                    />
                                    <label htmlFor="showMeasurements" className="text-sm text-gray-600">
                                        寸法表示
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                            <h4 className="font-semibold text-yellow-800 mb-2">💡 使い方のヒント</h4>
                            <ul className="text-xs text-yellow-700 space-y-1">
                                <li>• 赤い点をドラッグして図形を変形できます</li>
                                <li>• グリッドを表示して正確な位置を確認しましょう</li>
                                <li>• 寸法表示で数値の変化を観察してください</li>
                                <li>• リセットボタンで初期状態に戻せます</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

                    {/* Empty State */}
                    {!selectedProblem && (
                        <div className="text-center py-12 text-gray-500">
                            <Eye size={48} className="mx-auto mb-4 opacity-50" />
                            <p>上の問題を選択して、インタラクティブ学習を始めましょう</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default VisualLearning;