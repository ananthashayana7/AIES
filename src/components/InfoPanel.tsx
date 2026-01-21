'use client';

// Info Panel - Displays AI reasoning, rule results, and procedure notes
// The core "engineering intelligence" display

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
        { id: 'audit', label: '💾 Audit', icon: '💾' },
    ] as const;

    // Filter to ensure we only show valid tabs for this panel
    // If activePanel is 'intent' or 'simulation', we might want to default to 'insights' in this view
    // But for now, we'll let the store control it.

    return (
        <div className="info-panel">
            <div className="tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab ${activePanel === tab.id ? 'active' : ''}`}
                        onClick={() => setActivePanel(tab.id)}
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
                    {activePanel === 'audit' && <AuditTab variant={variant} />}
                </motion.div>
            </AnimatePresence>

            <style jsx>{`
        .info-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }

        .tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .tab {
          flex: 1;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #808080;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab.active {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .tab:hover:not(.active) {
          color: #c0c0c0;
        }

        .tab-content {
          flex: 1;
          overflow-y: auto;
          padding-right: 4px;
        }
      `}</style>
        </div>
    );
}

// Insights Tab (formerly Analysis) - AI reasoning results
function InsightsTab({ variant }: { variant: ReturnType<typeof useSelectedVariant> }) {
    const { reviewSuggestion, reviewDecisions } = useAppStore();

    if (!variant) return null;

    const { aiReasoning, ruleResults } = variant;

    // Calculate audit stats
    const decisions = Object.values(reviewDecisions);
    const acceptedCount = decisions.filter(d => d.decision === 'accepted').length;
    const rejectedCount = decisions.filter(d => d.decision === 'rejected').length;

    return (
        <div className="analysis-tab">
            {/* AI Summary */}
            <div className="section">
                <h3>🤖 AI Reasoning Summary</h3>
                <div className="summary-box">
                    <pre>{aiReasoning.summary}</pre>
                </div>
            </div>

            {/* Risk Scores */}
            <div className="section">
                <h3>⚠️ Risk Assessment</h3>
                <div className={`risk-level ${aiReasoning.overallRiskLevel}`}>
                    {aiReasoning.overallRiskLevel.toUpperCase()} RISK
                </div>
                {aiReasoning.riskScores.map((risk, i) => (
                    <div key={i} className="risk-item">
                        <div className="risk-header">
                            <span>{risk.category}</span>
                            <span className="score">{risk.score}%</span>
                        </div>
                        <div className="risk-bar">
                            <div
                                className="risk-fill"
                                style={{
                                    width: `${risk.score}%`,
                                    background: risk.score > 60 ? '#ef4444' : risk.score > 30 ? '#f59e0b' : '#10b981'
                                }}
                            />
                        </div>
                        <ul className="risk-factors">
                            {risk.factors.map((f, j) => <li key={j}>{f}</li>)}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Rule Results */}
            <div className="section">
                <h3>✓ Rule Engine ({ruleResults.score}%)</h3>
                {ruleResults.results.map((rule, i) => (
                    <div key={i} className={`rule-item ${rule.passed ? 'pass' : rule.severity}`}>
                        <span className="rule-icon">
                            {rule.passed ? '✓' : rule.severity === 'error' ? '✗' : '⚠'}
                        </span>
                        <div className="rule-content">
                            <strong>{rule.ruleName}</strong>
                            <p>{rule.message}</p>
                            {rule.suggestion && <em>💡 {rule.suggestion}</em>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Suggestions with Review */}
            {aiReasoning.suggestions.length > 0 && (
                <div className="section">
                    <h3>💡 Optimization Suggestions</h3>
                    {aiReasoning.suggestions.map((s, i) => {
                        const status = reviewDecisions[s.id]?.decision;
                        return (
                            <div key={s.id || i} className={`suggestion-item ${status || ''}`}>
                                <div className="param-change">
                                    <span className="param">{s.parameter}</span>
                                    <span className="values">
                                        {s.currentValue} → {s.suggestedValue} ({s.delta > 0 ? '+' : ''}{s.delta})
                                    </span>
                                </div>
                                <p>{s.rationale}</p>
                                <small>Expected: {s.expectedImprovement}</small>

                                <div className="review-actions">
                                    {status ? (
                                        <div className={`status-badge ${status}`}>
                                            {status === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                className="review-btn accept"
                                                onClick={() => reviewSuggestion(s.id, 'accepted')}
                                            >
                                                Accept
                                            </button>
                                            <button
                                                className="review-btn reject"
                                                onClick={() => reviewSuggestion(s.id, 'rejected')}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Audit Log Summary */}
            <div className="section">
                <h3>📋 Review Audit Log</h3>
                <div className="audit-box">
                    <div className="audit-stat">
                        <span>Accepted:</span> <strong>{acceptedCount}</strong>
                    </div>
                    <div className="audit-stat">
                        <span>Rejected:</span> <strong>{rejectedCount}</strong>
                    </div>
                    <div className="audit-stat">
                        <span>Pending:</span> <strong>{aiReasoning.suggestions.length - acceptedCount - rejectedCount}</strong>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .analysis-tab {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section h3 {
          font-size: 13px;
          font-weight: 600;
          color: #a0a0a0;
          margin: 0 0 12px 0;
        }

        .summary-box, .audit-box {
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
        }

        .summary-box pre {
          margin: 0;
          white-space: pre-wrap;
          font-family: inherit;
          font-size: 13px;
          color: #d0d0d0;
          line-height: 1.5;
        }

        .audit-box {
            display: flex;
            gap: 20px;
        }

        .audit-stat span {
            color: #808080;
            font-size: 12px;
            margin-right: 6px;
        }

        .audit-stat strong {
            color: #fff;
        }

        .risk-level {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .risk-level.low { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .risk-level.medium { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        .risk-level.high { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

        .risk-item {
          margin-bottom: 16px;
        }

        .risk-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .risk-header .score {
          color: #808080;
        }

        .risk-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .risk-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .risk-factors {
          margin: 8px 0 0 0;
          padding-left: 16px;
          font-size: 11px;
          color: #707070;
        }

        .rule-item {
          display: flex;
          gap: 10px;
          padding: 10px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          margin-bottom: 8px;
          border-left: 3px solid;
        }

        .rule-item.pass { border-color: #10b981; }
        .rule-item.warning { border-color: #f59e0b; }
        .rule-item.error { border-color: #ef4444; }

        .rule-icon {
          font-size: 14px;
        }

        .rule-content {
          flex: 1;
        }

        .rule-content strong {
          font-size: 12px;
          color: #e0e0e0;
        }

        .rule-content p {
          margin: 4px 0;
          font-size: 11px;
          color: #909090;
        }

        .rule-content em {
          font-size: 11px;
          color: #60a5fa;
          font-style: normal;
        }

        .suggestion-item {
          padding: 12px;
          background: rgba(96, 165, 250, 0.1);
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .suggestion-item.accepted {
           background: rgba(16, 185, 129, 0.1);
        }

        .suggestion-item.rejected {
           background: rgba(239, 68, 68, 0.1);
           opacity: 0.7;
        }

        .param-change {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .param {
          font-weight: 600;
          color: #60a5fa;
          font-size: 12px;
        }

        .suggestion-item.accepted .param { color: #10b981; }
        .suggestion-item.rejected .param { color: #ef4444; }

        .values {
          font-family: monospace;
          font-size: 12px;
          color: #a0a0a0;
        }

        .suggestion-item p {
          margin: 0 0 4px 0;
          font-size: 12px;
          color: #c0c0c0;
        }

        .suggestion-item small {
          color: #707070;
          font-size: 11px;
        }

        .review-actions {
            margin-top: 10px;
            display: flex;
            gap: 8px;
        }

        .review-btn {
            padding: 4px 10px;
            border-radius: 4px;
            border: 1px solid transparent;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .review-btn.accept {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
            border-color: rgba(16, 185, 129, 0.3);
        }

        .review-btn.reject {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            border-color: rgba(239, 68, 68, 0.3);
        }

        .review-btn:hover {
            transform: translateY(-1px);
            filter: brightness(1.2);
        }

        .status-badge {
            font-size: 11px;
            font-weight: 600;
        }

        .status-badge.accepted { color: #10b981; }
        .status-badge.rejected { color: #ef4444; }
      `}</style>
        </div>
    );
}

// Guidance Tab (formerly Procedures) - Manufacturing steps & CAD Guidance
function GuidanceTab({ variant }: { variant: ReturnType<typeof useSelectedVariant> }) {
    const [mode, setMode] = useState<'manufacturing' | 'cad'>('manufacturing');
    const intent = useDesignIntent();

    if (!variant) return null;

    const cadSteps = intent ? generateCADSteps(intent, variant) : [];

    const procedures = [
        {
            step: 1,
            title: 'Material Confirmation',
            description: `Validate ${variant.cadSnapshot.designIntentId.includes('Aluminum') ? 'aluminum alloy' : 'material'} stock availability and certifications.`,
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
            description: `Prepare for ${variant.edgeStyle === 'fillet' ? 'fillet' : 'chamfer'} machining with appropriate tooling.`,
            details: [
                `Wall thickness: ${variant.wallThickness}mm`,
                `Fillet radius: ${variant.filletRadius}mm`,
                variant.pocketDepth > 0 ? `Pocket depth: ${variant.pocketDepth}mm` : 'No pocketing required',
            ],
        },
        {
            step: 4,
            title: 'Machining Operations',
            description: 'Execute primary material removal and feature creation.',
            details: [
                'Face milling for flatness',
                'Profile machining (outer contour)',
                `${variant.cadSnapshot.featureCount.holes} hole drilling operations`,
                variant.edgeStyle === 'fillet' ? 'Ball end mill for fillets' : 'Chamfer tool for edges',
            ],
        },
        {
            step: 5,
            title: 'Surface Finishing',
            description: `Apply ${variant.finish} finish as specified.`,
            details: ['Deburr all edges', 'Surface prep for coating', 'Final inspection before finish'],
        },
        {
            step: 6,
            title: 'Quality Inspection',
            description: 'Verify critical dimensions and surface requirements.',
            details: [
                'CMM measurement of hole positions',
                'Wall thickness verification',
                'Surface roughness check',
                'Visual inspection for defects',
            ],
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
          gap: 12px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }

        .step-number {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-radius: 50%;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
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

        .step-content li {
          margin: 2px 0;
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

// Audit Tab (formerly Export) - Exports & Data Control
function AuditTab({ variant }: { variant: ReturnType<typeof useSelectedVariant> }) {
    if (!variant) return null;

    const handleExportJSON = () => {
        const data = JSON.stringify({
            designIntent: variant.cadSnapshot.designIntentId,
            variant: variant.variantType,
            parameters: variant.cadSnapshot.parameters,
            massProperties: variant.cadSnapshot.massProperties,
            ruleResults: variant.ruleResults,
        }, null, 2);

        downloadFile(data, `${variant.variantType}-spec.json`, 'application/json');
    };

    const handleExportPDF = () => {
        alert('PDF export would use jsPDF library. Generating sample...');
        // In production, use jsPDF to create proper PDF
    };

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="export-tab">
            <div className="export-info">
                <h3>📦 Audit & Export</h3>
                <p>Export design data for compliance and manufacturing handover.</p>
            </div>

            <div className="export-options">
                <button className="export-btn" onClick={handleExportJSON}>
                    <span className="icon">{ }</span>
                    <div className="btn-content">
                        <strong>Design Intent JSON</strong>
                        <small>Parameters, constraints, analysis</small>
                    </div>
                </button>

                <button className="export-btn" onClick={handleExportPDF}>
                    <span className="icon">📄</span>
                    <div className="btn-content">
                        <strong>Procedure Notes PDF</strong>
                        <small>Manufacturing steps, DFM notes</small>
                    </div>
                </button>

                <button className="export-btn disabled">
                    <span className="icon">🎨</span>
                    <div className="btn-content">
                        <strong>3D Model GLB</strong>
                        <small>Coming soon</small>
                    </div>
                </button>
            </div>

            <div className="privacy-note">
                🔒 All exports are generated locally. Your data never leaves your device.
            </div>

            <style jsx>{`
        .export-tab {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .export-info h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #e0e0e0;
        }

        .export-info p {
          margin: 0;
          font-size: 12px;
          color: #707070;
        }

        .export-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .export-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .export-btn:hover:not(.disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(96, 165, 250, 0.5);
        }

        .export-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .export-btn .icon {
          font-size: 24px;
        }

        .btn-content {
          flex: 1;
        }

        .btn-content strong {
          display: block;
          font-size: 13px;
          color: #e0e0e0;
        }

        .btn-content small {
          font-size: 11px;
          color: #707070;
        }

        .privacy-note {
          padding: 12px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 8px;
          font-size: 11px;
          color: #10b981;
          text-align: center;
        }
      `}</style>
        </div>
    );
}
