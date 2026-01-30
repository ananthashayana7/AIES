
// Mechanical Standards Library
// The "Engineer" Layer - Source of Truth for ISO/DIN/ANSI Standards

export interface ThreadSpec {
    designation: string; // e.g., "M10"
    pitch: number;       // mm
    majorDia: number;    // mm
    minorDia: number;    // mm (approx for modeling)
    tapDrill: number;    // mm
    hexHead: {
        widthAcrossFlats: number; // mm (s)
        height: number;           // mm (k)
    };
    socketHead: {
        diameter: number; // mm (dk)
        height: number;   // mm (k)
        socketSize: number; // mm (s)
        socketDepth: number; // mm (t)
    };
}

export interface BearingSpec {
    designation: string; // e.g., "608"
    innerDia: number;    // mm (d)
    outerDia: number;    // mm (D)
    width: number;       // mm (B)
    type: string;        // "Ball", "Roller", etc.
}

export interface NemaSpec {
    designation: string; // e.g., "NEMA 17"
    pilotDia: number;    // mm (centering boss)
    boltCircle: number;  // mm (diagonal spacing usually? No, NEMA is usually square spacing)
    boltSpacing: number; // mm (side length of square pattern)
    mountingHole: string; // e.g. "M3" or "M4" (clearance)
    shaftDia: number;    // mm
}

// ISO Metric Screw Threads (Coarse) - ISO 724 / DIN 13-1
// Head dimensions based on ISO 4014 (Hex) and ISO 4762 (Socket)
export const METRIC_THREADS: Record<string, ThreadSpec> = {
    'M2': {
        designation: 'M2', pitch: 0.4, majorDia: 2, minorDia: 1.567, tapDrill: 1.6,
        hexHead: { widthAcrossFlats: 4, height: 1.4 },
        socketHead: { diameter: 3.8, height: 2, socketSize: 1.5, socketDepth: 1 }
    },
    'M2.5': {
        designation: 'M2.5', pitch: 0.45, majorDia: 2.5, minorDia: 2.013, tapDrill: 2.05,
        hexHead: { widthAcrossFlats: 5, height: 1.7 },
        socketHead: { diameter: 4.5, height: 2.5, socketSize: 2, socketDepth: 1.1 }
    },
    'M3': {
        designation: 'M3', pitch: 0.5, majorDia: 3, minorDia: 2.459, tapDrill: 2.5,
        hexHead: { widthAcrossFlats: 5.5, height: 2 },
        socketHead: { diameter: 5.5, height: 3, socketSize: 2.5, socketDepth: 1.3 }
    },
    'M4': {
        designation: 'M4', pitch: 0.7, majorDia: 4, minorDia: 3.242, tapDrill: 3.3,
        hexHead: { widthAcrossFlats: 7, height: 2.8 },
        socketHead: { diameter: 7, height: 4, socketSize: 3, socketDepth: 2 }
    },
    'M5': {
        designation: 'M5', pitch: 0.8, majorDia: 5, minorDia: 4.134, tapDrill: 4.2,
        hexHead: { widthAcrossFlats: 8, height: 3.5 },
        socketHead: { diameter: 8.5, height: 5, socketSize: 4, socketDepth: 2.5 }
    },
    'M6': {
        designation: 'M6', pitch: 1.0, majorDia: 6, minorDia: 4.917, tapDrill: 5,
        hexHead: { widthAcrossFlats: 10, height: 4 },
        socketHead: { diameter: 10, height: 6, socketSize: 5, socketDepth: 3 }
    },
    'M8': {
        designation: 'M8', pitch: 1.25, majorDia: 8, minorDia: 6.647, tapDrill: 6.8,
        hexHead: { widthAcrossFlats: 13, height: 5.3 },
        socketHead: { diameter: 13, height: 8, socketSize: 6, socketDepth: 4 }
    },
    'M10': {
        designation: 'M10', pitch: 1.5, majorDia: 10, minorDia: 8.376, tapDrill: 8.5,
        hexHead: { widthAcrossFlats: 17, height: 6.4 }, // ISO 4014 (DIN 931 is 17mm, old DIN was 17mm too usually but some variations exist, sticking to ISO 4014/4017 which is 16mm for M10? No, M10 is 16mm in ISO 4014, 17mm in DIN 933. Let's stick to user prompt "M10 -> Head is 17mm" which implies DIN)
        socketHead: { diameter: 16, height: 10, socketSize: 8, socketDepth: 5 }
    },
    'M12': {
        designation: 'M12', pitch: 1.75, majorDia: 12, minorDia: 10.106, tapDrill: 10.2,
        hexHead: { widthAcrossFlats: 19, height: 7.5 },
        socketHead: { diameter: 18, height: 12, socketSize: 10, socketDepth: 6 }
    },
    'M14': {
        designation: 'M14', pitch: 2.0, majorDia: 14, minorDia: 11.835, tapDrill: 12,
        hexHead: { widthAcrossFlats: 22, height: 8.8 },
        socketHead: { diameter: 21, height: 14, socketSize: 12, socketDepth: 7 }
    },
    'M16': {
        designation: 'M16', pitch: 2.0, majorDia: 16, minorDia: 13.835, tapDrill: 14,
        hexHead: { widthAcrossFlats: 24, height: 10 },
        socketHead: { diameter: 24, height: 16, socketSize: 14, socketDepth: 8 }
    },
    'M20': {
        designation: 'M20', pitch: 2.5, majorDia: 20, minorDia: 17.294, tapDrill: 17.5,
        hexHead: { widthAcrossFlats: 30, height: 12.5 },
        socketHead: { diameter: 30, height: 20, socketSize: 17, socketDepth: 10 }
    },
    'M24': {
        designation: 'M24', pitch: 3.0, majorDia: 24, minorDia: 20.752, tapDrill: 21,
        hexHead: { widthAcrossFlats: 36, height: 15 },
        socketHead: { diameter: 36, height: 24, socketSize: 19, socketDepth: 12 }
    }
};

