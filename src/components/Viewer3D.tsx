'use client';

// 3D Viewer - Click-to-inspect instead of hover tooltips
// Clean, unobstructed view with inspect mode

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, Html } from '@react-three/drei';
import { Suspense, useState } from 'react';
import * as THREE from 'three';
import { useSelectedVariant, useDesignIntent } from '@/store/appStore';
import ParametricMesh from './ParametricMesh';

export type ViewMode = 'standard' | 'wireframe' | 'xray';

export interface ViewSettings {
    mode: ViewMode;
    showGrid: boolean;
    showAxes: boolean;
}

function LoadingBox() {
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#1a1a2e" wireframe />
        </mesh>
    );
}

interface InspectData {
    visible: boolean;
    region: string;
    specs: { label: string; value: string }[];
}

function Scene({
    inspectMode,
    onInspect,
    viewSettings
}: {
    inspectMode: boolean;
    onInspect: (data: InspectData) => void;
    viewSettings: ViewSettings;
}) {
    const variant = useSelectedVariant();
    const intent = useDesignIntent();

    const handleClick = (region: string) => {
        if (!inspectMode || !variant || !intent) return;

        let specs: { label: string; value: string }[] = [];

        switch (region) {
            case 'body':
                specs = [
                    { label: 'Dimensions', value: `${intent.envelope.L} × ${intent.envelope.W} × ${intent.envelope.H} mm` },
                    { label: 'Wall Thickness', value: `${variant.wallThickness} mm` },
                    { label: 'Material', value: intent.material.name },
                    { label: 'Surface Finish', value: intent.material.finish },
                    { label: 'Estimated Mass', value: `${variant.estimatedMass.toFixed(0)} g` },
                ];
                break;
            case 'hole':
                specs = [
                    { label: 'Thread', value: intent.features.mountingHoles?.thread || 'M4' },
                    { label: 'Count', value: `${intent.features.mountingHoles?.count || 4}` },
                    { label: 'Edge Offset', value: `${intent.features.mountingHoles?.edgeOffset || 10} mm` },
                ];
                break;
            case 'pocket':
                specs = [
                    { label: 'Depth', value: `${variant.pocketDepth} mm` },
                    { label: 'Purpose', value: 'Weight reduction' },
                ];
                break;
        }

        onInspect({ visible: true, region, specs });
    };

    if (!variant || !intent) {
        return (
            <>
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[2, 1.5, 0.5]} />
                    <meshStandardMaterial
                        color="#1a1a2e"
                        metalness={0.6}
                        roughness={0.4}
                        transparent
                        opacity={0.4}
                    />
                </mesh>
                <mesh position={[0, 0.2, 0]}>
                    <torusGeometry args={[0.5, 0.15, 16, 32]} />
                    <meshStandardMaterial
                        color="#7c3aed"
                        metalness={0.8}
                        roughness={0.2}
                        emissive="#7c3aed"
                        emissiveIntensity={0.2}
                    />
                </mesh>
                <gridHelper args={[10, 20, '#2a2a4a', '#1a1a2e']} position={[0, -0.75, 0]} />

                <Html center position={[0, -0.3, 0]}>
                    <div style={{
                        color: '#6b6b88',
                        fontSize: '13px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                    }}>
                        Configure specifications and generate design
                    </div>
                </Html>
            </>
        );
    }

    return (
        <>
            <ParametricMesh
                variant={variant}
                intent={intent}
                inspectMode={inspectMode}
                viewSettings={viewSettings}
                onClick={handleClick}
            />
            <ContactShadows
                position={[0, -0.5, 0]}
                opacity={0.5}
                scale={15}
                blur={2.5}
                color="#7c3aed"
            />
            {viewSettings.showGrid && (
                <gridHelper args={[20, 40, '#2a2a4a', '#1a1a2e']} position={[0, -0.5, 0]} />
            )}
            {viewSettings.showAxes && (
                <axesHelper args={[2]} position={[-5, -0.5, 5]} />
            )}
        </>
    );
}

export default function Viewer3D() {
    const [inspectMode, setInspectMode] = useState(false);
    const [inspectData, setInspectData] = useState<InspectData>({ visible: false, region: '', specs: [] });

    // Workstation Settings
    const [viewSettings, setViewSettings] = useState<ViewSettings>({
        mode: 'standard',
        showGrid: true,
        showAxes: false,
    });

    const toggleViewMode = () => {
        const modes: ViewMode[] = ['standard', 'wireframe', 'xray'];
        const nextIndex = (modes.indexOf(viewSettings.mode) + 1) % modes.length;
        setViewSettings({ ...viewSettings, mode: modes[nextIndex] });
    };

    return (
        <div className="viewer-container">
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[3.5, 2, 3.5]} fov={50} />
                <ambientLight intensity={0.35} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />
                <pointLight position={[-8, 5, -8]} intensity={0.5} color="#7c3aed" />
                <pointLight position={[8, 3, 8]} intensity={0.3} color="#06b6d4" />

                <Suspense fallback={<LoadingBox />}>
                    <Scene
                        inspectMode={inspectMode}
                        onInspect={setInspectData}
                        viewSettings={viewSettings}
                    />
                    <Environment preset="night" />
                </Suspense>

                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                    minDistance={1.5}
                    maxDistance={12}
                    minPolarAngle={0.2}
                    maxPolarAngle={Math.PI / 2 + 0.3}
                />
            </Canvas>

            {/* Toolbar */}
            <div className="viewer-toolbar">
                <button
                    className={`tool-btn ${inspectMode ? 'active' : ''}`}
                    onClick={() => {
                        setInspectMode(!inspectMode);
                        setInspectData({ visible: false, region: '', specs: [] });
                    }}
                    title="Inspect Mode - Click on parts to see specs"
                >
                    🔍 Inspect
                </button>
                <div className="divider" />
                <button
                    className="tool-btn"
                    onClick={toggleViewMode}
                    title={`View Mode: ${viewSettings.mode}`}
                >
                    {viewSettings.mode === 'standard' ? '🧊 Solid' : viewSettings.mode === 'wireframe' ? '🕸️ Wire' : '👻 X-Ray'}
                </button>
                <button
                    className={`tool-btn ${viewSettings.showGrid ? 'active' : ''}`}
                    onClick={() => setViewSettings(s => ({ ...s, showGrid: !s.showGrid }))}
                    title="Toggle Grid"
                >
                    📏 Grid
                </button>
                <button
                    className={`tool-btn ${viewSettings.showAxes ? 'active' : ''}`}
                    onClick={() => setViewSettings(s => ({ ...s, showAxes: !s.showAxes }))}
                    title="Toggle Axes"
                >
                    📍 Axes
                </button>
            </div>

            {/* Inspect Panel (only when data is shown) */}
            {inspectData.visible && (
                <div className="inspect-panel">
                    <div className="inspect-header">
                        <span className="inspect-title">{inspectData.region.toUpperCase()}</span>
                        <button onClick={() => setInspectData({ ...inspectData, visible: false })}>×</button>
                    </div>
                    <div className="inspect-specs">
                        {inspectData.specs.map((spec, i) => (
                            <div key={i} className="inspect-row">
                                <span className="spec-label">{spec.label}</span>
                                <span className="spec-value">{spec.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Hints */}
            <div className="viewer-hints">
                <span>🖱️ Drag to rotate</span>
                <span>🔍 Scroll to zoom</span>
                {inspectMode && <span className="active">👆 Click parts to inspect</span>}
                <span className="mode-hint">Mode: {viewSettings.mode.toUpperCase()}</span>
            </div>

            <style jsx>{`
        .viewer-container {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 400px;
          background: linear-gradient(180deg, #0c0c14 0%, #13131f 50%, #0c0c14 100%);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .viewer-toolbar {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .divider {
            width: 1px;
            height: 24px;
            background: rgba(255,255,255,0.1);
            margin: 0 4px;
        }
        
        .tool-btn {
          padding: 8px 14px;
          background: rgba(12, 12, 20, 0.9);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .tool-btn:hover {
          background: rgba(124, 58, 237, 0.2);
          border-color: rgba(124, 58, 237, 0.4);
        }

        .tool-btn.active {
          background: rgba(124, 58, 237, 0.3);
          border-color: var(--accent-primary);
          color: #fff;
        }

        .inspect-panel {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 220px;
          background: rgba(12, 12, 20, 0.95);
          border: 1px solid rgba(124, 58, 237, 0.4);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }

        .inspect-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: rgba(124, 58, 237, 0.15);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .inspect-title {
          font-size: 11px;
          font-weight: 600;
          color: var(--accent-primary);
          letter-spacing: 1px;
        }

        .inspect-header button {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 18px;
          cursor: pointer;
          line-height: 1;
        }

        .inspect-specs {
          padding: 12px 14px;
        }

        .inspect-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 12px;
        }

        .spec-label {
          color: var(--text-muted);
        }

        .spec-value {
          color: var(--text-primary);
          font-weight: 500;
        }

        .viewer-hints {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 16px;
          padding: 8px 16px;
          background: rgba(12, 12, 20, 0.8);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        .viewer-hints .active {
          color: var(--accent-primary);
        }

        .mode-hint {
            color: #d97706;
            font-weight: 600;
        }
      `}</style>
        </div>
    );
}
