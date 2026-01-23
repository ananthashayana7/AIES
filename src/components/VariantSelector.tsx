'use client';

// Variant Selector v1.0 (Phase 7: Generative Variants)
// Displays 5 intelligent design alternatives with comparison metrics

import { useAppStore } from '@/store/appStore';

export default function VariantSelector() {
  const { variants, selectedVariantId, selectVariant } = useAppStore();

  if (variants.length === 0) return null;

  // Color coding for variant types
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'strength': return '#10b981'; // Green
      case 'weight': return '#60a5fa';   // Blue
      case 'cost': return '#f59e0b';     // Amber
      case 'balanced': return '#8b5cf6'; // Purple
      case 'compact': return '#ec4899';  // Pink
      default: return '#888';
    }
  };

  // Get icon for variant type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'strength': return '💪';
      case 'weight': return '🪶';
      case 'cost': return '💰';
      case 'balanced': return '⚖️';
      case 'compact': return '📦';
      default: return '📐';
    }
  };

  return (
    <div className="variant-selector">
      <div className="header-strip">
        <h3>DESIGN VARIANTS</h3>
        <span className="count">{variants.length} ALTERNATIVES</span>
      </div>

      <div className="card-row">
        {variants.map((v) => {
          const color = getTypeColor(v.variantType);
          const icon = getTypeIcon(v.variantType);
          const strengthScore = (v as any).strengthScore || 5;

          return (
            <button
              key={v.id}
              className={`plan-card ${selectedVariantId === v.id ? 'active' : ''}`}
              onClick={() => selectVariant(v.id)}
              style={{ '--accent': color } as any}
            >
              <div className="card-header">
                <span className="type-icon">{icon}</span>
                <span className="plan-type" style={{ color }}>{v.displayName}</span>
              </div>

              <div className="metrics-grid">
                <div className="m-item">
                  <span className="m-label">MASS</span>
                  <span className="m-val">{Math.round(v.massG)}g</span>
                </div>
                <div className="m-item">
                  <span className="m-label">STR</span>
                  <span className="m-val">{strengthScore}/10</span>
                </div>
                <div className="m-item">
                  <span className="m-label">COST</span>
                  <span className="m-val">{v.costScore}/10</span>
                </div>
                <div className="m-item">
                  <span className="m-label">RISK</span>
                  <span className={`m-val risk-${v.insights.riskLevel}`}>
                    {v.insights.riskLevel === 'low' ? '✓' : v.insights.riskLevel === 'high' ? '⚠' : '–'}
                  </span>
                </div>
              </div>

              <div className="card-description">
                {v.description.split('.')[0]}.
              </div>

              <div className="card-footer">
                {v.guidance?.length || 0} STEPS • {Object.keys(v.parameters).length} PARAMS
              </div>
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .variant-selector {
          padding: 12px 16px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .header-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        h3 { font-size: 10px; color: #666; margin: 0; letter-spacing: 1px; }
        .count { font-size: 9px; color: #444; }

        .card-row {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 6px;
          flex: 1;
        }

        .card-row::-webkit-scrollbar {
          height: 4px;
        }
        .card-row::-webkit-scrollbar-track {
          background: #111;
        }
        .card-row::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 2px;
        }

        .plan-card {
          flex: 0 0 180px;
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          padding: 10px 12px;
          text-align: left;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.15s ease;
        }

        .plan-card:hover { 
          border-color: var(--accent, #333); 
          background: #0f0f0f;
        }
        
        .plan-card.active { 
          border-color: var(--accent, #fff); 
          background: #111; 
          box-shadow: 0 0 0 1px var(--accent, #fff) inset;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .type-icon { font-size: 12px; }
        .plan-type { 
          font-size: 9px; 
          font-weight: 800; 
          letter-spacing: 0.5px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 8px;
        }

        .m-item {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
        }

        .m-label { color: #555; font-weight: 600; }
        .m-val { color: #ccc; font-family: var(--font-mono); }
        .m-val.risk-low { color: #10b981; }
        .m-val.risk-medium { color: #f59e0b; }
        .m-val.risk-high { color: #ef4444; }

        .card-description {
          font-size: 9px;
          color: #666;
          line-height: 1.3;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .card-footer {
          font-size: 8px;
          color: #333;
          font-family: var(--font-mono);
          text-transform: uppercase;
          padding-top: 6px;
          border-top: 1px solid #1a1a1a;
        }
      `}</style>
    </div>
  );
}