// Common Metric Radial Ball Bearings - 6000 Series
export const BEARINGS: Record<string, BearingSpec> = {
    '608': { designation: '608', innerDia: 8, outerDia: 22, width: 7, type: 'Ball' },
    '623': { designation: '623', innerDia: 3, outerDia: 10, width: 4, type: 'Ball' },
    '624': { designation: '624', innerDia: 4, outerDia: 13, width: 5, type: 'Ball' },
    '625': { designation: '625', innerDia: 5, outerDia: 16, width: 5, type: 'Ball' },
    '626': { designation: '626', innerDia: 6, outerDia: 19, width: 6, type: 'Ball' },
    '6000': { designation: '6000', innerDia: 10, outerDia: 26, width: 8, type: 'Ball' },
    '6001': { designation: '6001', innerDia: 12, outerDia: 28, width: 8, type: 'Ball' },
    '6002': { designation: '6002', innerDia: 15, outerDia: 32, width: 9, type: 'Ball' },
    '6003': { designation: '6003', innerDia: 17, outerDia: 35, width: 10, type: 'Ball' },
    '6200': { designation: '6200', innerDia: 10, outerDia: 30, width: 9, type: 'Ball' },
    '6201': { designation: '6201', innerDia: 12, outerDia: 32, width: 10, type: 'Ball' },
    '6202': { designation: '6202', innerDia: 15, outerDia: 35, width: 11, type: 'Ball' },
    '6203': { designation: '6203', innerDia: 17, outerDia: 40, width: 12, type: 'Ball' }
};

// NEMA Stepper Motor Standards
export const NEMA_MOTORS: Record<string, NemaSpec> = {
    'NEMA 17': {
        designation: 'NEMA 17',
        boltSpacing: 31, // mm (43.2mm diagonal approx)
        boltCircle: 43.8, // not strictly used, we use spacing
        pilotDia: 22,
        mountingHole: 'M3',
        shaftDia: 5
    },
    'NEMA 23': {
        designation: 'NEMA 23',
        boltSpacing: 47.14,
        boltCircle: 66.6,
        pilotDia: 38.1,
        mountingHole: 'M5',
        shaftDia: 6.35
    },
    'NEMA 34': {
        designation: 'NEMA 34',
        boltSpacing: 69.6,
        boltCircle: 98.4,
        pilotDia: 73,
        mountingHole: 'M6',
        shaftDia: 14 // varies but usually 12-14
    }
};

export const MechanicalStandards = {
    // Get thread specification (handles "M10", "m10", "10", etc.)
    getThreadSpec: (size: string | number): ThreadSpec | null => {
        let key = '';
        if (typeof size === 'number') {
            key = `M${size}`;
        } else {
            // Clean string: remove spaces, lowercase
            const clean = size.toUpperCase().trim();
            if (clean.startsWith('M')) {
                key = clean;
            } else if (!isNaN(parseFloat(clean))) {
                key = `M${parseFloat(clean)}`;
            }
        }

        return METRIC_THREADS[key] || null;
    },

    // Get closest standard thread size
    getClosestThread: (diameter: number): ThreadSpec => {
        let closest = 'M6';
        let minDiff = Infinity;

        for (const key of Object.keys(METRIC_THREADS)) {
            const spec = METRIC_THREADS[key];
            const diff = Math.abs(spec.majorDia - diameter);
            if (diff < minDiff) {
                minDiff = diff;
                closest = key;
            }
        }
        return METRIC_THREADS[closest];
    },

    getBearing: (designation: string): BearingSpec | null => {
        return BEARINGS[designation] || null;
    },

    getMotorSpec: (designation: string): NemaSpec | null => {
        // Handle "NEMA 17", "Nema17", "17" if context implies motor
        const clean = designation.toUpperCase().replace('NEMA', '').trim();
        const key = `NEMA ${clean}`;
        return NEMA_MOTORS[key] || null;
    },

    BEARINGS,
    METRIC_THREADS,
    NEMA_MOTORS
};

export default MechanicalStandards;
