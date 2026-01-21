'use client';

// Info Panel v0.9 (SRS Compliant) - Right-side Analysis/Guidance Panel

import { useAppStore } from '@/store/appStore';

export default function InfoPanel() {
    const { activePanel, setActivePanel, variants, selectedVariantId } = useAppStore();
    const variant = variants.find(v => v.id === selectedVariantId) || variants[0];

    const tabs = [
        { id: 'guidance', label: 'CAD GUIDANCE' },
        { id: 'insights', label: 'AI INSIGHTS' },
        { id: 'simulation', label: 'MATERIAL SIM' },
        { id: 'audit', label: 'AUDIT & REVIEW' },
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

            <div className="tab-content">
                {activePanel === 'guidance' && <GuidanceTab variant={variant} />}
                {activePanel === 'insights' && <InsightsTab variant={variant} />}
                {activePanel === 'simulation' && <SimulationTab />}
                {activePanel === 'audit' && <AuditTab variant={variant} />}
            </div>

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

// Guidance Tab - SRS F6 Step-by-Step CAD Guidance
function GuidanceTab({ variant }: { variant: any }) {
    if (!variant) return <div className="empty">Generate guidance to view steps.</div>;

    return (
        <div className="guidance-tab">
            <div className="header">
                <h2>SOLIDWORKS WORKFLOW</h2>
                <p className="sub">{variant.displayName}</p>
            </div>

            <div className="steps">
                {variant.guidance.map((g: any, i: number) => (
                    <div key={i} className="step-card">
                        <div className="step-num">{g.step}</div>
                        <div className="step-content">
                            <h3>{g.title}</h3>
                            <p className="description">{g.description}</p>
                            {g.rationale && (
                                <p className="rationale">
                                    <strong>Rationale:</strong> {g.rationale}
                                </p>
                            )}
                            {g.linkToIntent && (
                                <p className="link">
                                    Linked to: <code>{g.linkToIntent}</code>
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
        .guidance-tab { font-family: var(--font-sans); }
        .header { margin-bottom: 24px; border-bottom: 1px solid #1a1a1a; padding-bottom: 16px; }
        .header h2 { font-size: 14px; margin: 0 0 4px 0; letter-spacing: 1px; color: #fff; }
        .header .sub { font-size: 10px; color: #666; margin: 0; }

        .steps { display: flex; flex-direction: column; gap: 16px; }
        .step-card {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: #000;
          border: 1px solid #1a1a1a;
        }

        .step-num {
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

        .step-content { flex: 1; }
        .step-content h3 {
          font-size: 12px;
          margin: 0 0 8px 0;
          color: #fff;
          font-weight: 700;
        }

        .description {
          font-size: 11px;
          color: #ccc;
          line-height: 1.5;
          margin: 0 0 8px 0;
        }

        .rationale {
          font-size: 10px;
          color: #888;
          margin: 8px 0 0 0;
          padding-top: 8px;
          border-top: 1px solid #111;
          line-height: 1.4;
        }

        .rationale strong {
          color: #fff;
        }

        .link {
          font-size: 9px;
          color: #666;
          margin: 4px 0 0 0;
        }

        .link code {
          color: #888;
          background: #111;
          padding: 2px 4px;
        }

        .empty {
          color: #444;
          font-size: 10px;
          text-align: center;
          padding: 40px;
        }
      `}</style>
        </div>
    );
}

// AI Insights Tab - SRS F5 AI Reasoning & Insights
function InsightsTab({ variant }: { variant: any }) {
    const aiReasoning = useAppStore(state => state.aiReasoning);
    const acceptSuggestion = useAppStore(state => state.acceptSuggestion);
    const rejectSuggestion = useAppStore(state => state.rejectSuggestion);

    if (!aiReasoning) {
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

    const { constraintViolations, suggestions, tradeoffs } = aiReasoning;

    return (
        <div className="insights-tab">
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
                    {suggestions.map((sug, i) => (
                        <div key={sug.id} className="suggestion-card">
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

                            <div className="sug-actions">
                                <button className="accept-btn" onClick={() => acceptSuggestion(sug.id)}>ACCEPT</button>
                                <button className="reject-btn" onClick={() => rejectSuggestion(sug.id, 'User rejected')}>REJECT</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Trade-off Analysis */}
            {tradeoffs.scenarios.length > 0 && (
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
        .violations .violation { margin-bottom: 12px; border-left: 3px solid #ff5555; padding-left: 12px; }
        .violations .violation.warn { border-left-color: #ffaa00; }
        .v-header { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
        .badge { font-size: 8px; padding: 2px 6px; font-weight: 800; color: #000; }
        .badge.blocker { background: #ff5555; }
        .badge.warn { background: #ffaa00; }
        .v-id { font-size: 9px; color: #888; font-family: var(--font-mono); }
        .v-body { font-size: 10px; }
        .clause { color: #ccc; margin: 4px 0; }
        .comparison { color: #888; margin: 4px 0; }
        .comparison strong { color: #fff; }
        .suggestion-hint { color: #ffaa00; margin: 4px 0; }
        
        /* Suggestions */
        .suggestions .suggestion-card { background: #050505; border: 1px solid #222; padding: 12px; margin-bottom: 12px; }
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
        .sug-actions { display: flex; gap: 8px; margin-top: 12px; }
        .accept-btn, .reject-btn { flex: 1; padding: 8px; font-size: 9px; font-weight: 800; cursor: pointer; border: 1px solid; }
        .accept-btn { background: #fff; color: #000; border-color: #fff; }
        .accept-btn:hover { background: #eee; }
        .reject-btn { background: transparent; color: #888; border-color: #333; }
        .reject-btn:hover { border-color: #666; color: #fff; }
        
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

// Audit Tab
function AuditTab({ variant }: { variant: any }) {
    return (
        <div className="audit-tab">
            <div className="section">
                <h3>REVIEW STATUS</h3>
                <p className="placeholder">Human-in-the-loop audit trail will appear here</p>
                <p className="note">SRS F8: Review decisions, timestamps, and sign-off</p>
            </div>

            <style jsx>{`
        .audit-tab { display: flex; flex-direction: column; gap: 20px; }
        .section { border: 1px solid #1a1a1a; padding: 16px; background: #000; }
        .section h3 { font-size: 11px; margin: 0 0 12px 0; letter-spacing: 1px; color: #666; }
        .placeholder { font-size: 10px; color: #888; margin: 0 0 8px 0; }
        .note { font-size: 9px; color: #444; margin: 0; }
      `}</style>
        </div>
    );
}
