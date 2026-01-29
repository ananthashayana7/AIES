'use client';

// Zustand Store v0.9 (SRS compliant)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DesignIntent, exampleDesignIntent } from '../lib/schemas/designIntent';
import { GeneratedVariant, generateVariants } from '../lib/variants/variantGenerator';

import { SimulationResult, runMaterialSimulation } from '../lib/simulation/simulationEngine';
import { EngineeringSolver, SolverResult } from '../lib/ai/solver';
import { AIReasoning } from '../lib/schemas/aiReasoning';
import { analyzeDesign } from '../lib/ai/aiReasoner';
import { RuleCheckResult, evaluateRules } from '../lib/rules/ruleEngine';

interface AppState {
    // SRS F2: Design Intent (Source of Truth)
    designIntent: DesignIntent | null;

    // Layer 5: Solver Result
    solverResult: SolverResult | null;

    // Generated variations/guidance sets
    variants: GeneratedVariant[];
    selectedVariantId: string | null;

    // Material Simulation Results (Phase 10)
    simulationResults: SimulationResult[];

    // SRS F5: AI Reasoning & Insights
    aiReasoning: AIReasoning | null;

    // SRS F4: Rule Engine Results
    ruleCheckResult: RuleCheckResult | null;

    reviewDecisions: Record<string, {
        suggestionId: string;
        decision: 'accepted' | 'modified' | 'rejected';
        timestamp: string;
        notes?: string;
    }>;

    // UI state
    isProcessing: boolean;
    showJsonEditor: boolean;
    activePanel: 'intent' | 'insights' | 'guidance' | 'audit' | 'simulation';

    // Actions
    setDesignIntent: (intent: DesignIntent) => void;
    runAgentSolver: () => void;
    loadExample: () => void;
    generateGuidance: () => void;
    generateSimulation: () => void;
    generateAIInsights: () => void;
    acceptSuggestion: (id: string) => void;
    rejectSuggestion: (id: string, reason?: string) => void;
    reviewSuggestion: (id: string, decision: 'accepted' | 'rejected') => void;
    selectVariant: (id: string) => void;
    setActivePanel: (panel: 'intent' | 'insights' | 'guidance' | 'audit' | 'simulation') => void;
    toggleJsonEditor: () => void;
    reset: () => void;

    // Audit/Export Trigger
    exportTrigger: 'glb' | 'pdf' | 'json' | null;
    triggerExport: (type: 'glb' | 'pdf' | 'json' | null) => void;

    // Phase 6: Design History & Context
    designHistory: DesignIntent[];
    undoDesign: () => void;
    redoDesign: () => void;
    pushToHistory: (intent: DesignIntent) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Initial state
            designIntent: null,
            solverResult: null,
            variants: [],
            selectedVariantId: null,
            simulationResults: [],
            aiReasoning: null,
            ruleCheckResult: null,
            reviewDecisions: {},
            isProcessing: false,
            showJsonEditor: false,
            activePanel: 'intent',
            exportTrigger: null,

            setDesignIntent: (intent) => {
                set({
                    designIntent: intent,
                    solverResult: null,
                    variants: [],
                    selectedVariantId: null,
                    simulationResults: [],
                    aiReasoning: null,
                    ruleCheckResult: null
                });
                // Trigger Solver if context suggests
                if (intent.parameters.context?.load && intent.parameters.primitive_type === 'bolt') {
                    get().runAgentSolver();
                }
            },

            runAgentSolver: () => {
                const { designIntent } = get();
                if (!designIntent) return;

                const load = designIntent.parameters.context?.load;
                const type = designIntent.parameters.primitive_type;
                const mat = designIntent.materials[0] || 'Steel S235';

                if (load && type === 'bolt') {
                    const result = EngineeringSolver.solveComponent('bolt', load, mat);

                    if (result.recommendedSpec !== 'None') {
                        // Apply the recommendation
                        const newIntent = { ...designIntent };
                        newIntent.parameters.thread = result.recommendedSpec;
                        // Clear manual dims to let generator use standard
                        // But we might want to keep length

                        set({
                            designIntent: newIntent,
                            solverResult: result,
                            activePanel: 'insights' // Switch to show reasoning
                        });
                    } else {
                        set({ solverResult: result });
                    }
                }
            },

            loadExample: () => {
                set({
                    designIntent: exampleDesignIntent,
                    variants: [],
                    selectedVariantId: null,
                    simulationResults: [],
                    aiReasoning: null,
                    ruleCheckResult: null
                });
            },

