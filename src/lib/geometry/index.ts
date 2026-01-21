// Geometry Generator Index - Main entry point
export { BaseGenerator } from './generators/BaseGenerator';
export { LBendGenerator } from './generators/LBendGenerator';
export { BaseplateGenerator } from './generators/BaseplateGenerator';
export { detectShapeType, normalizeGeometrySpec } from './shapeDetector';

export type { GeometrySpec, GeneratedGeometry } from './generators/BaseGenerator';
