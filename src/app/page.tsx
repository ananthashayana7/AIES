'use client';

// Cadence - Main Application Page
// Redesigned with larger 3D viewer and collapsible spec panel

import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import SpecInput from '@/components/SpecInput';
import InfoPanel from '@/components/InfoPanel';
import VariantSelector from '@/components/VariantSelector';
import { useAppStore } from '@/store/appStore';

// Dynamic import for 3D viewer (SSR disabled)
const Viewer3D = dynamic(() => import('@/components/Viewer3D'), {
  ssr: false,
  loading: () => (
    <div className="viewer-loading">
      <div className="spinner" />
      <span>Initializing 3D Engine...</span>
    </div>
  ),
});

export default function Home() {
  const { variants, reset } = useAppStore();
  const hasVariants = variants.length > 0;
  const [specPanelCollapsed, setSpecPanelCollapsed] = useState(false);
  const [infoPanelCollapsed, setInfoPanelCollapsed] = useState(false);

  return (
    <div className="app-container">
      {/* Background mesh gradient */}
      <div className="bg-mesh" />

      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="logo-text">
            <h1>Cadence</h1>
            <span>Parametric Design Intelligence</span>
          </div>
        </div>

        <div className="header-actions">
          <motion.button
            className="action-btn new-btn"
            onClick={reset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>+</span> New Design
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Left Panel - Spec Input (collapsible) */}
        <motion.aside
          className={`panel panel-left glass-panel ${specPanelCollapsed ? 'collapsed' : ''}`}
          animate={{ width: specPanelCollapsed ? 48 : 300 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <button
            className="collapse-btn"
            onClick={() => setSpecPanelCollapsed(!specPanelCollapsed)}
          >
            {specPanelCollapsed ? '→' : '←'}
          </button>
          {!specPanelCollapsed && <SpecInput />}
        </motion.aside>

        {/* Center - 3D Viewer (maximized) */}
        <motion.section
          className="panel panel-center"
          layout
        >
          <div className="viewer-wrapper">
            <Viewer3D />
          </div>
          <VariantSelector />
        </motion.section>

        {/* Right Panel - Info/Analysis (collapsible) */}
        <motion.aside
          className={`panel panel-right glass-panel ${infoPanelCollapsed ? 'collapsed' : ''}`}
          animate={{ width: infoPanelCollapsed ? 48 : 360 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <button
            className="collapse-btn right"
            onClick={() => setInfoPanelCollapsed(!infoPanelCollapsed)}
          >
            {infoPanelCollapsed ? '←' : '→'}
          </button>
          {!infoPanelCollapsed && <InfoPanel />}
        </motion.aside>
      </main>

      <style jsx>{`
        .app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          position: relative;
        }

        .bg-mesh {
          position: fixed;
          inset: 0;
          background: var(--gradient-mesh);
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(12, 12, 20, 0.95);
          backdrop-filter: blur(12px);
          z-index: 100;
          position: relative;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gradient-primary);
          border-radius: 10px;
          color: #fff;
          box-shadow: var(--glow-primary);
        }

        .logo-icon svg {
          width: 20px;
          height: 20px;
        }

        .logo-text h1 {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }

        .logo-text span {
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .new-btn {
          background: var(--gradient-primary);
          color: #fff;
          box-shadow: var(--glow-primary);
        }

        .new-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.5);
        }

        /* Main content */
        .app-main {
          flex: 1;
          display: flex;
          gap: 12px;
          padding: 12px;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        .panel {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .panel-left, .panel-right {
          padding: 16px;
          flex-shrink: 0;
        }

        .panel-left.collapsed, .panel-right.collapsed {
          padding: 8px;
        }

        .panel-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0;
          min-width: 0;
        }

        .viewer-wrapper {
          flex: 1;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: var(--shadow-elevated);
          border: 1px solid var(--border-subtle);
        }

        .collapse-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(124, 58, 237, 0.2);
          border: 1px solid rgba(124, 58, 237, 0.3);
          border-radius: 6px;
          color: var(--accent-primary);
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          z-index: 10;
          right: -12px;
        }

        .collapse-btn.right {
          right: auto;
          left: -12px;
        }

        .collapse-btn:hover {
          background: rgba(124, 58, 237, 0.3);
        }

        /* Loading state */
        :global(.viewer-loading) {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 16px;
          color: var(--text-muted);
          font-size: 13px;
          background: linear-gradient(180deg, #0c0c14 0%, #13131f 100%);
        }

        :global(.viewer-loading .spinner) {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(124, 58, 237, 0.2);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
