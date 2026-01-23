
import * as THREE from 'three';
import { DesignIntent } from '../schemas/designIntent';
import { GeneratedVariant } from '../variants/variantGenerator';

export class ExportManager {
    /**
     * Downloads the current Geometry as an ASCII STL file.
     * @param mesh The THREE.Mesh or THREE.Group to export
     * @param filename Desired filename
     */
    static downloadSTL(mesh: THREE.Object3D, filename: string) {
        const stlString = this.generateSTL(mesh);
        this.triggerDownload(stlString, filename + '.stl', 'text/plain');
    }

    /**
     * Downloads the Design Intent and Variant parameters as JSON.
     * @param intent The design intent
     * @param variant The generated variant
     * @param filename Desired filename
     */
    static downloadJSON(intent: DesignIntent, variant: GeneratedVariant, filename: string) {
        const data = JSON.stringify({
            metadata: {
                exportedAt: new Date().toISOString(),
                generator: "AIES_Local_Engine_v1"
            },
            intent,
            variant
        }, null, 2);
        this.triggerDownload(data, filename + '.json', 'application/json');
    }

    private static triggerDownload(content: string, filename: string, mimeType: string) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Simple ASCII STL Generator
    private static generateSTL(root: THREE.Object3D): string {
        let output = 'solid exported\n';

        root.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const geometry = child.geometry;
                const matrixWorld = child.matrixWorld;

                if (geometry.isBufferGeometry) {
                    const pos = geometry.getAttribute('position');
                    // Check if indexed
                    const index = geometry.getIndex();

                    const vA = new THREE.Vector3();
                    const vB = new THREE.Vector3();
                    const vC = new THREE.Vector3();
                    const normal = new THREE.Vector3();

                    // Helper to process triangle
                    const processTriangle = (a: number, b: number, c: number) => {
                        vA.fromBufferAttribute(pos, a).applyMatrix4(matrixWorld);
                        vB.fromBufferAttribute(pos, b).applyMatrix4(matrixWorld);
                        vC.fromBufferAttribute(pos, c).applyMatrix4(matrixWorld);

                        // Compute face normal
                        const cb = new THREE.Vector3().subVectors(vC, vB);
                        const ab = new THREE.Vector3().subVectors(vA, vB);
                        cb.cross(ab).normalize();

                        output += `facet normal ${cb.x} ${cb.y} ${cb.z}\n`;
                        output += 'outer loop\n';
                        output += `vertex ${vA.x} ${vA.y} ${vA.z}\n`;
                        output += `vertex ${vB.x} ${vB.y} ${vB.z}\n`;
                        output += `vertex ${vC.x} ${vC.y} ${vC.z}\n`;
                        output += 'endloop\n';
                        output += 'endfacet\n';
                    };

                    if (index) {
                        for (let i = 0; i < index.count; i += 3) {
                            processTriangle(index.getX(i), index.getY(i), index.getZ(i));
                        }
                    } else {
                        for (let i = 0; i < pos.count; i += 3) {
                            processTriangle(i, i + 1, i + 2);
                        }
                    }
                }
            }
        });

        output += 'endsolid exported\n';
        return output;
    }
}
