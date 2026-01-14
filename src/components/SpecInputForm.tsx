"use client";

import { useState } from "react";

interface SpecInputFormProps {
    onSubmit: (spec: string) => void;
    isLoading: boolean;
}

export default function SpecInputForm({ onSubmit, isLoading }: SpecInputFormProps) {
    const [spec, setSpec] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (spec.trim()) {
            onSubmit(spec);
        }
    };

    return (
        <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 backdrop-blur-md">
            <h2 className="text-xl font-semibold text-white mb-4">Design Specification</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="spec" className="text-sm text-zinc-400">
                        Describe what you want to design
                    </label>
                    <textarea
                        id="spec"
                        rows={6}
                        className="w-full bg-black/40 border border-zinc-700 rounded-lg p-4 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all placeholder:text-zinc-600"
                        placeholder="E.g., A lightweight drone frame optimized for speed, made of carbon fiber..."
                        value={spec}
                        onChange={(e) => setSpec(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !spec.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                        </>
                    ) : (
                        "Generate Design"
                    )}
                </button>
            </form>
        </div>
    );
}
