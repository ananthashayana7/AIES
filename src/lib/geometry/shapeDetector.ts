// Shape Type Detector - Auto-detect geometry type from JSON structure
export function detectShapeType(json: any): string {
    // Check for L-bend indicators (highest priority)
    if (json.geometry) {
        const geo = json.geometry;
        if (geo.legA || geo.legB || geo.bendAngle) {
            return 'l-bend';
        }
    }

    // Check for spinner/cylindrical indicators
    if (json.bearingType || json.spinTime || json.productName?.toLowerCase().includes('spinner')) {
        return 'spinner';
    }

    // Check for bracket indicators
    if (json.type === 'bracket' || json.mountingHoles) {
        return 'bracket';
    }

    // Check for box/enclosure
    if (json.type === 'enclosure' || json.type === 'box') {
        return 'box';
    }

    // Default to baseplate for simple rectangular parts
    return 'baseplate';
}

export function normalizeGeometrySpec(json: any): any {
    // Normalize various JSON formats to consistent structure
    return {
        type: detectShapeType(json),
        metadata: json.metadata || { partNumber: json.part_id || json.productName || 'CUSTOM-001' },
        geometry: json.geometry || {},
        parameters: json.parameters || {},
        material: json.material || json.materials || 'Aluminum 6061-T6',
        features: json.features || json.geometry?.features || {},
        ...json
    };
}
