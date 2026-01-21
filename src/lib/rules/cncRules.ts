// CNC Manufacturing Rule Deck
// SRS F4: Deterministic checks for CNC machining constraints

import { Rule } from '../schemas/ruleEngine';

export const CNC_RULES: Rule[] = [
    {
        id: 'cnc_min_fillet',
        title: 'Minimum Fillet Radius for CNC',
        category: 'manufacturing',
        severity: 'blocker',
        condition: {
            parameter: 'fillet_radius_mm',
            operator: 'gte',
            value: 2.0
        },
        rationale: 'CNC tooling limitations: minimum tool radius is 2mm for standard end mills. Smaller radii require specialized micro-tools and increase cost.',
        citation: 'Internal CNC Standard v2.1'
    },
    {
        id: 'cnc_min_wall_thickness',
        title: 'Minimum Wall Thickness',
        category: 'manufacturing',
        severity: 'blocker',
        condition: {
            parameter: 'thickness_mm',
            operator: 'gte',
            value: 1.5
        },
        rationale: 'Walls thinner than 1.5mm are prone to vibration, deflection, and tool chatter during machining.',
        citation: 'ISO 2768-m General Tolerances'
    },
    {
        id: 'cnc_hole_spacing',
        title: 'Minimum Hole Edge Distance',
        category: 'manufacturing',
        severity: 'warn',
        condition: {
            expression: 'hole_edge_distance_mm >= hole_dia_mm * 1.5'
        },
        rationale: 'Holes too close to edges risk break-out. Recommended: edge distance ≥ 1.5× hole diameter.',
        citation: 'ASME Y14.5 Dimensioning Standard'
    },
    {
        id: 'cnc_aspect_ratio',
        title: 'Maximum Hole Depth-to-Diameter Ratio',
        category: 'manufacturing',
        severity: 'warn',
        condition: {
            expression: 'hole_depth_mm / hole_dia_mm <= 10'
        },
        rationale: 'Deep holes (depth > 10× diameter) require specialized tooling (gun drills) and increase cycle time.',
    },
    {
        id: 'cnc_sharp_corners',
        title: 'Avoid Sharp Internal Corners',
        category: 'manufacturing',
        severity: 'info',
        condition: {
            expression: 'internal_corner_radius_mm > 0'
        },
        rationale: 'Sharp internal corners (0 radius) are impossible to machine with rotating tools. Always specify a fillet radius.',
    }
];
