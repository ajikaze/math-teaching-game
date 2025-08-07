import React, { useState, useRef, useEffect } from 'react';
import { 
    BarChart3, 
    Zap, 
    Play, 
    Pause, 
    RotateCw,
    Settings,
    Download,
    RefreshCw,
    TrendingUp,
    Activity,
    Box
} from 'lucide-react';

interface FunctionConfig {
    id: string;
    name: string;
    expression: string;
    color: string;
    visible: boolean;
    animated?: boolean;
    animationSpeed?: number;
}

interface MathVisualizerProps {
    type: 'function' | '3d' | 'animation';
}

const MathVisualizer: React.FC<MathVisualizerProps> = ({ type }) => {
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

    const [parameters, setParameters] = useState({
        a: 1,
        b: 0,
        c: 0,
        amplitude: 1,
        frequency: 1,
        phase: 0
    });

    const [viewConfig, setViewConfig] = useState({
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
            drawGrid(ctx, width, height, xScale, yScale, xOffset, yOffset);
        }

        // Draw axes
        if (viewConfig.showAxes) {
            drawAxes(ctx, width, height, xOffset, yOffset);
        }

        // Draw functions
        functions.forEach(func => {
            if (func.visible) {
                drawFunction(ctx, func, xScale, yScale, xOffset, yOffset);
            }
        });
    };

    const drawGrid = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        xScale: number,
        yScale: number,
        xOffset: number,
        yOffset: number
    ) => {
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
    };

    const drawAxes = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        xOffset: number,
        yOffset: number
    ) => {
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
    };

    const drawFunction = (
        ctx: CanvasRenderingContext2D,
        func: FunctionConfig,
        xScale: number,
        yScale: number,
        xOffset: number,
        yOffset: number
    ) => {
        ctx.strokeStyle = func.color;
        ctx.lineWidth = 3;
        ctx.beginPath();

        let isFirst = true;

        for (let x = viewConfig.xMin; x <= viewConfig.xMax; x += 0.1) {
            let y = evaluateFunction(func, x);
            
            // Apply animation if enabled
            if (func.animated && isAnimating) {
                if (func.id === 'sine') {
                    y = parameters.amplitude * Math.sin(parameters.frequency * x + animationTime);
                }
            }

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

        // Draw function label
        ctx.fillStyle = func.color;
        ctx.font = 'bold 14px Arial';
        ctx.fillText(func.name, 10, 30 + functions.findIndex(f => f.id === func.id) * 25);
    };

    const evaluateFunction = (func: FunctionConfig, x: number): number => {
        switch (func.id) {
            case 'linear':
                return parameters.a * x + parameters.b;
            case 'quadratic':
                return parameters.a * x * x + parameters.b * x + parameters.c;
            case 'sine':
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

    if (type === 'function') {
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
    }

    if (type === '3d') {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center justify-center">
                        <Box className="mr-2 text-purple-500" />
                        3D数学オブジェクト
                    </h3>
                    <p className="text-gray-600 mt-2">立体的な数学オブジェクトを回転させて理解を深めましょう</p>
                </div>

                {/* 3D Objects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Cube */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="text-center mb-4">
                            <h4 className="font-semibold text-gray-800">立方体</h4>
                            <p className="text-sm text-gray-600">体積 = a³</p>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-8 text-center">
                            <div className="w-24 h-24 mx-auto bg-blue-200 border-4 border-blue-400 relative transform rotate-12 shadow-lg">
                                <div className="absolute -top-2 -right-2 w-24 h-24 bg-blue-300 border-4 border-blue-500 transform -translate-x-4 -translate-y-4 opacity-70"></div>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <button className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                                <RotateCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Sphere */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="text-center mb-4">
                            <h4 className="font-semibold text-gray-800">球体</h4>
                            <p className="text-sm text-gray-600">体積 = 4/3πr³</p>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-8 text-center">
                            <div className="w-24 h-24 mx-auto bg-red-300 rounded-full shadow-inner relative">
                                <div className="absolute top-2 left-2 w-8 h-8 bg-red-100 rounded-full opacity-60"></div>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <button className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200">
                                <RotateCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Cylinder */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="text-center mb-4">
                            <h4 className="font-semibold text-gray-800">円柱</h4>
                            <p className="text-sm text-gray-600">体積 = πr²h</p>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-8 text-center">
                            <div className="w-20 h-24 mx-auto bg-green-300 rounded-lg shadow-lg relative">
                                <div className="absolute -top-1 left-0 w-20 h-4 bg-green-400 rounded-full"></div>
                                <div className="absolute -bottom-1 left-0 w-20 h-4 bg-green-500 rounded-full"></div>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <button className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200">
                                <RotateCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'animation') {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center justify-center">
                        <Activity className="mr-2 text-green-500" />
                        アニメーション解説
                    </h3>
                    <p className="text-gray-600 mt-2">数学的概念を動きで理解しましょう</p>
                </div>

                {/* Animation Examples */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sin Wave Animation */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-800">正弦波の動き</h4>
                            <button
                                onClick={toggleAnimation}
                                className={`p-2 rounded ${
                                    isAnimating ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                }`}
                            >
                                {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-4 h-48 relative overflow-hidden">
                            <canvas
                                width={300}
                                height={150}
                                className="w-full h-full"
                                ref={canvasRef}
                            />
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                            sin(x) の波形が時間とともに変化する様子を観察できます
                        </div>
                    </div>

                    {/* Circle Area Growth */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-800">円の面積変化</h4>
                            <button className="p-2 bg-blue-100 text-blue-700 rounded">
                                <Zap className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-4 h-48 flex items-center justify-center">
                            <div 
                                className={`bg-blue-400 rounded-full transition-all duration-1000 ${
                                    isAnimating ? 'w-32 h-32' : 'w-8 h-8'
                                }`}
                                style={{
                                    transform: isAnimating ? 'scale(1)' : 'scale(0.25)'
                                }}
                            />
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                            半径が変化するにつれて面積がどう変わるかを視覚化
                        </div>
                    </div>
                </div>

                {/* Animation Controls */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h4 className="font-semibold text-gray-800 mb-4">アニメーション設定</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">速度</label>
                            <input
                                type="range"
                                min={0.1}
                                max={3}
                                step={0.1}
                                defaultValue={1}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">振幅</label>
                            <input
                                type="range"
                                min={0.5}
                                max={2}
                                step={0.1}
                                value={parameters.amplitude}
                                onChange={(e) => setParameters(prev => ({ ...prev, amplitude: parseFloat(e.target.value) }))}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">周波数</label>
                            <input
                                type="range"
                                min={0.5}
                                max={2}
                                step={0.1}
                                value={parameters.frequency}
                                onChange={(e) => setParameters(prev => ({ ...prev, frequency: parseFloat(e.target.value) }))}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default MathVisualizer;