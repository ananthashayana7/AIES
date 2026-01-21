// Zustand Store - Ephemeral in-memory state management
// No persistence - data cleared on session end (refresh)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DesignIntent, exampleDesignIntent } from '../lib/schemas/designIntent';
import { GeneratedVariant, generateVariants } from '../lib/variants/variantGenerator';

interface AppState {
    // Design Intent (user input)
    designIntent: DesignIntent | null;

    // Generated variants
    variants: GeneratedVariant[];
    selectedVariantId: string | null;

    // UI state
    isProcessing: boolean;
    showJsonEditor: boolean;
    activePanel: 'specs' | 'analysis' | 'procedures' | 'export';

    // Review state
    reviewDecisions: Record<string, { decision: 'accepted' | 'rejected', timestamp: number }>;

    // Actions
    setDesignIntent: (intent: DesignIntent) => void;
    loadExample: () => void;
    generateVariantsFromIntent: () => void;
    selectVariant: (id: string) => void;
    setActivePanel: (panel: 'specs' | 'analysis' | 'procedures' | 'export') => void;
    toggleJsonEditor: () => void;
    reviewSuggestion: (id: string, decision: 'accepted' | 'rejected') => void;
    reset: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Initial state
            designIntent: null,
            variants: [],
            selectedVariantId: null,
            isProcessing: false,
            showJsonEditor: false,
            activePanel: 'specs',
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
                        activePanel: 'analysis',
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
                    activePanel: 'specs',
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

// Selector helpers
export const useSelectedVariant = () => {
    return useAppStore((state) =>
        state.variants.find((v) => v.id === state.selectedVariantId)
    );
};

export const useDesignIntent = () => {
    return useAppStore((state) => state.designIntent);
};

export const useVariants = () => {
    return useAppStore((state) => state.variants);
};
