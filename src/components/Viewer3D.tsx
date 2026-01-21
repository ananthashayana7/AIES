'use client';

// 3D Viewer v0.9 (SRS F7)
// High-contrast technical visualization environment.

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Grid } from '@react-three/drei';
import { Suspense, useState } from 'react';
import { useSelectedVariant, useAppStore } from '@/store/appStore';
import ParametricMesh from './ParametricMesh';
import * as THREE from 'three';

interface InspectData {
    visible: boolean;
    region: string;
    specs: { label: string; value: string }[];
}

// Coordinate Axes and Part Dimension Annotations
function CoordinateAxes({ partDimensions }: { partDimensions?: { length: number; width: number; height: number } }) {
    const arrowLength = 0.8;

    // Default dimensions if not provided
    const dims = partDimensions || { length: 2, width: 2, height: 0.2 };

    return (
        <>
            {/* Simple Axes at Origin */}
            <group position={[0, 0, 0]}>
                <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), arrowLength, 0xff0000, 0.1, 0.08]} />
                <Html position={[arrowLength + 0.15, 0, 0]} center>
                    <span style={{ color: '#ff0000', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: '800' }}>X</span>
                </Html>

                <arrowHelper args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), arrowLength, 0x00ff00, 0.1, 0.08]} />
                <Html position={[0, arrowLength + 0.15, 0]} center>
                    <span style={{ color: '#00ff00', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: '800' }}>Y</span>
                </Html>

                <arrowHelper args={[new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), arrowLength, 0x0000ff, 0.1, 0.08]} />
                <Html position={[0, 0, arrowLength + 0.15]} center>
                    <span style={{ color: '#0000ff', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: '800' }}>Z</span>
                </Html>
            </group>

            {/* Part Dimension Annotations */}
            {partDimensions && (
                <group>
                    {/* Length dimension (X-axis) */}
                    <Html position={[dims.length / 2, -0.3, dims.width / 2 + 0.3]} center>
                        <div style={{
                            color: '#ffffff',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: 'rgba(0,0,0,0.7)',
                            padding: '4px 8px',
                            border: '1px solid #ff0000',
                            borderRadius: '2px',
                            whiteSpace: 'nowrap'
                        }}>
                            L: {(dims.length * 100).toFixed(0)}mm
                        </div>
                    </Html>

                    {/* Width dimension (Z-axis) */}
                    <Html position={[dims.length + 0.3, -0.3, dims.width / 2]} center>
                        <div style={{
                            color: '#ffffff',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: 'rgba(0,0,0,0.7)',
                            padding: '4px 8px',
                            border: '1px solid #0000ff',
                            borderRadius: '2px',
                            whiteSpace: 'nowrap'
                        }}>
                            W: {(dims.width * 100).toFixed(0)}mm
                        </div>
                    </Html>

                    {/* Height dimension (Y-axis) */}
                    <Html position={[dims.length + 0.3, dims.height / 2, -0.3]} center>
                        <div style={{
                            color: '#ffffff',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: 'rgba(0,0,0,0.7)',
                            padding: '4px 8px',
                            border: '1px solid #00ff00',
                            borderRadius: '2px',
                            whiteSpace: 'nowrap'
                        }}>
                            H: {(dims.height * 100).toFixed(0)}mm
                        </div>
                    </Html>
                </group>
            )}
        </>
    );
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

    // Extract part dimensions from variant parameters
    const length = parseFloat(variant.parameters['length_mm']?.toString() || '100') * 0.01;
    const width = parseFloat(variant.parameters['width_mm']?.toString() || '100') * 0.01;
    const height = parseFloat(variant.parameters['height_mm']?.toString() || variant.parameters['thickness_mm']?.toString() || '20') * 0.01;

    return (
        <>
            <CoordinateAxes partDimensions={{ length, width, height }} />
            <ParametricMesh
                variant={variant}
                intent={intent}
                inspectMode={inspectMode}
                onClick={handleClick}
            />
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
                    dampingFactor={0.05}
                    rotateSpeed={0.8}
                    zoomSpeed={1.2}
                    panSpeed={0.8}
                    minDistance={0.5}
                    maxDistance={10}
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI}
                />

                {/* Lighting */}
                <ambientLight intensity={0.4} />
                <directionalLight
                    position={[5, 5, 5]}
                    intensity={0.8}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />
                <directionalLight position={[-5, 3, -5]} intensity={0.3} />
                <pointLight position={[0, 3, 0]} intensity={0.3} />

                {/* Grid */}
                <Grid
                    args={[20, 20]}
                    cellSize={0.5}
                    cellThickness={0.5}
                    cellColor="#1a1a1a"
                    sectionSize={1}
                    sectionThickness={1}
                    sectionColor="#2a2a2a"
                    fadeDistance={15}
                    fadeStrength={1}
                    position={[0, -0.01, 0]}
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
