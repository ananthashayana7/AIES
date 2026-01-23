// Geometry Generator Index - Main entry point
export { BaseGenerator } from './generators/BaseGenerator';
export { LBendGenerator } from './generators/LBendGenerator';
export { BaseplateGenerator } from './generators/BaseplateGenerator';
export { CylinderGenerator } from './generators/CylinderGenerator';
export { ProfileGenerator } from './generators/ProfileGenerator';
export { RevolveGenerator } from './generators/RevolveGenerator';
export { GemGenerator } from './generators/GemGenerator';
export { RingGenerator } from './generators/RingGenerator';

// Phase 8: Advanced Geometry
export { GearGenerator } from './generators/GearGenerator';
export { EnclosureGenerator } from './generators/EnclosureGenerator';
export { ThreadGenerator } from './generators/ThreadGenerator';
export { PipeGenerator } from './generators/PipeGenerator';

// Universal Generator (handles ANY shape)
export { UniversalGenerator } from './generators/UniversalGenerator';

export { detectShapeType, normalizeGeometrySpec } from './shapeDetector';

export type { GeometrySpec, GeneratedGeometry } from './generators/BaseGenerator';

