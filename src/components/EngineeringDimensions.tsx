
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
    visible: boolean;
    bbox: THREE.Box3;
}

export default function EngineeringDimensions({ visible, bbox }: Props) {
    if (!visible || !bbox || bbox.isEmpty()) return null;

    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Offsets for dimension lines
    const offset = 0.5;

    // Helper to create a dimension line
    const DimLine = ({ start, end, label, axis }: { start: THREE.Vector3, end: THREE.Vector3, label: string, axis: 'x' | 'y' | 'z' }) => {
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

        return (
            <group>
                {/* Line */}
                <line>
                    <bufferGeometry>
                        <float32BufferAttribute
                            attach="attributes-position"
                            args={[new Float32Array([start.x, start.y, start.z, end.x, end.y, end.z]), 3]}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial color="#5599ff" opacity={0.6} transparent />
                </line>

                {/* End Ticks (Simplified) */}

                {/* Label */}
                <Html position={mid} center transform>
                    <div className="dim-label">
                        {label}
                        <style jsx>{`
                            .dim-label {
                                background: #000;
                                border: 1px solid #5599ff;
                                color: #5599ff;
                                padding: 2px 6px;
                                font-family: monospace;
                                font-size: 10px;
                                white-space: nowrap;
                            }
                        `}</style>
                    </div>
                </Html>
            </group>
        );
    };

    // Calculate measurement points based on BBox
    const min = bbox.min;
    const max = bbox.max;

    // Length (X) - Bottom Front
    const lenStart = new THREE.Vector3(min.x, min.y, max.z + offset);
    const lenEnd = new THREE.Vector3(max.x, min.y, max.z + offset);

    // Width (Z) - Right Bottom
    const widStart = new THREE.Vector3(max.x + offset, min.y, min.z);
    const widEnd = new THREE.Vector3(max.x + offset, min.y, max.z);

    // Height (Y) - Left Back
    const htStart = new THREE.Vector3(min.x - offset, min.y, min.z);
    const htEnd = new THREE.Vector3(min.x - offset, max.y, min.z);

    return (
        <group>
            <DimLine start={lenStart} end={lenEnd} label={`${(size.x * 100).toFixed(1)}mm`} axis="x" />
            <DimLine start={widStart} end={widEnd} label={`${(size.z * 100).toFixed(1)}mm`} axis="z" />
            <DimLine start={htStart} end={htEnd} label={`${(size.y * 100).toFixed(1)}mm`} axis="y" />
        </group>
    );
}
