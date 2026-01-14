"use client";

import Image from "next/image";

interface VisualizerProps {
    imageUrl: string | null;
    isLoading: boolean;
}

export default function Visualizer({ imageUrl, isLoading }: VisualizerProps) {
    return (
        <div className="w-full h-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 backdrop-blur-md flex flex-col">
            <h2 className="text-xl font-semibold text-white mb-4">Visualization</h2>
            <div className="flex-1 w-full bg-black/40 border border-zinc-700 rounded-lg overflow-hidden relative min-h-[300px] flex items-center justify-center">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-3 animate-pulse">
                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-zinc-500 text-sm">Rendering Concept...</p>
                    </div>
                ) : imageUrl ? (
                    <div className="relative w-full h-full">
                        <Image
                            src={imageUrl}
                            alt="Generated Design"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </div>
                ) : (
                    <div className="text-zinc-600 flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">No visualization generated yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
