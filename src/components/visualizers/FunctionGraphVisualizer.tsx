import React, { useState, useRef, useEffect } from 'react';
import { 
    BarChart3, 
    Play, 
    Pause, 
    RefreshCw,
    Settings,
    Download,
    TrendingUp
} from 'lucide-react';
import { FunctionConfig, FunctionParameters, ViewConfig } from '../../types/MathTypes';
import { CanvasUtils } from '../../utils/CanvasUtils';

const FunctionGraphVisualizer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    
    const [functions, setFunctions] = useState<FunctionConfig[]>([
        {
            id: 'linear',
            name: '一次関数',
            expression: 'y = 2x + 1',
            color: '#3B82F6',
            visible: true
        },
        {
            id: 'quadratic',
            name: '二次関数',
            expression: 'y = x² - 2x + 1',
            color: '#EF4444',
            visible: true
        },
        {
            id: 'sine',
            name: '三角関数',
            expression: 'y = sin(x)',
            color: '#10B981',
            visible: false,
            animated: true,
            animationSpeed: 1
        }
    ]);

    const [parameters, setParameters] = useState<FunctionParameters>({
        a: 1,
        b: 0,
        c: 0,
        amplitude: 1,
        frequency: 1,
        phase: 0
    });

    const [viewConfig, setViewConfig] = useState<ViewConfig>({
        xMin: -10,
        xMax: 10,
        yMin: -10,
        yMax: 10,
        gridSize: 1,
        showGrid: true,
        showAxes: true,
        showLabels: true
    });

    const [isAnimating, setIsAnimating] = useState(false);
    const [animationTime, setAnimationTime] = useState(0);

    useEffect(() => {
        drawGraph();
    }, [functions, parameters, viewConfig, animationTime]);

    useEffect(() => {
        if (isAnimating) {
            const animate = () => {
                setAnimationTime(prev => prev + 0.05);
                animationRef.current = requestAnimationFrame(animate);
            };
            animate();
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isAnimating]);

    const drawGraph = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Set up coordinate system
        const xScale = width / (viewConfig.xMax - viewConfig.xMin);
        const yScale = height / (viewConfig.yMax - viewConfig.yMin);

        const xOffset = -viewConfig.xMin * xScale;
        const yOffset = height + viewConfig.yMin * yScale;

        // Draw grid
        if (viewConfig.showGrid) {
            CanvasUtils.drawFunctionGrid(ctx, width, height, xScale, yScale, xOffset, yOffset, viewConfig);
        }

        // Draw axes
        if (viewConfig.showAxes) {
            CanvasUtils.drawAxes(ctx, width, height, viewConfig, xOffset, yOffset);
        }

        // Draw functions
        functions.forEach(func => {
            if (func.visible) {
                CanvasUtils.drawFunction(ctx, func, xScale, yScale, xOffset, yOffset, viewConfig, parameters, animationTime);
            }
        });

        // Draw function labels
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 14px Arial';
        functions.forEach((func, index) => {
            if (func.visible) {
                ctx.fillStyle = func.color;
                ctx.fillText(func.name, 10, 30 + index * 25);
            }
        });
    };

    const toggleFunction = (id: string) => {
        setFunctions(prev => 
            prev.map(func => 
                func.id === id ? { ...func, visible: !func.visible } : func
            )
        );
    };

    const toggleAnimation = () => {
        setIsAnimating(!isAnimating);
    };

    const resetView = () => {
        setViewConfig({
            xMin: -10,
            xMax: 10,
            yMin: -10,
            yMax: 10,
            gridSize: 1,
            showGrid: true,
            showAxes: true,
            showLabels: true
        });
        setParameters({
            a: 1,
            b: 0,
            c: 0,
            amplitude: 1,
            frequency: 1,
            phase: 0
        });
        setAnimationTime(0);
    };

    const exportGraph = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = 'math-graph.png';
        link.href = canvas.toDataURL();
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <TrendingUp className="mr-2 text-blue-500" />
                    関数グラフ可視化
                </h3>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={toggleAnimation}
                        className={`p-2 rounded transition-colors ${
                            isAnimating ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}
                    >
                        {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={resetView}
                        className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={exportGraph}
                        className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Canvas */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <canvas
                            ref={canvasRef}
                            width={600}
                            height={400}
                            className="border rounded-lg w-full"
                        />
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                    {/* Function Toggles */}
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            関数
                        </h4>
                        <div className="space-y-2">
                            {functions.map(func => (
                                <div key={func.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={func.visible}
                                        onChange={() => toggleFunction(func.id)}
                                        className="rounded"
                                    />
                                    <div
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: func.color }}
                                    />
                                    <span className="text-sm text-gray-700">{func.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Parameters */}
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <Settings className="w-4 h-4 mr-2" />
                            パラメータ
                        </h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">係数 a</label>
                                <input
                                    type="range"
                                    min={-5}
                                    max={5}
                                    step={0.1}
                                    value={parameters.a}
                                    onChange={(e) => setParameters(prev => ({ ...prev, a: parseFloat(e.target.value) }))}
                                    className="w-full"
                                />
                                <div className="text-xs text-gray-500 text-center">{parameters.a.toFixed(1)}</div>
                            </div>
                            
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">係数 b</label>
                                <input
                                    type="range"
                                    min={-5}
                                    max={5}
                                    step={0.1}
                                    value={parameters.b}
                                    onChange={(e) => setParameters(prev => ({ ...prev, b: parseFloat(e.target.value) }))}
                                    className="w-full"
                                />
                                <div className="text-xs text-gray-500 text-center">{parameters.b.toFixed(1)}</div>
                            </div>
                            
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">係数 c</label>
                                <input
                                    type="range"
                                    min={-5}
                                    max={5}
                                    step={0.1}
                                    value={parameters.c}
                                    onChange={(e) => setParameters(prev => ({ ...prev, c: parseFloat(e.target.value) }))}
                                    className="w-full"
                                />
                                <div className="text-xs text-gray-500 text-center">{parameters.c.toFixed(1)}</div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-600 mb-1">振幅</label>
                                <input
                                    type="range"
                                    min={0.1}
                                    max={3}
                                    step={0.1}
                                    value={parameters.amplitude}
                                    onChange={(e) => setParameters(prev => ({ ...prev, amplitude: parseFloat(e.target.value) }))}
                                    className="w-full"
                                />
                                <div className="text-xs text-gray-500 text-center">{parameters.amplitude.toFixed(1)}</div>
                            </div>
                            
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">周波数</label>
                                <input
                                    type="range"
                                    min={0.1}
                                    max={3}
                                    step={0.1}
                                    value={parameters.frequency}
                                    onChange={(e) => setParameters(prev => ({ ...prev, frequency: parseFloat(e.target.value) }))}
                                    className="w-full"
                                />
                                <div className="text-xs text-gray-500 text-center">{parameters.frequency.toFixed(1)}</div>
                            </div>
                        </div>
                    </div>

                    {/* View Settings */}
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">表示設定</h4>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={viewConfig.showGrid}
                                    onChange={(e) => setViewConfig(prev => ({ ...prev, showGrid: e.target.checked }))}
                                    className="rounded"
                                />
                                <span className="text-sm text-gray-700">グリッド</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={viewConfig.showAxes}
                                    onChange={(e) => setViewConfig(prev => ({ ...prev, showAxes: e.target.checked }))}
                                    className="rounded"
                                />
                                <span className="text-sm text-gray-700">座標軸</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={viewConfig.showLabels}
                                    onChange={(e) => setViewConfig(prev => ({ ...prev, showLabels: e.target.checked }))}
                                    className="rounded"
                                />
                                <span className="text-sm text-gray-700">ラベル</span>
                            </div>
                        </div>
                    </div>

                    {/* Current Equation */}
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">現在の式</h4>
                        <div className="space-y-1 text-sm">
                            <div className="font-mono text-blue-700">
                                y = {parameters.a.toFixed(1)}x² + {parameters.b.toFixed(1)}x + {parameters.c.toFixed(1)}
                            </div>
                            <div className="font-mono text-blue-700">
                                y = {parameters.amplitude.toFixed(1)}sin({parameters.frequency.toFixed(1)}x)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FunctionGraphVisualizer;