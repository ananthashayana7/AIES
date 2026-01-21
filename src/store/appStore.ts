'use client';

// Zustand Store v0.9 (SRS compliant)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DesignIntent, exampleDesignIntent } from '../lib/schemas/designIntent';
import { GeneratedVariant, generateVariants } from '../lib/variants/variantGenerator';

import { SimulationResult, runMaterialSimulation } from '../lib/simulation/simulationEngine';
import { AIReasoning, ParameterSuggestion } from '../lib/schemas/aiReasoning';
import { analyzeDesign } from '../lib/ai/aiReasoner';
import { RuleCheckResult, evaluateRules } from '../lib/rules/ruleEngine';

interface AppState {
    // SRS F2: Design Intent (Source of Truth)
    designIntent: DesignIntent | null;

    // Generated variations/guidance sets
    variants: GeneratedVariant[];
    selectedVariantId: string | null;

    // Material Simulation Results (Phase 10)
    simulationResults: SimulationResult[];

    // SRS F5: AI Reasoning & Insights
    aiReasoning: AIReasoning | null;

    // SRS F4: Rule Engine Results
    ruleCheckResult: RuleCheckResult | null;

    reviewDecisions: {
        suggestionId: string;
        decision: 'accepted' | 'modified' | 'rejected';
        timestamp: string;
        notes?: string;
    }[];

    // UI state
    isProcessing: boolean;
 feature/ai-design-enhancements-2705611776119386679
    showJsonEditor: boolean;
    // Updated panel names to match main branch
    activePanel: 'intent' | 'insights' | 'guidance' | 'audit' | 'simulation';

    // Review state
    reviewDecisions: Record<string, { decision: 'accepted' | 'rejected', timestamp: number }>;

    activePanel: 'intent' | 'insights' | 'guidance' | 'audit' | 'simulation';
 main

    // Actions
    setDesignIntent: (intent: DesignIntent) => void;
    loadExample: () => void;
    generateGuidance: () => void;
    generateSimulation: () => void;
    generateAIInsights: () => void;
    acceptSuggestion: (id: string) => void;
    rejectSuggestion: (id: string, reason?: string) => void;
    selectVariant: (id: string) => void;
    setActivePanel: (panel: 'intent' | 'insights' | 'guidance' | 'audit' | 'simulation') => void;
feature/ai-design-enhancements-2705611776119386679
    toggleJsonEditor: () => void;
    reviewSuggestion: (id: string, decision: 'accepted' | 'rejected') => void;

 main
    reset: () => void;

    // Audit/Export Trigger
    exportTrigger: 'glb' | 'pdf' | 'json' | null;
    triggerExport: (type: 'glb' | 'pdf' | 'json' | null) => void;
}

 feature/ai-design-enhancements-2705611776119386679
export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Initial state

export const useAppStore = create<AppState>((set, get) => ({
    designIntent: null,
    variants: [],
    selectedVariantId: null,
    simulationResults: [],
    aiReasoning: null,
    ruleCheckResult: null,
    reviewDecisions: [],
    isProcessing: false,
    activePanel: 'intent',

    setDesignIntent: (intent) => {
        set({ designIntent: intent, variants: [], selectedVariantId: null, simulationResults: [], aiReasoning: null, ruleCheckResult: null });
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
                activePanel: 'guidance', // Show steps by default
            });
            // Also trigger simulation if materials exist
            get().generateSimulation();
            get().generateAIInsights(); // Trigger AI insights after guidance and simulation
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

        // AI Reasoning (only if no critical rule blockers)
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
            reviewDecisions: [...state.reviewDecisions, decision]
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
            reviewDecisions: [...state.reviewDecisions, decision]
        }));
    },

    selectVariant: (id) => {
        set({ selectedVariantId: id });
    },

    setActivePanel: (panel) => {
        set({ activePanel: panel });
    },

    reset: () => {
        set({
main
            designIntent: null,
            variants: [],
            selectedVariantId: null,
            simulationResults: [],
            aiReasoning: null,
            ruleCheckResult: null,
            reviewDecisions: [],
            isProcessing: false,
feature/ai-design-enhancements-2705611776119386679
            showJsonEditor: false,
            activePanel: 'intent', // Was 'specs'
            reviewDecisions: {},

            // Actions
            setDesignIntent: (intent) => {
                set({ designIntent: intent, variants: [], selectedVariantId: null, reviewDecisions: {} });
            },

            loadExample: () => {
                set({
                    designIntent: exampleDesignIntent,
                    variants: [],
                    selectedVariantId: null,
                    reviewDecisions: {},
                });
            },

            generateVariantsFromIntent: () => {
                const { designIntent } = get();
                if (!designIntent) return;

                set({ isProcessing: true });

                // Simulate processing time for UX
                setTimeout(() => {
                    const variants = generateVariants(designIntent);
                    set({
                        variants,
                        selectedVariantId: variants[0]?.id || null,
                        isProcessing: false,
                        activePanel: 'insights', // Was 'analysis'
                    });
                }, 500);
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

            reviewSuggestion: (id, decision) => {
                set((state) => ({
                    reviewDecisions: {
                        ...state.reviewDecisions,
                        [id]: { decision, timestamp: Date.now() },
                    },
                }));
            },

            reset: () => {
                set({
                    designIntent: null,
                    variants: [],
                    selectedVariantId: null,
                    isProcessing: false,
                    showJsonEditor: false,
                    activePanel: 'intent', // Was 'specs'
                    reviewDecisions: {},
                });
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

            activePanel: 'intent',
            exportTrigger: null,
        });
    },

    exportTrigger: null,
    triggerExport: (type) => set({ exportTrigger: type }),
}));
main

// Selectors
export const useSelectedVariant = () => {
    return useAppStore((state) =>
        state.variants.find((v) => v.id === state.selectedVariantId)
    );
};
