import React from 'react';
import { Square, Calculator, Ruler } from 'lucide-react';
import { VisualProblem } from '../../types/MathTypes';

interface ProblemSelectorProps {
    problems: VisualProblem[];
    selectedProblem: VisualProblem | null;
    onProblemSelect: (problem: VisualProblem) => void;
}

const ProblemSelector: React.FC<ProblemSelectorProps> = ({
    problems,
    selectedProblem,
    onProblemSelect
}) => {
    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'geometry':
                return <Square className="w-5 h-5 text-blue-500 mr-2" />;
            case 'algebra':
                return <Calculator className="w-5 h-5 text-green-500 mr-2" />;
            case 'functions':
                return <Ruler className="w-5 h-5 text-purple-500 mr-2" />;
            default:
                return <Square className="w-5 h-5 text-gray-500 mr-2" />;
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {problems.map(problem => (
                <button
                    key={problem.id}
                    onClick={() => onProblemSelect(problem)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedProblem?.id === problem.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                >
                    <div className="flex items-center mb-2">
                        {getCategoryIcon(problem.category)}
                        <span className="font-semibold">{problem.title}</span>
                    </div>
                    <p className="text-sm text-gray-600">{problem.description}</p>
                </button>
            ))}
        </div>
    );
};

export default ProblemSelector;