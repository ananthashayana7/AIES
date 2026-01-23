// Shape Type Detector - Auto-detect geometry type from JSON structure
export function detectShapeType(json: any): string {
    // 1. Explicit Type/Profile Check (Highest Priority)
    const explicitType = (json.type || json.profile || json.parameters?.profile || '').toLowerCase();

    // L-Bend / Bracket
    if (explicitType.includes('l-bend') || explicitType.includes('bracket') || explicitType.includes('angle')) return 'l-bend';

    // Structural Profiles
    if (explicitType.includes('i-beam') || explicitType.includes('i beam')) return 'i-beam';
    if (explicitType.includes('t-') || explicitType.includes('t profile') || explicitType.includes('t-slot')) return 't-profile';
    if (explicitType.includes('c-channel') || explicitType.includes('channel')) return 'c-channel';

    // Cylindrical
    if (explicitType.includes('cylinder') || explicitType.includes('bottle') || explicitType.includes('rod') || explicitType.includes('tube')) return 'cylinder';

    // Lathe/Revolved
    if (explicitType.includes('vase')) return 'vase';
    if (explicitType.includes('bowl')) return 'bowl';
    if (explicitType.includes('cup')) return 'cup';

    // Jewelry
    if (explicitType.includes('ring') || explicitType.includes('jewelry') || explicitType.includes('band')) return 'ring';

    // Spinner (fidget spinner legacy)
    if (explicitType.includes('spinner')) return 'spinner';

    // Phase 8: Advanced Geometry
    // Gears
    if (explicitType.includes('gear') || explicitType.includes('cog') || explicitType.includes('sprocket')) return 'gear';

    // Enclosures
    if (explicitType.includes('enclosure') || explicitType.includes('case') || explicitType.includes('housing')) return 'enclosure';

    // Fasteners/Threads
    if (explicitType.includes('bolt') || explicitType.includes('screw') || explicitType.includes('nut') ||
        explicitType.includes('stud') || explicitType.includes('fastener')) return 'thread';

    // Pipes/Tubes
    if (explicitType.includes('pipe') || explicitType.includes('duct') || explicitType.includes('hose') ||
        explicitType.includes('conduit')) return 'pipe';

    // Box/Enclosure (legacy)
    if (explicitType.includes('box')) return 'enclosure';

    // Baseplate (plate, slab, etc)
    if (explicitType.includes('baseplate') || explicitType.includes('plate') || explicitType.includes('slab')) return 'baseplate';

    // 2. Geometry/Parameter Key Check (Fallback)
    const keys = { ...json.geometry, ...json.parameters };

    // Check for L-bend indicators
    if (keys.legA || keys.legB || keys.bendAngle || keys.bend_radius || keys.angle) {
        return 'l-bend';
    }

    // Check for cylindrical indicators
    if (keys.diameter_mm || keys.radius_mm) {
        if (keys.height_mm && keys.height_mm > keys.diameter_mm * 1.5) {
            return 'cylinder';
        }
    }

    // Check for ring indicators
    if (keys.ring_size || keys.band_width) {
        return 'ring';
    }

    // Check for spinner/fidget indicators
    if (keys.bearingType || keys.spinTime || (json.productName || '').toLowerCase().includes('spinner')) {
        return 'spinner';
    }

    // Default to baseplate for simple rectangular parts
    return 'baseplate';
}

export function normalizeGeometrySpec(json: any): any {
    // Merge parameters into geometry so generators have a single source of truth
    const geometry = { ...(json.geometry || {}), ...(json.parameters || {}) };

    return {
        type: detectShapeType(json),
        metadata: json.metadata || { partNumber: json.part_id || json.productName || 'CUSTOM-001' },
        geometry: geometry, // Consolidated geometry/params
        parameters: json.parameters || {},
        material: json.material || json.materials || 'Aluminum 6061-T6',
        features: json.features || json.geometry?.features || {},
        ...json
    };
}
