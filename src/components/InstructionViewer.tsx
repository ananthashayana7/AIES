"use client";

interface InstructionViewerProps {
    instructions: string[];
    isLoading: boolean;
}

export default function InstructionViewer({ instructions, isLoading }: InstructionViewerProps) {
    return (
        <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 backdrop-blur-md flex flex-col h-full">
            <h2 className="text-xl font-semibold text-white mb-4">Design Instructions</h2>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                        <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
                        <div className="h-4 bg-zinc-800 rounded w-5/6"></div>
                    </div>
                ) : instructions.length > 0 ? (
                    <ul className="space-y-4">
                        {instructions.map((step, index) => (
                            <li key={index} className="flex gap-4 p-4 rounded-lg bg-black/20 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-500/10 text-blue-400 font-mono text-sm border border-blue-500/20">
                                    {index + 1}
                                </span>
                                <p className="text-zinc-300 leading-relaxed text-sm pt-1">{step}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-sm italic">
                        Waiting for generation...
                    </div>
                )}
            </div>
        </div>
    );
}
