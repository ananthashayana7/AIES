'use client';

// Variant Selector v0.9 (SRS F5)
// Selection between discrete guidance plans.

import { useAppStore } from '@/store/appStore';

export default function VariantSelector() {
  const { variants, selectedVariantId, selectVariant } = useAppStore();

  if (variants.length === 0) return null;

  return (
    <div className="variant-selector">
      <div className="header-strip">
        <h3>GUIDANCE PLANS</h3>
        <span className="count">{variants.length} GENERATED</span>
      </div>

      <div className="card-row">
        {variants.map((v) => (
          <button
            key={v.id}
            className={`plan-card ${selectedVariantId === v.id ? 'active' : ''}`}
            onClick={() => selectVariant(v.id)}
          >
            <div className="card-top">
              <span className="plan-type">{v.variantType.toUpperCase()}</span>
              <span className="risk">{v.insights.riskLevel === 'low' ? '✓' : '!'}</span>
            </div>

            <div className="metrics">
              <div className="m-item">
                <span className="m-label">MASS</span>
                <span className="m-val">{v.massG.toFixed(0)}g</span>
              </div>
              <div className="m-item">
                <span className="m-label">COST</span>
                <span className="m-val">{v.costScore}/10</span>
              </div>
            </div>

            <div className="card-footer">
              PARAM: {Object.keys(v.parameters).length}
            </div>
          </button>
        ))}
      </div>

      <style jsx>{`
        .variant-selector {
          padding: 12px 16px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .header-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        h3 { font-size: 10px; color: #444; margin: 0; letter-spacing: 1px; }
        .count { font-size: 9px; color: #222; }

        .card-row {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 4px;
        }

        .plan-card {
          flex: 0 0 160px;
          background: #000;
          border: 1px solid #1a1a1a;
          padding: 12px;
          text-align: left;
          cursor: pointer;
        }

        .plan-card:hover { border-color: #333; }
        .plan-card.active { border-color: #fff; background: #080808; }

        .card-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .plan-type { font-size: 10px; font-weight: 800; color: #fff; }
        .risk { font-size: 10px; color: #444; }

        .metrics {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
        }

        .m-item {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
        }

        .m-label { color: #666; font-weight: 600; }
        .m-val { color: #fff; font-family: var(--font-mono); }

        .card-footer {
          font-size: 8px;
          color: #222;
          font-family: var(--font-mono);
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
