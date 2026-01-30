'use client';

// 3D Viewer v0.9 (SRS F7)
// High-contrast technical visualization environment.

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Grid, Environment, ContactShadows } from '@react-three/drei';
import { Suspense, useState } from 'react';
import { useSelectedVariant, useAppStore } from '@/store/appStore';
import ParametricMesh from './ParametricMesh';
import EngineeringDimensions from './EngineeringDimensions';
import * as THREE from 'three';

interface InspectData {
    visible: boolean;
    region: string;
    specs: { label: string; value: string }[];
}

function Scene({ inspectMode, onInspect }: { inspectMode: boolean; onInspect: (data: InspectData) => void }) {
    const variant = useSelectedVariant();
    const intent = useAppStore(state => state.designIntent);

    const handleClick = (region: string) => {
        if (!inspectMode || !variant) return;

        let specs: { label: string; value: string }[] = [];
        Object.entries(variant.parameters).forEach(([key, val]) => {
            specs.push({ label: key.replace(/_/g, ' ').toUpperCase(), value: val.toString() });
        });

        onInspect({ visible: true, region, specs });
    };

    if (!variant || !intent) {
        return (
            <Html center>
                <div className="empty-msg">DEFINE DESIGN INTENT TO INITIALIZE VISUALIZATION</div>
                <style jsx>{`
                    .empty-msg {
                        color: #444;
                        fontFamily: var(--font-mono);
                        fontSize: 11px;
                        whiteSpace: nowrap;
                        letterSpacing: 1px;
                    }
                `}</style>
            </Html>
        );
    }

    // Calc BBox for dimensions
    // Note: We need the actual geometry to get the bbox.
    // ParametricMesh generates it internally.
    // We can estimate it from variant parameters or pass a callback ref?
    // For God Mode, let's just use the `dimensions` from metadata if available, or visual estimation.
    // Actually, ParametricMesh should ideally expose the mesh ref.
    // But passing refs through Suspense/Custom components is tricky without forwardRef.
    // Let's implement a simpler "Ideal" bounding box based on intent parameters for the visual.

    const bbox = new THREE.Box3();
    const l = (parseFloat(variant.parameters.length_mm?.toString() || '100') / 100) / 2;
    const w = (parseFloat(variant.parameters.width_mm?.toString() || '100') / 100) / 2;
    const h = (parseFloat(variant.parameters.height_mm?.toString() || '20') / 100) / 2;

    // Check if Cylinder
    const isCyl = variant.parameters.primitive_type === 'cylinder' || variant.parameters.primitive_type === 'bolt';
    if (isCyl) {
        const r = (parseFloat(variant.parameters.diameter_mm?.toString() || '50') / 100) / 2;
        bbox.min.set(-r, 0, -r);
        bbox.max.set(r, h*2, r);
    } else {
        bbox.min.set(-l, 0, -w);
        bbox.max.set(l, h*2, w);
    }

    return (
        <>
            <ParametricMesh
                variant={variant}
                intent={intent}
                inspectMode={inspectMode}
                onClick={handleClick}
            />
            <EngineeringDimensions visible={inspectMode} bbox={bbox} />
        </>
    );
}

