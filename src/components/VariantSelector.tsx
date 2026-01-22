'use client';

// Variant Selector - Cards for selecting between generated variants
// Shows key metrics: mass, cost, rigidity

import { motion } from 'framer-motion';
import { useAppStore, useVariants } from '@/store/appStore';

export default function VariantSelector() {
    const variants = useVariants();
    const { selectedVariantId, selectVariant } = useAppStore();

    if (variants.length === 0) return null;

    const variantIcons: Record<string, string> = {
        strength: '💪',
        weight: '🪶',
        cost: '💰',
    };

    const variantColors: Record<string, string> = {
        strength: '#60a5fa',
        weight: '#34d399',
        cost: '#fbbf24',
    };

    return (
        <div className="variant-selector">
            <h3>Generated Variants</h3>
            <div className="variant-cards">
                {variants.map((variant, index) => (
                    <motion.button
                        key={variant.id}
                        className={`variant-card ${selectedVariantId === variant.id ? 'selected' : ''}`}
                        onClick={() => selectVariant(variant.id)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            '--accent-color': variantColors[variant.variantType],
                        } as React.CSSProperties}
                    >
                        <div className="card-header">
                            <span className="icon">{variantIcons[variant.variantType]}</span>
                            <span className="type">{variant.variantType}</span>
                        </div>

                        <div className="card-metrics">
                            <div className="metric">
                                <span className="label">Mass</span>
                                <span className="value">{variant.estimatedMass.toFixed(0)}g</span>
                            </div>
                            <div className="metric">
                                <span className="label">Cost</span>
                                <span className="value">{variant.costHeuristic}/10</span>
                            </div>
                            <div className="metric">
                                <span className="label">Rigidity</span>
                                <span className="value">{variant.rigidityScore}/10</span>
                            </div>
                        </div>

                        <div className="card-params">
                            <span>Wall: {variant.wallThickness}mm</span>
                            <span>R: {variant.filletRadius}mm</span>
                        </div>

                        {!variant.ruleResults.overallPass && (
                            <div className="violation-badge">⚠️ Issues</div>
                        )}
                    </motion.button>
                ))}
            </div>

            <style jsx>{`
        .variant-selector {
          padding: 16px 0;
        }

        .variant-selector h3 {
          font-size: 12px;
          font-weight: 600;
          color: #808080;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }

        .variant-cards {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .variant-card {
          flex: 0 0 auto;
          width: 140px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          position: relative;
        }

        .variant-card:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .variant-card.selected {
          background: rgba(var(--accent-color-rgb, 96, 165, 250), 0.1);
          border-color: var(--accent-color, #60a5fa);
          box-shadow: 0 0 20px rgba(var(--accent-color-rgb, 96, 165, 250), 0.2);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .card-header .icon {
          font-size: 18px;
        }

        .card-header .type {
          font-size: 12px;
          font-weight: 600;
          color: var(--accent-color, #60a5fa);
          text-transform: capitalize;
        }

        .card-metrics {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 10px;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }

        .metric .label {
          color: #606060;
        }

        .metric .value {
          color: #c0c0c0;
          font-weight: 500;
        }

        .card-params {
          display: flex;
          gap: 8px;
          font-size: 10px;
          color: #505050;
        }

        .violation-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          padding: 2px 6px;
          background: rgba(239, 68, 68, 0.2);
          border-radius: 4px;
          font-size: 10px;
          color: #ef4444;
        }
      `}</style>
        </div>
    );
}
