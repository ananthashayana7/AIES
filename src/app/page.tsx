'use client';

// Cadence v0.9 - SRS Compliant Professional Layout
// Home/Workspace: Design Intent (L) | Visualizer (C) | Guidance/Insights (R)

import dynamic from 'next/dynamic';
import { useState } from 'react';
import SpecInput from '@/components/SpecInput';
import InfoPanel from '@/components/InfoPanel';
import VariantSelector from '@/components/VariantSelector';
import { useAppStore } from '@/store/appStore';

const Viewer3D = dynamic(() => import('@/components/Viewer3D'), {
  ssr: false,
  loading: () => <div className="viewer-loading">Initializing CAD Environment...</div>,
});

export default function Home() {
  const { reset } = useAppStore();
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="app-layout">
      {/* Header - SRS 3.1 Utility */}
      <header className="header">
        <div className="brand-section">
          <h1>Cadence</h1>
          <span className="version">v0.9 DRAFT</span>
        </div>

        <div className="toolbar-section">
          <button onClick={reset} className="tool-btn">NEW PROJECT</button>
          <span className="divider">|</span>
          <button
            onClick={() => setLeftOpen(!leftOpen)}
            className={`tool-btn ${leftOpen ? 'active' : ''}`}
          >
            INTENT
          </button>
          <button
            onClick={() => setRightOpen(!rightOpen)}
            className={`tool-btn ${rightOpen ? 'active' : ''}`}
          >
            ANALYSIS
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="workspace">
        {/* SRS F2: Design Intent Editor */}
        {leftOpen && (
          <aside className="panel left-panel">
            <SpecInput />
          </aside>
        )}

        {/* SRS F7: Conceptual Visualization */}
        <section className="center-panel">
          <div className="viewer-container">
            <Viewer3D />
          </div>

          <div className="variants-container">
            <VariantSelector />
          </div>
        </section>

        {/* SRS F5/F6/F8: Insights, Guidance & Audit */}
        {rightOpen && (
          <aside className="panel right-panel">
            <InfoPanel />
          </aside>
        )}
      </main>

      <style jsx>{`
        .app-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #000;
          overflow: hidden;
          font-family: var(--font-sans);
        }

        .header {
          height: 48px;
          background: #000;
          border-bottom: 1px solid #222;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 100;
        }

        .brand-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-section h1 {
          font-size: 14px;
          margin: 0;
          font-weight: 800;
          letter-spacing: 1px;
          color: #fff;
        }

        .version {
          font-size: 9px;
          color: #666;
          border: 1px solid #333;
          padding: 2px 4px;
          font-weight: 700;
        }

        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .tool-btn {
          background: transparent;
          border: none;
          color: #888;
          padding: 4px 12px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
        }

        .tool-btn:hover { color: #fff; }
        .tool-btn.active { color: #fff; text-decoration: underline; text-underline-offset: 4px; }

        .divider { color: #222; margin: 0 8px; font-size: 12px; }

        .workspace {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .panel {
          background: #050505;
          display: flex;
          flex-direction: column;
        }

        .left-panel {
          width: 340px;
          border-right: 1px solid #222;
        }

        .right-panel {
          width: 400px;
          border-left: 1px solid #222;
        }

        .center-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #000;
          position: relative;
        }

        .viewer-container {
          flex: 1;
          position: relative;
        }

        .visualizer-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          font-size: 10px;
          color: #444;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .variants-container {
          height: 140px;
          border-top: 1px solid #222;
          background: #050505;
        }
        
        :global(.viewer-loading) {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #444;
          font-size: 11px;
          font-family: var(--font-mono);
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  );
}