export default function Viewer3D() {
    const [inspectMode, setInspectMode] = useState(false);
    const [inspectData, setInspectData] = useState<InspectData>({ visible: false, region: '', specs: [] });

    return (
        <div className="viewer-container">
            <Canvas
                shadows
                gl={{ antialias: true, alpha: true }}
                style={{ background: '#0a0a0a' }}
            >
                <PerspectiveCamera makeDefault position={[2, 2, 2]} fov={50} />

                {/* Enhanced OrbitControls for better navigation */}
                <OrbitControls
                    enableDamping
                    dampingFactor={0.07}
                    rotateSpeed={0.8}
                    zoomSpeed={1.0}
                    panSpeed={0.8}
                    minDistance={0.5}
                    maxDistance={8}
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 1.8}
                    makeDefault
                />

                {/* ===== PREMIUM STUDIO LIGHTING (LOCAL FALLBACK) ===== */}
                {/* ===== PREMIUM STUDIO LIGHTING (LOCAL) ===== */}
                <ambientLight intensity={0.4} />
                <spotLight
                    position={[10, 10, 10]}
                    angle={0.2}
                    penumbra={1}
                    intensity={2}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />
                <directionalLight position={[-5, 5, 5]} intensity={1} />
                <pointLight position={[5, -5, -5]} intensity={0.5} color="#445" />
                <pointLight position={[0, 10, 0]} intensity={0.5} />


                {/* ===== VISUAL GROUNDING ===== */}
                <ContactShadows
                    position={[0, 0, 0]}
                    opacity={0.4}
                    scale={10}
                    blur={2.5}
                    far={4}
                    resolution={512}
                    color="#000000"
                />

                {/* Polished Scene Grid */}
                <Grid
                    args={[15, 15]}
                    cellSize={0.1}
                    cellThickness={0.5}
                    cellColor="#1a1a1a"
                    sectionSize={0.5}
                    sectionThickness={1}
                    sectionColor="#2a2a2a"
                    fadeDistance={10}
                    fadeStrength={1}
                    position={[0, -0.001, 0]}
                    infiniteGrid
                />

                <Suspense fallback={null}>
                    <Scene inspectMode={inspectMode} onInspect={setInspectData} />
                </Suspense>

            </Canvas>

            {/* Technical Tools */}
            <div className="viewer-toolbar">
                <button
                    className={`tool-btn ${inspectMode ? 'active' : ''}`}
                    onClick={() => {
                        setInspectMode(!inspectMode);
                        setInspectData({ visible: false, region: '', specs: [] });
                    }}
                >
                    {inspectMode ? 'EXIT INSPECTION' : 'INSPECT PARAMETERS'}
                </button>
            </div>

            {/* Camera Controls Legend */}
            <div className="camera-legend">
                <div className="legend-title">CAMERA CONTROLS</div>
                <div className="legend-item">
                    <span className="key">LEFT DRAG</span>
                    <span className="action">Rotate</span>
                </div>
                <div className="legend-item">
                    <span className="key">RIGHT DRAG</span>
                    <span className="action">Pan</span>
                </div>
                <div className="legend-item">
                    <span className="key">SCROLL</span>
                    <span className="action">Zoom</span>
                </div>
            </div>

            {/* Inspect Overlay */}
            {inspectData.visible && (
                <div className="inspect-overlay">
                    <div className="inspect-header">
                        <span>{inspectData.region.toUpperCase()} DATA</span>
                        <button onClick={() => setInspectData({ ...inspectData, visible: false })}>CLOSE</button>
                    </div>
                    <div className="inspect-body">
                        {inspectData.specs.map((s, i) => (
                            <div key={i} className="row">
                                <span className="lbl">{s.label}</span>
                                <span className="val">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
        .viewer-container {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000;
        }
        
        .viewer-toolbar {
          position: absolute;
          bottom: 24px;
          right: 24px;
          display: flex;
          gap: 12px;
        }
        
        .tool-btn {
          padding: 8px 16px;
          background: #000;
          border: 1px solid #333;
          color: #888;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }
        
        .tool-btn:hover { border-color: #fff; color: #fff; }
        .tool-btn.active { border-color: #fff; color: #000; background: #fff; }

        .inspect-overlay {
          position: absolute;
          top: 24px;
          right: 24px;
          width: 260px;
          background: #000;
          border: 1px solid #fff;
          z-index: 50;
        }

        .inspect-header {
          padding: 8px 12px;
          background: #fff;
          color: #000;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          font-weight: 800;
        }

        .inspect-header button {
          background: none;
          border: none;
          color: #000;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .inspect-body {
          padding: 12px;
          max-height: 300px;
          overflow-y: auto;
        }

        .row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 6px;
          font-family: var(--font-mono);
        }

        .lbl { color: #666; }
        .val { color: #fff; }

        .camera-legend {
          position: absolute;
          bottom: 24px;
          left: 24px;
          background: rgba(0,0,0,0.8);
          border: 1px solid #333;
          padding: 12px;
          font-family: var(--font-mono);
        }

        .legend-title {
          font-size: 9px;
          color: #666;
          margin-bottom: 8px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .legend-item {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 10px;
          margin-bottom: 4px;
        }

        .legend-item .key {
          color: #888;
          font-weight: 700;
        }

        .legend-item .action {
          color: #fff;
        }
      `}</style>
        </div>
    );
}
