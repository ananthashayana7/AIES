// Material Suitability Rule Deck
// SRS F4: Material selection constraints

import { Rule } from '../schemas/ruleEngine';

export const MATERIAL_RULES: Rule[] = [
    {
        id: 'material_high_temp_limit',
        title: 'High Temperature Material Requirement',
        category: 'material',
        severity: 'blocker',
        condition: {
            expression: 'operating_temp_c > 200 && material_requires_high_temp'
        },
        rationale: 'Operating temperatures > 200°C require materials with elevated temperature properties (titanium, ceramics, or high-temp alloys).',
    },
    {
        id: 'material_corrosion_resistance',
        title: 'Corrosive Environment Material Check',
        category: 'material',
        severity: 'warn',
        condition: {
            expression: 'environment === "corrosive" && !material_is_corrosion_resistant'
        },
        rationale: 'Corrosive environments require stainless steel, titanium, or coated materials to prevent degradation.',
    },
    {
        id: 'material_cost_vs_performance',
        title: 'Cost-Effective Material Selection',
        category: 'material',
        severity: 'info',
        condition: {
            expression: 'material_cost_index > 5 && safety_factor > 5'
        },
        rationale: 'Over-designed parts (SF > 5) with expensive materials may be optimized by using lower-cost alternatives.',
    }
];