            generateGuidance: () => {
                const { designIntent } = get();
                if (!designIntent) return;

                set({ isProcessing: true });

                // Simulate SRS NFR performance targets (≤ 5s)
                setTimeout(() => {
                    const variants = generateVariants(designIntent);
                    set({
                        variants,
                        selectedVariantId: variants[0]?.id || null,
                        isProcessing: false,
                        activePanel: 'guidance',
                    });
                    // Also trigger simulation if materials exist
                    get().generateSimulation();
                    get().generateAIInsights();
                }, 1200);
            },

            generateSimulation: () => {
                const { designIntent } = get();
                if (!designIntent) return;

                const results = runMaterialSimulation(designIntent.parameters, designIntent.materials);
                set({ simulationResults: results });
            },

            generateAIInsights: () => {
                const { designIntent, simulationResults, variants } = get();
                if (!designIntent || simulationResults.length === 0) return;

                const currentParams = variants[0]?.parameters || designIntent.parameters;

                // SRS: Rules-First Architecture - Run Rule Engine BEFORE AI
                const ruleResult = evaluateRules(designIntent, currentParams, ['cnc', 'material']);
                set({ ruleCheckResult: ruleResult });

                // AI Reasoning
                const reasoning = analyzeDesign(designIntent, currentParams, simulationResults);
                set({ aiReasoning: reasoning, activePanel: 'insights' });
            },

            acceptSuggestion: (id) => {
                const { aiReasoning, designIntent } = get();
                if (!aiReasoning || !designIntent) return;

                const suggestion = aiReasoning.suggestions.find(s => s.id === id);
                if (!suggestion) return;

                // Apply suggestion to design intent
                const newParams = { ...designIntent.parameters };
                newParams[suggestion.parameterKey] = suggestion.suggestedValue;

                const newIntent = { ...designIntent, parameters: newParams };

                // Log decision
                const decision = {
                    suggestionId: id,
                    decision: 'accepted' as const,
                    timestamp: new Date().toISOString(),
                    notes: `Applied ${suggestion.parameterKey}: ${suggestion.currentValue} → ${suggestion.suggestedValue}`
                };

                set(state => ({
                    designIntent: newIntent,
                    reviewDecisions: { ...state.reviewDecisions, [id]: decision }
                }));

                // Regenerate guidance with new parameters
                get().generateGuidance();
            },

            rejectSuggestion: (id, reason) => {
                const decision = {
                    suggestionId: id,
                    decision: 'rejected' as const,
                    timestamp: new Date().toISOString(),
                    notes: reason
                };

                set(state => ({
                    reviewDecisions: { ...state.reviewDecisions, [id]: decision }
                }));
            },

            reviewSuggestion: (id, decision) => {
                if (decision === 'accepted') {
                    get().acceptSuggestion(id);
                } else {
                    get().rejectSuggestion(id, 'User rejected via review');
                }
            },

            selectVariant: (id) => {
                set({ selectedVariantId: id });
            },

            setActivePanel: (panel) => {
                set({ activePanel: panel });
            },

            toggleJsonEditor: () => {
                set((state) => ({ showJsonEditor: !state.showJsonEditor }));
            },

            reset: () => {
                set({
                    designIntent: null,
                    solverResult: null,
                    variants: [],
                    selectedVariantId: null,
                    simulationResults: [],
                    aiReasoning: null,
                    ruleCheckResult: null,
                    reviewDecisions: {},
                    isProcessing: false,
                    showJsonEditor: false,
                    activePanel: 'intent',
                    exportTrigger: null,
                });
            },

            triggerExport: (type) => set({ exportTrigger: type }),

            // Phase 6: Design History
            designHistory: [],

            pushToHistory: (intent) => {
                set(state => ({
                    designHistory: [...state.designHistory.slice(-19), intent] // Keep last 20
                }));
            },

            undoDesign: () => {
                const { designHistory } = get();
                if (designHistory.length === 0) return;

                const previous = designHistory[designHistory.length - 1];
                set(state => ({
                    designIntent: previous,
                    designHistory: state.designHistory.slice(0, -1)
                }));
                get().generateGuidance();
            },

            redoDesign: () => {
                // Simple implementation - would need a separate redo stack for full support
                console.log('[AppStore] Redo not fully implemented yet');
            },
        }),
        {
            name: 'cadence-storage',
            partialize: (state) => ({
                designIntent: state.designIntent,
                variants: state.variants,
                reviewDecisions: state.reviewDecisions,
            }),
        }
    )
);

// Selectors
export const useSelectedVariant = () => {
    return useAppStore((state) =>
        state.variants.find((v) => v.id === state.selectedVariantId)
    );
};

export const useDesignIntent = () => useAppStore((state) => state.designIntent);
