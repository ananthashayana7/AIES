'use client';

// Info Panel v0.9 (SRS Compliant) - Right-side Analysis/Guidance Panel

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useSelectedVariant, useAppStore, useDesignIntent } from '@/store/appStore';
import { generateCADSteps } from '@/lib/guidance/cadGuidanceGenerator';

export default function InfoPanel() {
  const variant = useSelectedVariant();
  const { activePanel, setActivePanel } = useAppStore();

  if (!variant) {
    return (
      <div className="info-panel empty">
        <p>Generate variants to see analysis</p>
        <style jsx>{`
          .info-panel.empty {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #606060;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  const tabs = [
    { id: 'insights', label: '📊 Insights', icon: '📊' },
    { id: 'guidance', label: '📋 Guidance', icon: '📋' },
    { id: 'simulation', label: '🔬 Sim', icon: '🔬' },
    { id: 'audit', label: '💾 Audit', icon: '💾' },
  ] as const;

  return (
    <div className="info-panel">
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activePanel === tab.id ? 'active' : ''}`}
            onClick={() => setActivePanel(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activePanel}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="tab-content"
        >
          {activePanel === 'insights' && <InsightsTab variant={variant} />}
          {activePanel === 'guidance' && <GuidanceTab variant={variant} />}
          {activePanel === 'simulation' && <SimulationTab />}
          {activePanel === 'audit' && <AuditTab variant={variant} />}
        </motion.div>
      </AnimatePresence>

      <style jsx>{`
        .info-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #050505;
          color: #fff;
          font-family: var(--font-sans);
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid #1a1a1a;
          background: #000;
        }

        .tab {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #666;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          letter-spacing: 0.5px;
        }

        .tab.active {
          color: #fff;
          border-bottom-color: #fff;
        }

        .tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
      `}</style>
    </div>
  );
}

// AI Insights Tab - SRS F5 AI Reasoning & Insights
function InsightsTab({ variant }: { variant: ReturnType<typeof useSelectedVariant> }) {
  const aiReasoning = useAppStore(state => state.aiReasoning);
  const ruleCheckResult = useAppStore(state => state.ruleCheckResult);
  const acceptSuggestion = useAppStore(state => state.acceptSuggestion);
  const rejectSuggestion = useAppStore(state => state.rejectSuggestion);
  const { reviewDecisions, reviewSuggestion } = useAppStore();

  if (!variant) return null;

  if (!aiReasoning && !ruleCheckResult) {
    return (
      <div className="empty-state">
        <p>RUN ENGINE TO GENERATE AI INSIGHTS</p>
        <p className="hint">AI will validate constraints, analyze trade-offs, and suggest optimizations</p>
        <style jsx>{`
          .empty-state { text-align: center; padding: 60px 20px; color: #444; }
          .empty-state p { margin: 8px 0; font-size: 11px; }
          .empty-state .hint { font-size: 9px; color: #222; }
        `}</style>
      </div>
    );
  }

  const { constraintViolations, suggestions, tradeoffs } = aiReasoning || { constraintViolations: [], suggestions: [], tradeoffs: { scenarios: [] } };
  const ruleResults = ruleCheckResult || { violations: [], warnings: [], info: [] };

  // Calculate audit stats
  const decisions = Object.values(reviewDecisions);
  const acceptedCount = decisions.filter(d => d.decision === 'accepted').length;
  const rejectedCount = decisions.filter(d => d.decision === 'rejected').length;

  return (
    <div className="insights-tab">
      {/* SRS F4: Rule Engine Violations (BEFORE AI) */}
      {ruleCheckResult && (ruleCheckResult.violations.length > 0 || ruleCheckResult.warnings.length > 0 || ruleCheckResult.info.length > 0) && (
        <div className="section rule-violations">
          <h3>🔒 RULE ENGINE (DETERMINISTIC CHECKS)</h3>

          {ruleCheckResult.violations.map((v, i) => (
            <div key={i} className="violation blocker">
              <div className="v-header">
                <span className="badge blocker">BLOCKER</span>
                <span className="v-id">{v.ruleId}</span>
              </div>
              <div className="v-body">
                <p className="clause">{v.title}</p>
                <p className="comparison">
                  Actual: <strong>{v.actualValue}</strong> {v.expectedValue && `| Expected: ≥ ${v.expectedValue}`}
                </p>
                <p className="rationale">{v.rationale}</p>
                {v.citation && <p className="citation">Standard: {v.citation}</p>}
              </div>
            </div>
          ))}

          {ruleCheckResult.warnings.map((v, i) => (
            <div key={i} className="violation warn">
              <div className="v-header">
                <span className="badge warn">WARNING</span>
                <span className="v-id">{v.ruleId}</span>
              </div>
              <div className="v-body">
                <p className="clause">{v.title}</p>
                <p className="rationale">{v.rationale}</p>
                {v.citation && <p className="citation">Standard: {v.citation}</p>}
              </div>
            </div>
          ))}

          {ruleCheckResult.info.map((v, i) => (
            <div key={i} className="violation info">
              <div className="v-header">
                <span className="badge info">INFO</span>
                <span className="v-id">{v.ruleId}</span>
              </div>
              <div className="v-body">
                <p className="clause">{v.title}</p>
                <p className="rationale">{v.rationale}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Constraint Violations */}
      {constraintViolations.length > 0 && (
        <div className="section violations">
          <h3>⚠ CONSTRAINT VIOLATIONS</h3>
          {constraintViolations.map((v, i) => (
            <div key={i} className={`violation ${v.severity}`}>
              <div className="v-header">
                <span className={`badge ${v.severity}`}>{v.severity.toUpperCase()}</span>
                <span className="v-id">{v.constraintId}</span>
              </div>
              <div className="v-body">
                <p className="clause">{v.intentClause}</p>
                <p className="comparison">
                  Actual: <strong>{v.actual}</strong> | Expected: <strong>{v.expected}</strong>
                </p>
                {v.suggestion && <p className="suggestion-hint">💡 {v.suggestion}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="section suggestions">
          <h3>✓ AI-SUGGESTED OPTIMIZATIONS</h3>
          {suggestions.map((sug, i) => {
            const status = reviewDecisions[sug.id]?.decision;
            return (
              <div key={sug.id} className={`suggestion-card ${status || ''}`}>
                <div className="sug-header">
                  <span className="sug-number">{i + 1}</span>
                  <span className="sug-param">{sug.parameterKey}</span>
                  <span className="confidence">Confidence: {(sug.confidence * 100).toFixed(0)}%</span>
                </div>

                <div className="sug-change">
                  <span className="old-val">{sug.currentValue}</span>
                  <span className="arrow">→</span>
                  <span className="new-val">{sug.suggestedValue}</span>
                  <span className="delta">({sug.delta})</span>
                </div>

                <div className="sug-impact">
                  <strong>Impact:</strong>
                  {sug.impact.mass_delta_g && <span>Mass: {sug.impact.mass_delta_g > 0 ? '+' : ''}{sug.impact.mass_delta_g.toFixed(1)}g</span>}
                  {sug.impact.stiffness_delta_pct && <span>Stiffness: {sug.impact.stiffness_delta_pct.toFixed(1)}%</span>}
                  {sug.impact.safety_factor_delta && <span>S.F.: {sug.impact.safety_factor_delta > 0 ? '+' : ''}{sug.impact.safety_factor_delta.toFixed(2)}</span>}
                </div>

                <p className="sug-rationale">{sug.rationale}</p>
                <p className="sug-link">Linked to: <code>{sug.linkedIntentClause}</code></p>

                <div className="review-actions">
                  {status ? (
                    <div className={`status-badge ${status}`}>
                      {status === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
                    </div>
                  ) : (
                    <>
                      <button className="accept-btn" onClick={() => acceptSuggestion(sug.id)}>ACCEPT</button>
                      <button className="reject-btn" onClick={() => rejectSuggestion(sug.id, 'User rejected')}>REJECT</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trade-off Analysis */}
      {tradeoffs && tradeoffs.scenarios.length > 0 && (
        <div className="section tradeoffs">
          <h3>📊 TRADE-OFF ANALYSIS</h3>
          <div className="scenario-table">
            <table>
              <thead>
                <tr>
                  <th>SCENARIO</th>
                  <th>MASS</th>
                  <th>STIFF</th>
                  <th>S.F.</th>
                  <th>OPTIMAL</th>
                </tr>
              </thead>
              <tbody>
                {tradeoffs.scenarios.map((sc, i) => (
                  <tr key={i} className={sc.name === tradeoffs.recommendation ? 'recommended' : ''}>
                    <td className="sc-name">{sc.name}</td>
                    <td>{sc.metrics.mass_g.toFixed(0)}g</td>
                    <td>{sc.metrics.stiffness_score.toFixed(0)}</td>
                    <td>{sc.metrics.safety_factor.toFixed(2)}</td>
                    <td>{sc.isParetoOptimal ? '✓' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="recommendation">
            <strong>Recommended:</strong> {tradeoffs.recommendation}
          </p>
        </div>
      )}

      <style jsx>{`
        .insights-tab { display: flex; flex-direction: column; gap: 20px; }
        .section { border: 1px solid #1a1a1a; padding: 16px; background: #000; }
        .section h3 { font-size: 11px; margin: 0 0 12px 0; letter-spacing: 1px; color: #fff; }
        
        /* Violations */
        .violations .violation, .rule-violations .violation { margin-bottom: 12px; border-left: 3px solid #ff5555; padding-left: 12px; }
        .violations .violation.warn, .rule-violations .violation.warn { border-left-color: #ffaa00; }
        .violations .violation.info, .rule-violations .violation.info { border-left-color: #5599ff; }
        .v-header { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
        .badge { font-size: 8px; padding: 2px 6px; font-weight: 800; color: #000; }
        .badge.blocker { background: #ff5555; }
        .badge.warn { background: #ffaa00; }
        .badge.info { background: #5599ff; }
        .v-id { font-size: 9px; color: #888; font-family: var(--font-mono); }
        .v-body { font-size: 10px; }
        .clause { color: #ccc; margin: 4px 0; }
        .comparison { color: #888; margin: 4px 0; }
        .comparison strong { color: #fff; }
        .rationale { color: #999; margin: 4px 0; font-size: 9px; line-height: 1.4; }
        .citation { color: #666; margin: 4px 0; font-size: 8px; font-style: italic; }
        .suggestion-hint { color: #ffaa00; margin: 4px 0; }
        
        /* Suggestions */
        .suggestions .suggestion-card { background: #050505; border: 1px solid #222; padding: 12px; margin-bottom: 12px; }
        .suggestions .suggestion-card.accepted { border-color: #10b981; background: rgba(16, 185, 129, 0.05); }
        .suggestions .suggestion-card.rejected { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); opacity: 0.7; }
        
        .sug-header { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
        .sug-number { background: #fff; color: #000; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; }
        .sug-param { font-size: 10px; font-weight: 800; color: #fff; font-family: var(--font-mono); }
        .confidence { margin-left: auto; font-size: 9px; color: #888; }
        .sug-change { display: flex; gap: 8px; align-items: center; margin: 8px 0; font-size: 12px; font-family: var(--font-mono); }
        .old-val { color: #888; }
        .arrow { color: #666; }
        .new-val { color: #fff; font-weight: 800; }
        .delta { color: #5599ff; font-size: 10px; }
        .sug-impact { display: flex; gap: 12px; font-size: 9px; color: #888; margin: 8px 0; flex-wrap: wrap; }
        .sug-impact strong { color: #fff; margin-right: 8px; }
        .sug-impact span { background: #111; padding: 2px 6px; }
        .sug-rationale { font-size: 10px; color: #ccc; margin: 8px 0; }
        .sug-link { font-size: 9px; color: #666; margin: 4px 0; }
        .sug-link code { color: #888; background: #111; padding: 2px 4px; }
        .review-actions { display: flex; gap: 8px; margin-top: 12px; }
        .accept-btn, .reject-btn { flex: 1; padding: 8px; font-size: 9px; font-weight: 800; cursor: pointer; border: 1px solid; }
        .accept-btn { background: #fff; color: #000; border-color: #fff; }
        .accept-btn:hover { background: #eee; }
        .reject-btn { background: transparent; color: #888; border-color: #333; }
        .reject-btn:hover { border-color: #666; color: #fff; }
        
        .status-badge { font-size: 10px; font-weight: 800; text-align: center; padding: 6px; width: 100%; text-transform: uppercase; }
        .status-badge.accepted { color: #10b981; border: 1px solid #10b981; }
        .status-badge.rejected { color: #ef4444; border: 1px solid #ef4444; }
        
        /* Trade-offs */
        .scenario-table { overflow-x: auto; }
        .scenario-table table { width: 100%; font-size: 10px; border-collapse: collapse; }
        .scenario-table th { text-align: left; padding: 8px; color: #666; border-bottom: 1px solid #222; font-weight: 800; }
        .scenario-table td { padding: 8px; color: #ccc; border-bottom: 1px solid #111; }
        .scenario-table .sc-name { color: #fff; font-weight: 800; }
        .scenario-table tr.recommended { background: rgba(255,255,255,0.05); }
        .scenario-table tr.recommended .sc-name { color: #5599ff; }
        .recommendation { font-size: 10px; color: #fff; margin-top: 12px; }
        .recommendation strong { color: #5599ff; }
      `}</style>
    </div>
  );
}

// Guidance Tab - SRS F6 Step-by-Step CAD Guidance
function GuidanceTab({ variant }: { variant: ReturnType<typeof useSelectedVariant> }) {
  const [mode, setMode] = useState<'manufacturing' | 'cad'>('manufacturing');
  const intent = useDesignIntent();

  if (!variant) return <div className="empty">Generate guidance to view steps.</div>;

  const cadSteps = intent ? generateCADSteps(intent, variant) : [];

  const procedures = [
    {
      step: 1,
      title: 'Material Confirmation',
      description: `Validate ${intent?.materials?.[0]?.includes('Aluminum') ? 'aluminum alloy' : 'material'} stock availability.`,
      details: ['Check mill certs', 'Verify stock dimensions', 'Confirm material grade'],
    },
    {
      step: 2,
      title: 'Tolerances & GD&T',
      description: 'Translate design tolerances into manufacturing specifications.',
      details: ['Apply ISO/ASME standards', 'Define datum references', 'Specify hole position tolerances'],
    },
    {
      step: 3,
      title: 'CNC Setup',
      description: 'Prepare machining setup.',
      details: [
        'Set work coordinate system',
        'Load tooling',
        'Verify fixture rigidity'
      ],
    },
    {
      step: 4,
      title: 'Machining Operations',
      description: 'Execute primary material removal and feature creation.',
      details: [
        'Face milling for flatness',
        'Profile machining (outer contour)',
        'Hole drilling operations',
        'Chamfer/Fillet operations',
      ],
    },
    {
      step: 5,
      title: 'Surface Finishing',
      description: 'Apply finish as specified.',
      details: ['Deburr all edges', 'Surface prep', 'Final inspection'],
    },
  ];

  return (
    <div className="procedures-tab">
      <div className="header-row">
        <div className="variant-badge">
          {variant.displayName}
        </div>
        <div className="mode-toggle">
          <button
            className={mode === 'manufacturing' ? 'active' : ''}
            onClick={() => setMode('manufacturing')}
          >
            Mfg
          </button>
          <button
            className={mode === 'cad' ? 'active' : ''}
            onClick={() => setMode('cad')}
          >
            CAD
          </button>
        </div>
      </div>

      {mode === 'manufacturing' ? (
        procedures.map((proc) => (
          <div key={proc.step} className="procedure-item">
            <div className="step-number">{proc.step}</div>
            <div className="step-content">
              <h4>{proc.title}</h4>
              <p>{proc.description}</p>
              <ul>
                {proc.details.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          </div>
        ))
      ) : (
        <div className="cad-steps">
          {cadSteps.map((step) => (
            <div key={step.stepNumber} className="procedure-item">
              <div className="step-number cad">{step.stepNumber}</div>
              <div className="step-content">
                <div className="step-header">
                  <h4>{step.action}</h4>
                  <span className="tool-icon">{step.toolIcon}</span>
                </div>
                <p>{step.description}</p>
                {step.parameters && (
                  <div className="step-params">
                    {Object.entries(step.parameters).map(([k, v]) => (
                      <span key={k} className="param-tag">{k}: {v}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .procedures-tab {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .variant-badge {
          padding: 6px 12px;
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(139, 92, 246, 0.2));
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #c0c0c0;
        }

        .mode-toggle {
            display: flex;
            background: rgba(0,0,0,0.3);
            border-radius: 6px;
            padding: 2px;
        }

        .mode-toggle button {
            padding: 4px 10px;
            border: none;
            background: transparent;
            color: #606060;
            font-size: 11px;
            font-weight: 600;
            border-radius: 4px;
            cursor: pointer;
        }

        .mode-toggle button.active {
            background: rgba(255,255,255,0.1);
            color: #fff;
        }
        
        .procedure-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: #000;
          border: 1px solid #1a1a1a;
        }

        .step-number {
          width: 32px;
          height: 32px;
          background: #fff;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          flex-shrink: 0;
        }
        
        .step-number.cad {
            background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .step-content {
          flex: 1;
        }
        
        .step-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
        }

        .step-content h4 {
          margin: 0 0 4px 0;
          font-size: 13px;
          font-weight: 600;
          color: #e0e0e0;
        }
        
        .tool-icon {
            font-size: 16px;
        }

        .step-content p {
          margin: 0 0 8px 0;
          font-size: 12px;
          color: #909090;
        }

        .step-content ul {
          margin: 0;
          padding-left: 14px;
          font-size: 11px;
          color: #707070;
        }
        
        .empty {
          color: #444;
          font-size: 10px;
          text-align: center;
          padding: 40px;
        }
        
        .step-params {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        
        .param-tag {
            font-size: 10px;
            padding: 2px 6px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 4px;
            color: #a0a0a0;
            font-family: monospace;
        }
        
        .cad-steps {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
      `}</style>
    </div>
  );
}

// Material Simulation Tab
function SimulationTab() {
  const results = useAppStore(state => state.simulationResults);
  const intent = useAppStore(state => state.designIntent);

  if (!results.length) return <div className="empty">RUN ENGINE TO COMMENCE SIMULATION</div>;

  return (
    <div className="simulation-tab">
      <div className="sim-header">
        <h3>PHYSICAL TRADE-OFF MATRIX</h3>
        <p>Virtual linear-elastic simulation based on {intent?.part_id || 'Current Intent'}.</p>
      </div>

      <div className="sim-table-wrapper">
        <table className="sim-table">
          <thead>
            <tr>
              <th>MATERIAL</th>
              <th>MASS (G)</th>
              <th>S.F.</th>
              <th>DEFL (MM)</th>
              <th>COST</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className={r.safetyFactor < (intent?.acceptance.safety_factor_min || 0) ? 'fail' : ''}>
                <td className="m-name">{r.materialName}</td>
                <td>{r.mass_g}</td>
                <td className="sf-val">{r.safetyFactor}</td>
                <td>{r.deflection_mm}</td>
                <td className="cost-stars">{"★".repeat(r.cost_score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .simulation-tab { display: flex; flex-direction: column; gap: 20px; }
        .sim-header h3 { font-size: 11px; margin: 0 0 4px 0; letter-spacing: 1px; }
        .sim-header p { font-size: 10px; color: #444; margin: 0; }

        .sim-table-wrapper { border: 1px solid #1a1a1a; background: #000; }
        .sim-table { width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 10px; }
        .sim-table th { text-align: left; padding: 10px 8px; color: #444; border-bottom: 1px solid #1a1a1a; font-weight: 800; }
        .sim-table td { padding: 10px 8px; color: #fff; border-bottom: 1px solid #080808; }
        
        .m-name { color: #fff; font-weight: 800; }
        .sf-val { font-weight: 800; }
        .cost-stars { color: #444; font-size: 8px; }

        .sim-table tr.fail td { background: rgba(255,0,0,0.05); }
        .sim-table tr.fail .sf-val { color: #ff5555; }

        .empty { color: #222; font-size: 10px; text-align: center; padding: 40px; }
      `}</style>
    </div>
  );
}

// Audit Tab (formerly Export) - Exports & Data Control
import { ExportManager } from '@/lib/export/ExportManager';
import * as THREE from 'three';

// ...

// Audit Tab (formerly Export) - Exports & Data Control
function AuditTab({ variant }: { variant: ReturnType<typeof useSelectedVariant> }) {
  const designIntent = useAppStore(state => state.designIntent);
  if (!variant) return null;

  const handleExportJSON = () => {
    if (designIntent) {
      ExportManager.downloadJSON(designIntent, variant, `AIES_${variant.id}`);
    }
  };

  const handleExportSTL = () => {
    // Traverse scene to find the generated mesh
    // In a real app, we might store the mesh ref in the store or use a more robust selector
    // For now, we'll try to find it in the active scene graph if reachable, 
    // or we might need to regenerate it temporarily. 
    // BUT: InfoPanel is outside the Canvas. We can't access the THREE scene directly here easily.
    // WORKAROUND: We will dispatch a custom event that ParametricMesh listens to, OR
    // we assume the user accepts that we regenerate geometry for export.
    // Let's go with "Regenerate for Export" approach using the Generator classes directly here 
    // to keep it clean and separated from the view layer.

    // Import generators dynamically or reuse the logic?
    // Let's assume we can access the global scene or just dispatch an event.
    // Simpler: Dispatch event 'EXPORT_STL_REQUESTED'
    window.dispatchEvent(new CustomEvent('EXPORT_STL_REQUESTED', { detail: { filename: `AIES_${variant.id}` } }));
  };

  return (
    <div className="export-tab">
      <div className="section">
        <h3>📦 Audit & Export</h3>
        <p className="desc">Export design data for compliance and manufacturing handover.</p>

        <div className="action-row">
          <button className="export-btn primary" onClick={handleExportSTL}>
            <span>Download STL (3D)</span>
          </button>
          <button className="export-btn secondary" onClick={handleExportJSON}>
            <span>Download Spec (JSON)</span>
          </button>
        </div>
      </div>

      <div className="section">
        <h3>REVIEW STATUS</h3>
        <p className="placeholder">Human-in-the-loop audit trail will appear here (SRS F8)</p>
      </div>

      <style jsx>{`
                .export-tab { display: flex; flex-direction: column; gap: 20px; }
                .section { border: 1px solid #1a1a1a; padding: 16px; background: #000; }
                .section h3 { font-size: 11px; margin: 0 0 12px 0; letter-spacing: 1px; color: #fff; }
                .desc { font-size: 11px; color: #888; margin: 0 0 16px 0; }
                
                .action-row { display: flex; gap: 12px; }
                
                .export-btn {
                    padding: 10px 16px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 700;
                    cursor: pointer;
                    flex: 1;
                    border: 1px solid;
                    transition: all 0.2s;
                }
                
                .export-btn.primary {
                    background: #fff;
                    color: #000;
                    border-color: #fff;
                }
                
                .export-btn.secondary {
                    background: transparent;
                    color: #fff;
                    border-color: #333;
                }
                
                .export-btn:hover {
                    transform: translateY(-1px);
                    filter: brightness(1.1);
                }
                
                .placeholder { font-size: 10px; color: #444; margin: 0; font-style: italic; }
            `}</style>
    </div>
  );
}
