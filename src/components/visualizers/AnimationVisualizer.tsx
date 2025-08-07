import React, { useState, useRef, useEffect } from 'react';
import { Activity, Play, Pause, RotateCw, Settings } from 'lucide-react';

interface AnimationConfig {
    type: 'sine-wave' | 'circle-growth' | 'pendulum' | 'spiral';
    speed: number;
    amplitude: number;
    frequency: number;
}

const AnimationVisualizer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationTime, setAnimationTime] = useState(0);
    const [selectedAnimation, setSelectedAnimation] = useState<string>('sine-wave');

    const [animationConfig, setAnimationConfig] = useState<AnimationConfig>({
        type: 'sine-wave',
        speed: 1,
        amplitude: 50,
        frequency: 1
    });


    const animations = [
        { id: 'sine-wave', name: '正弦波の動き', description: 'sin(x) の波形が時間とともに変化する様子' },
        { id: 'circle-growth', name: '円の面積変化', description: '半径が変化するにつれて面積がどう変わるか' },
        { id: 'pendulum', name: '振り子の運動', description: '単振り子の周期運動を可視化' },
        { id: 'spiral', name: 'らせんの成長', description: 'アルキメデスのらせんの成長過程' }
    ];

    useEffect(() => {
        if (isAnimating) {
            const animate = () => {
                setAnimationTime(prev => prev + (animationConfig.speed * 0.05));
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
    }, [isAnimating, animationConfig.speed]);

    useEffect(() => {
        drawAnimation();
    }, [animationTime, selectedAnimation, animationConfig]);

    const drawAnimation = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        switch (selectedAnimation) {
            case 'sine-wave':
                drawSineWave(ctx, width, height, centerX, centerY);
                break;
            case 'circle-growth':
                drawCircleGrowth(ctx, centerX, centerY);
                break;
            case 'pendulum':
                drawPendulum(ctx, centerX, centerY);
                break;
            case 'spiral':
                drawSpiral(ctx, centerX, centerY);
                break;
        }
    };

    const drawSineWave = (ctx: CanvasRenderingContext2D, width: number, height: number, centerX: number, centerY: number) => {
        // Draw axes
        ctx.strokeStyle = '#D1D5DB';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, height);
        ctx.stroke();

        // Draw sine wave
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 3;
        ctx.beginPath();

        let isFirst = true;
        for (let x = 0; x < width; x += 2) {
            const normalizedX = (x - centerX) / 50;
            const y = centerY - animationConfig.amplitude * Math.sin(
                animationConfig.frequency * normalizedX + animationTime
            );

            if (isFirst) {
                ctx.moveTo(x, y);
                isFirst = false;
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Draw moving point
        const pointX = centerX + (animationTime * 20) % (width / 2);
        const pointY = centerY - animationConfig.amplitude * Math.sin(
            animationConfig.frequency * ((pointX - centerX) / 50) + animationTime
        );

        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(pointX, pointY, 6, 0, 2 * Math.PI);
        ctx.fill();
    };

    const drawCircleGrowth = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
        const baseRadius = 20;
        const maxRadius = 80;
        const growthFactor = Math.sin(animationTime * 0.5) * 0.5 + 0.5;
        const currentRadius = baseRadius + (maxRadius - baseRadius) * growthFactor;

        // Draw circle
        ctx.fillStyle = '#3B82F6';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw radius line
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + currentRadius, centerY);
        ctx.stroke();

        // Draw center point
        ctx.fillStyle = '#1F2937';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
        ctx.fill();

        // Display measurements
        ctx.fillStyle = '#1F2937';
        ctx.font = '14px Arial';
        ctx.fillText(`半径: ${currentRadius.toFixed(1)}`, centerX + 10, centerY - 90);
        ctx.fillText(`面積: ${(Math.PI * currentRadius * currentRadius).toFixed(1)}`, centerX + 10, centerY - 70);
    };

    const drawPendulum = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
        const pendulumLength = 120;
        const maxAngle = Math.PI / 4; // 45 degrees
        const angle = maxAngle * Math.sin(animationTime);
        
        const bobX = centerX + pendulumLength * Math.sin(angle);
        const bobY = centerY + pendulumLength * Math.cos(angle);

        // Draw pivot point
        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
        ctx.fill();

        // Draw string
        ctx.strokeStyle = '#6B7280';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(bobX, bobY);
        ctx.stroke();

        // Draw bob
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(bobX, bobY, 12, 0, 2 * Math.PI);
        ctx.fill();

        // Draw arc to show motion path
        ctx.strokeStyle = '#D1D5DB';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pendulumLength, Math.PI/2 - maxAngle, Math.PI/2 + maxAngle);
        ctx.stroke();

        // Draw angle indicator
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, Math.PI/2, Math.PI/2 + angle);
        ctx.stroke();
    };

    const drawSpiral = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
        ctx.strokeStyle = '#8B5CF6';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const maxRadius = Math.min(centerX, centerY) - 20;
        const revolutions = animationTime * 0.1;

        let isFirst = true;
        for (let t = 0; t < revolutions * 2 * Math.PI; t += 0.1) {
            const radius = (t / (2 * Math.PI)) * (maxRadius / 3);
            const x = centerX + radius * Math.cos(t);
            const y = centerY + radius * Math.sin(t);

            if (isFirst) {
                ctx.moveTo(x, y);
                isFirst = false;
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Draw current point
        if (revolutions > 0) {
            const t = revolutions * 2 * Math.PI;
            const radius = (t / (2 * Math.PI)) * (maxRadius / 3);
            const x = centerX + radius * Math.cos(t);
            const y = centerY + radius * Math.sin(t);

            ctx.fillStyle = '#EF4444';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    };

    const toggleAnimation = () => {
        setIsAnimating(!isAnimating);
    };

    const resetAnimation = () => {
        setAnimationTime(0);
        setIsAnimating(false);
    };

    const changeAnimation = (animationType: string) => {
        setSelectedAnimation(animationType);
        setAnimationTime(0);
        setAnimationConfig(prev => ({ ...prev, type: animationType as AnimationConfig['type'] }));
    };

    const selectedAnimationData = animations.find(anim => anim.id === selectedAnimation);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 flex items-center justify-center">
                    <Activity className="mr-2 text-green-500" />
                    アニメーション解説
                </h3>
                <p className="text-gray-600 mt-2">数学的概念を動きで理解しましょう</p>
            </div>

            {/* Animation Selector */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
                {animations.map(anim => (
                    <button
                        key={anim.id}
                        onClick={() => changeAnimation(anim.id)}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            selectedAnimation === anim.id
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'
                        }`}
                    >
                        {anim.name}
                    </button>
                ))}
            </div>

            {/* Main Animation Display */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Canvas Area */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-800">
                                {selectedAnimationData?.name || 'アニメーション'}
                            </h4>
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
                                    onClick={resetAnimation}
                                    className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                    <RotateCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 overflow-hidden">
                            <canvas
                                ref={canvasRef}
                                width={400}
                                height={300}
                                className="w-full h-full border rounded"
                            />
                        </div>

                        <div className="mt-4 text-sm text-gray-600">
                            {selectedAnimationData?.description}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                    {/* Animation Controls */}
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <Settings className="w-4 h-4 mr-2" />
                            アニメーション設定
                        </h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">速度</label>
                                <input
                                    type="range"
                                    min={0.1}
                                    max={3}
                                    step={0.1}
                                    value={animationConfig.speed}
                                    onChange={(e) => setAnimationConfig(prev => ({ 
                                        ...prev, 
                                        speed: parseFloat(e.target.value) 
                                    }))}
                                    className="w-full"
                                />
                                <div className="text-xs text-gray-500 text-center">{animationConfig.speed.toFixed(1)}x</div>
                            </div>

                            {(selectedAnimation === 'sine-wave' || selectedAnimation === 'circle-growth') && (
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">振幅</label>
                                    <input
                                        type="range"
                                        min={10}
                                        max={100}
                                        step={5}
                                        value={animationConfig.amplitude}
                                        onChange={(e) => setAnimationConfig(prev => ({ 
                                            ...prev, 
                                            amplitude: parseInt(e.target.value) 
                                        }))}
                                        className="w-full"
                                    />
                                    <div className="text-xs text-gray-500 text-center">{animationConfig.amplitude}</div>
                                </div>
                            )}

                            {selectedAnimation === 'sine-wave' && (
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">周波数</label>
                                    <input
                                        type="range"
                                        min={0.5}
                                        max={3}
                                        step={0.1}
                                        value={animationConfig.frequency}
                                        onChange={(e) => setAnimationConfig(prev => ({ 
                                            ...prev, 
                                            frequency: parseFloat(e.target.value) 
                                        }))}
                                        className="w-full"
                                    />
                                    <div className="text-xs text-gray-500 text-center">{animationConfig.frequency.toFixed(1)}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Animation Info */}
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">数学的概念</h4>
                        <div className="text-sm text-blue-700 space-y-2">
                            {selectedAnimation === 'sine-wave' && (
                                <>
                                    <div>• 正弦関数: y = A sin(ωt + φ)</div>
                                    <div>• 周期運動の基本形</div>
                                    <div>• 波の性質：振幅、周波数、位相</div>
                                </>
                            )}
                            {selectedAnimation === 'circle-growth' && (
                                <>
                                    <div>• 円の面積: S = πr²</div>
                                    <div>• 半径と面積の関係</div>
                                    <div>• 2次関数的な変化</div>
                                </>
                            )}
                            {selectedAnimation === 'pendulum' && (
                                <>
                                    <div>• 単振り子の運動</div>
                                    <div>• 周期: T = 2π√(L/g)</div>
                                    <div>• 調和振動</div>
                                </>
                            )}
                            {selectedAnimation === 'spiral' && (
                                <>
                                    <div>• アルキメデスのらせん</div>
                                    <div>• r = aθ (極座標)</div>
                                    <div>• 一定の割合で成長</div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Learning Tips */}
                    <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                        <h4 className="font-semibold text-yellow-800 mb-2">💡 学習のコツ</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• アニメーションを一時停止して詳細を観察</li>
                            <li>• パラメータを変更して変化を確認</li>
                            <li>• 数式と動きの関係を意識する</li>
                            <li>• 実世界での応用例を考える</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimationVisualizer;