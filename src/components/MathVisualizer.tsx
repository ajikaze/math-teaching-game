import React from 'react';
import { VisualizationType } from '../types/MathTypes';
import FunctionGraphVisualizer from './visualizers/FunctionGraphVisualizer';
import ThreeDObjectVisualizer from './visualizers/3DObjectVisualizer';
import AnimationVisualizer from './visualizers/AnimationVisualizer';

interface MathVisualizerProps {
    type: VisualizationType;
}

const MathVisualizer: React.FC<MathVisualizerProps> = ({ type }) => {

    if (type === 'function') {
        return <FunctionGraphVisualizer />;
    }

    if (type === '3d') {
        return <ThreeDObjectVisualizer />;
    }

    if (type === 'animation') {
        return <AnimationVisualizer />;
    }

    return null;
};

export default MathVisualizer;