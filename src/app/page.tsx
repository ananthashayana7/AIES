"use client";

import { useState } from "react";
import SpecInputForm from "@/components/SpecInputForm";
import Visualizer from "@/components/Visualizer";
import InstructionViewer from "@/components/InstructionViewer";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ imageUrl: string | null; instructions: string[] }>({
    imageUrl: null,
    instructions: [],
  });

  const handleGenerate = async (spec: string) => {
    setLoading(true);
    setData({ imageUrl: null, instructions: [] }); // Reset

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec }),
      });
      const result = await response.json();
      setData({
        imageUrl: result.imageUrl,
        instructions: result.instructions,
      });
    } catch (error) {
      console.error("Failed to generate:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-blue-500/30">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      <main className="relativez-10 container mx-auto px-4 py-8 max-w-7xl h-screen flex flex-col">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              AI Design Assistant
            </h1>
          </div>
          <div className="text-sm text-zinc-500">v1.0.0 (Prototype)</div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          {/* Left Panel: Input */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <SpecInputForm onSubmit={handleGenerate} isLoading={loading} />

            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 flex-1 hidden lg:block">
              <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Tips</h3>
              <ul className="text-sm text-zinc-500 space-y-2 list-disc list-inside">
                <li>Be specific about dimensions and materials.</li>
                <li>Mention the intended environment (underwater, space, etc.).</li>
                <li>Specify any constraints (weight, cost, manufacturing method).</li>
              </ul>
            </div>
          </div>

          {/* Right Panel: Output */}
          <div className="lg:col-span-8 grid grid-rows-2 gap-6 h-full">
            <Visualizer imageUrl={data.imageUrl} isLoading={loading} />
            <InstructionViewer instructions={data.instructions} isLoading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
}
