// Advanced NLP Design Parser v2.0
// Understands natural language with context awareness, synonyms, and semantic understanding

import MechanicalStandards from '../standards/mechanical';

interface ParsedDesign {
    primitiveType: string;
    dimensions: Record<string, number>;
    modifiers: string[];
    material: string;
    features: string[];
    profile: string;
    confidence: number;
    context: DesignContext;
    standardSpec?: string; // e.g. "M10", "608"
}

interface DesignContext {
    purpose?: string;           // What it's for: "for mounting", "to hold water"
    environment?: string;       // Where it's used: "outdoor", "underwater"
    sizeCategory?: string;      // Relative size: "small", "large", "standard"
    quantity?: number;          // How many
    load?: number;              // Load in Newtons
    aesthetics?: string[];      // "sleek", "industrial", "decorative"
    constraints?: string[];     // "lightweight", "durable", "cheap"
}

// ===== COMPREHENSIVE SHAPE VOCABULARY =====
// Primary shapes with all synonyms and related words
const SHAPE_LEXICON: Record<string, { primitive: string; priority: number }> = {
    // ===== BOX-LIKE (Priority 1 = generic) =====
    'box': { primitive: 'box', priority: 1 },
    'cube': { primitive: 'box', priority: 3 },
    'block': { primitive: 'box', priority: 2 },
    'plate': { primitive: 'box', priority: 3 },
    'slab': { primitive: 'box', priority: 2 },
    'tile': { primitive: 'box', priority: 3 },
    'brick': { primitive: 'box', priority: 3 },
    'panel': { primitive: 'box', priority: 2 },
    'sheet': { primitive: 'box', priority: 2 },
    'board': { primitive: 'box', priority: 2 },
    'plank': { primitive: 'box', priority: 2 },
    'bar': { primitive: 'box', priority: 2 },
    'beam': { primitive: 'box', priority: 2 },
    'rail': { primitive: 'box', priority: 2 },
    'strip': { primitive: 'box', priority: 2 },
    'rectangular': { primitive: 'box', priority: 3 },
    'square': { primitive: 'box', priority: 3 },
    'flat': { primitive: 'box', priority: 1 },
    'base': { primitive: 'box', priority: 1 },
    'platform': { primitive: 'box', priority: 2 },
    'stand': { primitive: 'box', priority: 2 },
    'mount': { primitive: 'box', priority: 1 },
    'bracket': { primitive: 'box', priority: 2 },
    'shelf': { primitive: 'box', priority: 2 },
    'tray': { primitive: 'box', priority: 2 },
    'pallet': { primitive: 'box', priority: 2 },
    'table': { primitive: 'box', priority: 2 },
    'desk': { primitive: 'box', priority: 2 },
    'countertop': { primitive: 'box', priority: 2 },
    'floor': { primitive: 'box', priority: 2 },
    'wall': { primitive: 'box', priority: 2 },
    'partition': { primitive: 'box', priority: 2 },
    'divider': { primitive: 'box', priority: 2 },

    // ===== ENCLOSURES (Priority 4 = specific) =====
    'enclosure': { primitive: 'enclosure', priority: 4 },
    'case': { primitive: 'enclosure', priority: 4 },
    'housing': { primitive: 'enclosure', priority: 4 },
    'cabinet': { primitive: 'enclosure', priority: 4 },
    'container': { primitive: 'enclosure', priority: 3 },
    'chest': { primitive: 'enclosure', priority: 3 },
    'crate': { primitive: 'enclosure', priority: 3 },
    'bin': { primitive: 'enclosure', priority: 3 },
    'drawer': { primitive: 'enclosure', priority: 3 },
    'locker': { primitive: 'enclosure', priority: 3 },
    'safe': { primitive: 'enclosure', priority: 3 },
    'vault': { primitive: 'enclosure', priority: 3 },
    'electronics box': { primitive: 'enclosure', priority: 5 },
    'junction box': { primitive: 'enclosure', priority: 5 },
    'battery box': { primitive: 'enclosure', priority: 5 },

    // ===== CYLINDRICAL (Priority 3) =====
    'cylinder': { primitive: 'cylinder', priority: 4 },
    'cylindrical': { primitive: 'cylinder', priority: 3 },
    'tube': { primitive: 'cylinder', priority: 4 },
    'pipe': { primitive: 'pipe', priority: 5 },
    'rod': { primitive: 'cylinder', priority: 4 },
    'shaft': { primitive: 'cylinder', priority: 4 },
    'axle': { primitive: 'cylinder', priority: 4 },
    'column': { primitive: 'cylinder', priority: 3 },
    'pillar': { primitive: 'cylinder', priority: 3 },
    'post': { primitive: 'cylinder', priority: 3 },
    'pole': { primitive: 'cylinder', priority: 3 },
    'peg': { primitive: 'cylinder', priority: 3 },
    'pin': { primitive: 'cylinder', priority: 3 },
    'dowel': { primitive: 'cylinder', priority: 4 },
    'roller': { primitive: 'cylinder', priority: 3 },
    'drum': { primitive: 'cylinder', priority: 3 },
    'barrel': { primitive: 'cylinder', priority: 3 },
    'can': { primitive: 'cylinder', priority: 3 },
    'bottle': { primitive: 'cylinder', priority: 4 },
    'jar': { primitive: 'cylinder', priority: 3 },
    'vial': { primitive: 'cylinder', priority: 3 },
    'tank': { primitive: 'cylinder', priority: 3 },
    'silo': { primitive: 'cylinder', priority: 3 },
    'piston': { primitive: 'cylinder', priority: 4 },
    'bushing': { primitive: 'cylinder', priority: 4 },
    'sleeve': { primitive: 'cylinder', priority: 3 },
    'hub': { primitive: 'cylinder', priority: 3 },
    'wheel': { primitive: 'cylinder', priority: 3 },
    'disc': { primitive: 'cylinder', priority: 3 },
    'disk': { primitive: 'cylinder', priority: 3 },
    'coin': { primitive: 'cylinder', priority: 3 },
    'button': { primitive: 'cylinder', priority: 3 },
    'knob': { primitive: 'cylinder', priority: 3 },
    'handle': { primitive: 'cylinder', priority: 2 },
    'round': { primitive: 'cylinder', priority: 2 },
    'circular': { primitive: 'cylinder', priority: 2 },

    // ===== SPHERICAL (Priority 4) =====
    'sphere': { primitive: 'sphere', priority: 5 },
    'spherical': { primitive: 'sphere', priority: 4 },
    'ball': { primitive: 'sphere', priority: 5 },
    'globe': { primitive: 'sphere', priority: 4 },
    'orb': { primitive: 'sphere', priority: 4 },
    'bead': { primitive: 'sphere', priority: 3 },
    'marble': { primitive: 'sphere', priority: 4 },
    'bubble': { primitive: 'sphere', priority: 3 },
    'dome': { primitive: 'sphere', priority: 4 },
    'hemisphere': { primitive: 'sphere', priority: 5 },
    'half sphere': { primitive: 'sphere', priority: 5 },
    'cap': { primitive: 'sphere', priority: 2 },

    // ===== CONICAL (Priority 4) =====
    'cone': { primitive: 'cone', priority: 5 },
    'conical': { primitive: 'cone', priority: 4 },
    'funnel': { primitive: 'cone', priority: 5 },
    'nozzle': { primitive: 'cone', priority: 4 },
    'spout': { primitive: 'cone', priority: 3 },
    'horn': { primitive: 'cone', priority: 3 },
    'spike': { primitive: 'cone', priority: 3 },
    'point': { primitive: 'cone', priority: 2 },
    'tip': { primitive: 'cone', priority: 2 },
    'tapered': { primitive: 'cone', priority: 3 },
    'tapering': { primitive: 'cone', priority: 3 },
    'pointed': { primitive: 'cone', priority: 2 },
    'pyramid': { primitive: 'cone', priority: 4 },

    // ===== TORUS / RING (Priority 4) =====
    'torus': { primitive: 'torus', priority: 5 },
    'toroidal': { primitive: 'torus', priority: 4 },
    'ring': { primitive: 'torus', priority: 4 },
    'donut': { primitive: 'torus', priority: 5 },

    // ===== SPECIAL (Priority 5) =====
    'spinner': { primitive: 'spinner', priority: 5 },
    'fidget spinner': { primitive: 'spinner', priority: 5 },
    'doughnut': { primitive: 'torus', priority: 5 },
    'washer': { primitive: 'torus', priority: 4 },
    'o-ring': { primitive: 'torus', priority: 5 },
    'gasket': { primitive: 'torus', priority: 4 },
    'tire': { primitive: 'torus', priority: 4 },
    'bagel': { primitive: 'torus', priority: 4 },
    'loop': { primitive: 'torus', priority: 2 },
    'hoop': { primitive: 'torus', priority: 3 },
    'band': { primitive: 'torus', priority: 2 },
    'collar': { primitive: 'torus', priority: 3 },

    // ===== WEDGE (Priority 4) =====
    'wedge': { primitive: 'wedge', priority: 5 },
    'ramp': { primitive: 'wedge', priority: 5 },
    'slope': { primitive: 'wedge', priority: 4 },
    'incline': { primitive: 'wedge', priority: 4 },
    'chock': { primitive: 'wedge', priority: 4 },
    'shim': { primitive: 'wedge', priority: 4 },
    'doorstop': { primitive: 'wedge', priority: 4 },
    'angled': { primitive: 'wedge', priority: 2 },
    'sloped': { primitive: 'wedge', priority: 3 },
    'inclined': { primitive: 'wedge', priority: 3 },

    // ===== PRISM (Priority 4) =====
    'prism': { primitive: 'prism', priority: 5 },
    'triangular': { primitive: 'prism', priority: 4 },
    'triangle': { primitive: 'prism', priority: 3 },
    'tent': { primitive: 'prism', priority: 3 },
    'roof': { primitive: 'prism', priority: 2 },
    'gable': { primitive: 'prism', priority: 3 },

    // ===== SPECIAL GEOMETRIES (Priority 5) =====
    'gear': { primitive: 'gear', priority: 5 },
    'cog': { primitive: 'gear', priority: 5 },
    'sprocket': { primitive: 'gear', priority: 5 },
    'pulley': { primitive: 'gear', priority: 4 },
    'bolt': { primitive: 'bolt', priority: 5 },
    'screw': { primitive: 'bolt', priority: 5 },
    'nut': { primitive: 'nut', priority: 5 },
    'fastener': { primitive: 'bolt', priority: 4 },
    'vase': { primitive: 'vase', priority: 5 },
    'bowl': { primitive: 'bowl', priority: 5 },
    'cup': { primitive: 'cup', priority: 4 },
    'mug': { primitive: 'cup', priority: 4 },
    'pot': { primitive: 'vase', priority: 3 },
    'planter': { primitive: 'vase', priority: 3 },
    'l-bend': { primitive: 'l-bend', priority: 5 },
    'angle bracket': { primitive: 'l-bend', priority: 5 },
    'corner': { primitive: 'l-bend', priority: 2 },
    'elbow': { primitive: 'l-bend', priority: 4 },
    'i-beam': { primitive: 'i-beam', priority: 5 },
    'h-beam': { primitive: 'i-beam', priority: 5 },
    'channel': { primitive: 'channel', priority: 4 },
    'c-channel': { primitive: 'channel', priority: 5 },
    'u-channel': { primitive: 'channel', priority: 5 },
};

// ===== MODIFIER VOCABULARY =====
const MODIFIER_LEXICON: Record<string, { modifier: string; category: string }> = {
    // Hollow modifiers
    'hollow': { modifier: 'hollow', category: 'structure' },
    'empty': { modifier: 'hollow', category: 'structure' },
    'shell': { modifier: 'hollow', category: 'structure' },
    'tubular': { modifier: 'hollow', category: 'structure' },
    'open': { modifier: 'hollow', category: 'structure' },
    'void': { modifier: 'hollow', category: 'structure' },
    'with cavity': { modifier: 'hollow', category: 'structure' },
    'hollowed out': { modifier: 'hollow', category: 'structure' },
    'thin-walled': { modifier: 'hollow', category: 'structure' },

    // Solid modifiers
    'solid': { modifier: 'solid', category: 'structure' },
    'filled': { modifier: 'solid', category: 'structure' },
    'dense': { modifier: 'solid', category: 'structure' },
    'massive': { modifier: 'solid', category: 'structure' },

    // Edge treatments
    'rounded': { modifier: 'rounded', category: 'edges' },
    'filleted': { modifier: 'rounded', category: 'edges' },
    'smooth': { modifier: 'rounded', category: 'edges' },
    'soft edges': { modifier: 'rounded', category: 'edges' },
    'curved edges': { modifier: 'rounded', category: 'edges' },
    'chamfered': { modifier: 'chamfered', category: 'edges' },
    'beveled': { modifier: 'chamfered', category: 'edges' },
    'angled edges': { modifier: 'chamfered', category: 'edges' },
    'sharp': { modifier: 'sharp', category: 'edges' },
    'crisp': { modifier: 'sharp', category: 'edges' },

    // Thread modifiers
    'threaded': { modifier: 'threaded', category: 'features' },
    'tapped': { modifier: 'threaded', category: 'features' },
    'with threads': { modifier: 'threaded', category: 'features' },

    // Slot/groove modifiers
    'slotted': { modifier: 'slotted', category: 'features' },
    'grooved': { modifier: 'grooved', category: 'features' },
    'channeled': { modifier: 'grooved', category: 'features' },

    // Structural modifiers
    'ribbed': { modifier: 'ribbed', category: 'structure' },
    'reinforced': { modifier: 'reinforced', category: 'structure' },
    'stiffened': { modifier: 'reinforced', category: 'structure' },
    'braced': { modifier: 'reinforced', category: 'structure' },

    // Perforation modifiers
    'perforated': { modifier: 'perforated', category: 'features' },
    'with holes': { modifier: 'holes', category: 'features' },
    'drilled': { modifier: 'holes', category: 'features' },
    'holed': { modifier: 'holes', category: 'features' },
    'porous': { modifier: 'perforated', category: 'features' },
    'vented': { modifier: 'perforated', category: 'features' },

    // Taper/shape modifiers
    'tapered': { modifier: 'tapered', category: 'shape' },
    'flared': { modifier: 'flared', category: 'shape' },
    'flanged': { modifier: 'flanged', category: 'shape' },
    'stepped': { modifier: 'stepped', category: 'shape' },
    'notched': { modifier: 'notched', category: 'features' },

    // Finish modifiers
    'polished': { modifier: 'polished', category: 'finish' },
    'brushed': { modifier: 'brushed', category: 'finish' },
    'matte': { modifier: 'matte', category: 'finish' },
    'textured': { modifier: 'textured', category: 'finish' },
    'knurled': { modifier: 'knurled', category: 'finish' },
};

// ===== MATERIAL VOCABULARY =====
const MATERIAL_LEXICON: Record<string, { material: string; density: number; category: string }> = {
    // Metals
    'aluminum': { material: 'Aluminum 6061-T6', density: 2.7, category: 'metal' },
    'aluminium': { material: 'Aluminum 6061-T6', density: 2.7, category: 'metal' },
    'alu': { material: 'Aluminum 6061-T6', density: 2.7, category: 'metal' },
    'steel': { material: 'Steel 4140 Alloy', density: 7.85, category: 'metal' },
    'stainless': { material: 'Stainless Steel 316', density: 8.0, category: 'metal' },
    'stainless steel': { material: 'Stainless Steel 316', density: 8.0, category: 'metal' },
    'iron': { material: 'Cast Iron', density: 7.2, category: 'metal' },
    'cast iron': { material: 'Cast Iron', density: 7.2, category: 'metal' },
    'titanium': { material: 'Titanium Ti-6Al-4V', density: 4.43, category: 'metal' },
    'ti': { material: 'Titanium Ti-6Al-4V', density: 4.43, category: 'metal' },
    'copper': { material: 'Copper C110', density: 8.96, category: 'metal' },
    'brass': { material: 'Brass 360', density: 8.5, category: 'metal' },
    'bronze': { material: 'Bronze', density: 8.8, category: 'metal' },
    'gold': { material: 'Gold 18K', density: 15.6, category: 'precious' },
    'silver': { material: 'Silver Sterling', density: 10.49, category: 'precious' },
    'platinum': { material: 'Platinum', density: 21.45, category: 'precious' },
    'zinc': { material: 'Zinc', density: 7.14, category: 'metal' },
    'lead': { material: 'Lead', density: 11.34, category: 'metal' },
    'magnesium': { material: 'Magnesium AZ31B', density: 1.77, category: 'metal' },
    'nickel': { material: 'Nickel', density: 8.9, category: 'metal' },
    'tungsten': { material: 'Tungsten', density: 19.25, category: 'metal' },
    'chrome': { material: 'Chrome Plated Steel', density: 7.85, category: 'metal' },
    'metal': { material: 'Steel 4140 Alloy', density: 7.85, category: 'metal' },
    'metallic': { material: 'Steel 4140 Alloy', density: 7.85, category: 'metal' },

    // Plastics
    'plastic': { material: 'ABS Plastic', density: 1.05, category: 'plastic' },
    'abs': { material: 'ABS Plastic', density: 1.05, category: 'plastic' },
    'pla': { material: 'PLA Plastic', density: 1.24, category: 'plastic' },
    'nylon': { material: 'Nylon PA66', density: 1.14, category: 'plastic' },
    'polyamide': { material: 'Nylon PA66', density: 1.14, category: 'plastic' },
    'polycarbonate': { material: 'Polycarbonate', density: 1.2, category: 'plastic' },
    'pc': { material: 'Polycarbonate', density: 1.2, category: 'plastic' },
    'acrylic': { material: 'Acrylic PMMA', density: 1.18, category: 'plastic' },
    'pmma': { material: 'Acrylic PMMA', density: 1.18, category: 'plastic' },
    'pvc': { material: 'PVC', density: 1.4, category: 'plastic' },
    'hdpe': { material: 'HDPE', density: 0.95, category: 'plastic' },
    'polyethylene': { material: 'HDPE', density: 0.95, category: 'plastic' },
    'polypropylene': { material: 'Polypropylene', density: 0.9, category: 'plastic' },
    'pp': { material: 'Polypropylene', density: 0.9, category: 'plastic' },
    'peek': { material: 'PEEK', density: 1.3, category: 'plastic' },
    'delrin': { material: 'Delrin (POM)', density: 1.41, category: 'plastic' },
    'teflon': { material: 'PTFE Teflon', density: 2.2, category: 'plastic' },
    'ptfe': { material: 'PTFE Teflon', density: 2.2, category: 'plastic' },
    'resin': { material: 'Resin', density: 1.1, category: 'plastic' },

    // Rubber/Elastomers
    'rubber': { material: 'Rubber EPDM', density: 1.2, category: 'elastomer' },
    'silicone': { material: 'Silicone', density: 1.1, category: 'elastomer' },
    'neoprene': { material: 'Neoprene', density: 1.23, category: 'elastomer' },
    'latex': { material: 'Latex Rubber', density: 0.95, category: 'elastomer' },
    'urethane': { material: 'Polyurethane', density: 1.2, category: 'elastomer' },
    'foam': { material: 'Foam', density: 0.05, category: 'elastomer' },

    // Composites
    'carbon fiber': { material: 'Carbon Fiber', density: 1.6, category: 'composite' },
    'carbon': { material: 'Carbon Fiber', density: 1.6, category: 'composite' },
    'fiberglass': { material: 'Fiberglass', density: 1.8, category: 'composite' },
    'kevlar': { material: 'Kevlar', density: 1.44, category: 'composite' },

    // Wood
    'wood': { material: 'Wood Oak', density: 0.7, category: 'wood' },
    'wooden': { material: 'Wood Oak', density: 0.7, category: 'wood' },
    'oak': { material: 'Wood Oak', density: 0.7, category: 'wood' },
    'pine': { material: 'Wood Pine', density: 0.5, category: 'wood' },
    'maple': { material: 'Wood Maple', density: 0.65, category: 'wood' },
    'walnut': { material: 'Wood Walnut', density: 0.64, category: 'wood' },
    'bamboo': { material: 'Bamboo', density: 0.4, category: 'wood' },
    'plywood': { material: 'Plywood', density: 0.6, category: 'wood' },
    'mdf': { material: 'MDF', density: 0.75, category: 'wood' },

    // Glass/Ceramic
    'glass': { material: 'Glass', density: 2.5, category: 'glass' },
    'ceramic': { material: 'Ceramic', density: 2.4, category: 'ceramic' },
    'porcelain': { material: 'Porcelain', density: 2.4, category: 'ceramic' },
    'quartz': { material: 'Quartz', density: 2.65, category: 'ceramic' },

    // Stone
    'stone': { material: 'Granite', density: 2.7, category: 'stone' },
    'granite': { material: 'Granite', density: 2.7, category: 'stone' },
    'marble': { material: 'Marble', density: 2.7, category: 'stone' },
    'concrete': { material: 'Concrete', density: 2.4, category: 'stone' },
};

// ===== SIZE VOCABULARY =====
const SIZE_MODIFIERS: Record<string, { multiplier: number; category: string }> = {
    'tiny': { multiplier: 0.25, category: 'size' },
    'miniature': { multiplier: 0.25, category: 'size' },
    'mini': { multiplier: 0.3, category: 'size' },
    'small': { multiplier: 0.5, category: 'size' },
    'little': { multiplier: 0.5, category: 'size' },
    'compact': { multiplier: 0.6, category: 'size' },
    'medium': { multiplier: 1.0, category: 'size' },
    'standard': { multiplier: 1.0, category: 'size' },
    'regular': { multiplier: 1.0, category: 'size' },
    'normal': { multiplier: 1.0, category: 'size' },
    'large': { multiplier: 1.5, category: 'size' },
    'big': { multiplier: 1.5, category: 'size' },
    'oversized': { multiplier: 2.0, category: 'size' },
    'huge': { multiplier: 2.0, category: 'size' },
    'giant': { multiplier: 2.5, category: 'size' },
    'massive': { multiplier: 3.0, category: 'size' },
    'thin': { multiplier: 0.5, category: 'thickness' },
    'thick': { multiplier: 2.0, category: 'thickness' },
    'slim': { multiplier: 0.4, category: 'thickness' },
    'wide': { multiplier: 1.5, category: 'width' },
    'narrow': { multiplier: 0.5, category: 'width' },
    'tall': { multiplier: 1.5, category: 'height' },
    'short': { multiplier: 0.5, category: 'height' },
    'long': { multiplier: 1.5, category: 'length' },
    'deep': { multiplier: 1.5, category: 'depth' },
    'shallow': { multiplier: 0.5, category: 'depth' },
};

// ===== CONTEXT KEYWORDS =====
const PURPOSE_KEYWORDS: Record<string, string> = {
    'mount': 'mounting', 'mounting': 'mounting', 'holder': 'holding', 'hold': 'holding',
    'support': 'structural', 'supporting': 'structural', 'bracket': 'mounting',
    'cover': 'protective', 'protect': 'protective', 'shield': 'protective', 'guard': 'protective',
    'store': 'storage', 'storage': 'storage', 'contain': 'containment', 'container': 'containment',
    'connect': 'connecting', 'connector': 'connecting', 'join': 'joining', 'joiner': 'joining',
    'display': 'display', 'show': 'display', 'stand': 'display',
    'grip': 'gripping', 'handle': 'gripping', 'knob': 'gripping',
    'seal': 'sealing', 'close': 'sealing', 'cap': 'sealing', 'plug': 'sealing',
    'flow': 'fluid', 'channel': 'fluid', 'pipe': 'fluid', 'duct': 'fluid',
    'spin': 'rotary', 'rotate': 'rotary', 'turn': 'rotary', 'gear': 'power-transmission',
    'fasten': 'fastening', 'secure': 'fastening', 'attach': 'fastening',
    'decorate': 'decorative', 'decorative': 'decorative', 'ornament': 'decorative',
};

const AESTHETIC_KEYWORDS: string[] = [
    'sleek', 'modern', 'minimalist', 'industrial', 'vintage', 'classic', 'elegant',
    'futuristic', 'organic', 'geometric', 'artistic', 'ornate', 'simple', 'clean',
    'professional', 'premium', 'luxury', 'rustic', 'contemporary', 'traditional',
];

const CONSTRAINT_KEYWORDS: Record<string, string> = {
    'lightweight': 'minimize weight', 'light': 'minimize weight', 'heavy': 'maximize weight',
    'strong': 'maximize strength', 'sturdy': 'maximize strength', 'rigid': 'maximize rigidity',
    'flexible': 'maximize flexibility', 'bendable': 'maximize flexibility',
    'cheap': 'minimize cost', 'affordable': 'minimize cost', 'economical': 'minimize cost',
    'expensive': 'premium materials', 'premium': 'premium materials',
    'durable': 'maximize durability', 'long-lasting': 'maximize durability',
    'waterproof': 'water resistance', 'watertight': 'water resistance',
    'heat-resistant': 'thermal resistance', 'fireproof': 'fire resistance',
    'corrosion-resistant': 'corrosion resistance', 'rust-proof': 'corrosion resistance',
    'food-safe': 'food grade', 'medical': 'medical grade',
    'precision': 'high precision', 'accurate': 'high precision', 'exact': 'high precision',
};

// ===== MAIN PARSER FUNCTION =====
export function parseDesignDescription(description: string): ParsedDesign {
    const lower = description.toLowerCase().trim();
    const words = tokenize(lower);

    // 1. Detect primitive type with priority
    const { primitive, profile, confidence } = detectPrimitive(lower, words);

    // 2. Detect material
    const material = detectMaterial(lower);

    // 3. Detect modifiers
    const modifiers = detectModifiers(lower);

    // 4. Extract dimensions with context
    const dimensions = extractDimensions(lower, primitive);

    // 5. Extract features
    const features = extractFeatures(lower);

    // 6. Extract context
    const context = extractContext(lower, words);

    // 7. Extract Load (Layer 4/5 Trigger)
    const load = extractLoad(lower);
    if (load) context.load = load;

    // 8. Detect Standards (Layer 2 Engineering)
    const standardSpec = detectStandard(lower, primitive, dimensions);

    // 9. Apply size modifiers
    applyContextualSizing(dimensions, lower, context);

    return {
        primitiveType: primitive,
        dimensions,
        modifiers,
        material,
        features,
        profile,
        confidence,
        context,
        standardSpec
    };
}

function detectStandard(text: string, primitive: string, dims: Record<string, number>): string | undefined {
    // Check for Metric Thread codes (e.g. "M10")
    const mCodeMatch = text.match(/\b(m\d+(?:\.\d+)?)\b/i);
    if (mCodeMatch) {
        const designation = mCodeMatch[1].toUpperCase();
        const spec = MechanicalStandards.getThreadSpec(designation);
        if (spec) {
            // Apply standard dimensions
            dims.diameter = spec.majorDia;
            dims.radius = spec.majorDia / 2;

            // If it's a bolt/screw, we can infer head dimensions too if needed
            // But ThreadGenerator handles that if we pass the spec string
            return designation;
        }
    }

    // Check for Bearing codes
    if (primitive === 'cylinder' || primitive.includes('bearing') || text.includes('bearing')) {
        for (const code of Object.keys(MechanicalStandards.BEARINGS || {})) {
            const bearingMatch = text.match(new RegExp(`\\b${code}\\b`, 'i'));
            if (bearingMatch) {
                const spec = MechanicalStandards.getBearing(code);
                if (spec) {
                    dims.diameter = spec.outerDia;
                    dims.radius = spec.outerDia / 2;
                    dims.height = spec.width;
                    dims.thickness = (spec.outerDia - spec.innerDia) / 2;
                    dims.hole_diameter = spec.innerDia;
                    return code;
                }
            }
        }
    }

    // Check for NEMA Motor Mounts
    // "Mounting bracket for NEMA 17", "NEMA 23 plate"
    const nemaMatch = text.match(/\b(nema\s*\d+)\b/i);
    if (nemaMatch) {
        const designation = nemaMatch[1].toUpperCase().replace(/\s+/, ' '); // "NEMA 17"
        const spec = MechanicalStandards.getMotorSpec(designation);
        if (spec) {
            // We don't set overall dimensions yet (that's the bracket size),
            // but we signal the standard.
            // We should add it to features so Generator picks it up.
            // The parser function returns `standardSpec`, but Features are separate.
            // We'll return it as standardSpec, and detection logic in `extractFeatures` should also pick it up.
            return designation;
        }
    }

    return undefined;
}

function tokenize(text: string): string[] {
    // Remove punctuation and split into words
    return text
        .replace(/[^\w\s-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0);
}

function detectPrimitive(text: string, words: string[]): { primitive: string; profile: string; confidence: number } {
    let bestMatch = { primitive: 'box', profile: 'Custom', priority: 0, confidence: 0.3 };

    // Check multi-word patterns first (higher priority)
    for (const [keyword, info] of Object.entries(SHAPE_LEXICON)) {
        if (keyword.includes(' ')) {
            if (text.includes(keyword)) {
                if (info.priority > bestMatch.priority) {
                    bestMatch = {
                        primitive: info.primitive,
                        profile: capitalize(keyword),
                        priority: info.priority,
                        confidence: Math.min(0.95, 0.6 + info.priority * 0.07)
                    };
                }
            }
        }
    }

    // Check single words
    for (const word of words) {
        const info = SHAPE_LEXICON[word];
        if (info && info.priority > bestMatch.priority) {
            bestMatch = {
                primitive: info.primitive,
                profile: capitalize(word),
                priority: info.priority,
                confidence: Math.min(0.95, 0.6 + info.priority * 0.07)
            };
        }
    }

    // Check for partial matches
    for (const [keyword, info] of Object.entries(SHAPE_LEXICON)) {
        if (!keyword.includes(' ') && text.includes(keyword) && info.priority > bestMatch.priority) {
            bestMatch = {
                primitive: info.primitive,
                profile: capitalize(keyword),
                priority: info.priority,
                confidence: Math.min(0.9, 0.5 + info.priority * 0.07)
            };
        }
    }

    return bestMatch;
}

function detectMaterial(text: string): string {
    // Check multi-word materials first
    for (const [keyword, info] of Object.entries(MATERIAL_LEXICON)) {
        if (keyword.includes(' ') && text.includes(keyword)) {
            return info.material;
        }
    }

    // Check single-word materials
    for (const [keyword, info] of Object.entries(MATERIAL_LEXICON)) {
        if (!keyword.includes(' ') && text.includes(keyword)) {
            return info.material;
        }
    }

    return 'Aluminum 6061-T6'; // Default
}

function detectModifiers(text: string): string[] {
    const modifiers: string[] = [];
    const seenCategories = new Set<string>();

    // Check multi-word modifiers first
    for (const [keyword, info] of Object.entries(MODIFIER_LEXICON)) {
        if (keyword.includes(' ') && text.includes(keyword)) {
            if (!seenCategories.has(info.category + info.modifier)) {
                modifiers.push(info.modifier);
                seenCategories.add(info.category + info.modifier);
            }
        }
    }

    // Check single-word modifiers
    for (const [keyword, info] of Object.entries(MODIFIER_LEXICON)) {
        if (!keyword.includes(' ') && text.includes(keyword)) {
            if (!seenCategories.has(info.category + info.modifier)) {
                modifiers.push(info.modifier);
                seenCategories.add(info.category + info.modifier);
            }
        }
    }

    return modifiers;
}

function extractDimensions(text: string, primitive: string): Record<string, number> {
    const dims: Record<string, number> = {};

    // Pattern: "100x50x10mm" or "100 x 50 x 10 mm" or "100×50×10"
    const xPattern = /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:[x×]\s*(\d+(?:\.\d+)?))?\s*(mm|cm|m|inch|in|")?/i;
    const xMatch = text.match(xPattern);
    if (xMatch) {
        dims.length = parseFloat(xMatch[1]);
        dims.width = parseFloat(xMatch[2]);
        if (xMatch[3]) dims.height = parseFloat(xMatch[3]);

        // Apply unit conversion if needed
        if (xMatch[4]) {
            const unit = xMatch[4].toLowerCase();
            const multiplier = unit === 'cm' ? 10 : unit === 'm' ? 1000 : unit.includes('in') || unit === '"' ? 25.4 : 1;
            dims.length *= multiplier;
            dims.width *= multiplier;
            if (dims.height) dims.height *= multiplier;
        }
    }

    // Named dimension patterns
    const patterns: Array<{ pattern: RegExp; dimension: string }> = [
        { pattern: /(\d+(?:\.\d+)?)\s*(mm|cm)?\s*(long|length)/i, dimension: 'length' },
        { pattern: /length[:\s=]*(\d+(?:\.\d+)?)\s*(mm|cm)?/i, dimension: 'length' },
        { pattern: /(\d+(?:\.\d+)?)\s*(mm|cm)?\s*(wide|width)/i, dimension: 'width' },
        { pattern: /width[:\s=]*(\d+(?:\.\d+)?)\s*(mm|cm)?/i, dimension: 'width' },
        { pattern: /(\d+(?:\.\d+)?)\s*(mm|cm)?\s*(height|tall|high)/i, dimension: 'height' },
        { pattern: /height[:\s=]*(\d+(?:\.\d+)?)\s*(mm|cm)?/i, dimension: 'height' },
        { pattern: /(\d+(?:\.\d+)?)\s*(mm|cm)?\s*(diameter|dia)/i, dimension: 'diameter' },
        { pattern: /(diameter|dia)[:\s=]*(\d+(?:\.\d+)?)\s*(mm|cm)?/i, dimension: 'diameter' },
        { pattern: /(\d+(?:\.\d+)?)\s*(mm|cm)?\s*radius/i, dimension: 'radius' },
        { pattern: /radius[:\s=]*(\d+(?:\.\d+)?)\s*(mm|cm)?/i, dimension: 'radius' },
        { pattern: /(\d+(?:\.\d+)?)\s*(mm|cm)?\s*(thick|thickness|wall)/i, dimension: 'thickness' },
        { pattern: /(thickness|wall)[:\s=]*(\d+(?:\.\d+)?)\s*(mm|cm)?/i, dimension: 'thickness' },
        { pattern: /(\d+(?:\.\d+)?)\s*(mm|cm)?\s*(depth|deep)/i, dimension: 'depth' },
        { pattern: /depth[:\s=]*(\d+(?:\.\d+)?)\s*(mm|cm)?/i, dimension: 'depth' },
        { pattern: /(\d+(?:\.\d+)?)\s*(mm|cm)?\s*fillet/i, dimension: 'fillet' },
        { pattern: /fillet[:\s=]*(\d+(?:\.\d+)?)\s*(mm|cm)?/i, dimension: 'fillet' },
        { pattern: /(\d+(?:\.\d+)?)\s*(mm|cm)?\s*chamfer/i, dimension: 'chamfer' },
    ];

    for (const { pattern, dimension } of patterns) {
        const match = text.match(pattern);
        if (match && !dims[dimension]) {
            const value = parseFloat(match[1] || match[2]);
            if (!isNaN(value)) {
                dims[dimension] = value;
            }
        }
    }

    // If diameter is specified, compute radius
    if (dims.diameter && !dims.radius) {
        dims.radius = dims.diameter / 2;
    }
    if (dims.radius && !dims.diameter) {
        dims.diameter = dims.radius * 2;
    }

    // Fallback: extract any numbers and assign based on primitive
    if (Object.keys(dims).length === 0) {
        const numbers = text.match(/\d+(?:\.\d+)?/g)?.map(Number).filter(n => n > 0 && n < 10000) || [];
        const sorted = [...new Set(numbers)].sort((a, b) => b - a);

        if (sorted.length > 0) {
            if (['cylinder', 'sphere', 'cone', 'torus'].includes(primitive)) {
                dims.diameter = sorted[0];
                dims.height = sorted[1] || sorted[0];
            } else {
                dims.length = sorted[0] || 100;
                dims.width = sorted[1] || sorted[0] || 100;
                dims.height = sorted[2] || Math.min(sorted[0] / 5, 20) || 20;
            }
        }
    }

    // Apply smart defaults based on primitive type
    return applySmartDefaults(dims, primitive);
}

function applySmartDefaults(dims: Record<string, number>, primitive: string): Record<string, number> {
    const defaults: Record<string, Record<string, number>> = {
        box: { length: 100, width: 100, height: 20, thickness: 2, fillet: 0 },
        enclosure: { length: 100, width: 60, height: 40, thickness: 2, fillet: 3 },
        cylinder: { diameter: 50, height: 100, thickness: 2, radius: 25 },
        sphere: { diameter: 50, radius: 25 },
        cone: { diameter: 50, height: 100, topDiameter: 0 },
        torus: { diameter: 50, tubeRadius: 10, thickness: 2 },
        wedge: { length: 100, width: 50, height: 50 },
        prism: { length: 100, width: 50, height: 50 },
        gear: { diameter: 50, teeth: 20, module: 2, thickness: 10 },
        bolt: { diameter: 6, length: 20 },
        pipe: { diameter: 25, length: 500, thickness: 2 },
        vase: { diameter: 100, height: 200, thickness: 3 },
        bowl: { diameter: 150, height: 75, thickness: 3 },
        'l-bend': { length: 100, width: 100, height: 50, thickness: 5 },
        'i-beam': { length: 500, width: 100, height: 200, thickness: 10 },
        channel: { length: 500, width: 50, height: 100, thickness: 5 },
    };

    const primitiveDefaults = defaults[primitive] || defaults.box;

    return {
        ...primitiveDefaults,
        ...dims,
        // Ensure radius/diameter consistency
        radius: dims.radius || (dims.diameter ? dims.diameter / 2 : primitiveDefaults.radius || 25),
        diameter: dims.diameter || (dims.radius ? dims.radius * 2 : primitiveDefaults.diameter || 50),
    };
}

function extractFeatures(text: string): string[] {
    const features: string[] = [];

    // Holes
    const holePatterns = [
        /(\d+)\s*(?:x\s*)?(?:m\d+\s*)?holes?/i,
        /holes?\s*(?:x\s*)?(\d+)/i,
        /with\s+(\d+)\s+holes?/i,
    ];
    for (const pattern of holePatterns) {
        const match = text.match(pattern);
        if (match) {
            features.push(`${match[1]} holes`);
            break;
        }
    }
    if (features.length === 0 && /\bhole\b/i.test(text)) {
        features.push('holes');
    }

    // Threads
    const threadMatch = text.match(/m(\d+(?:\.\d+)?)\s*(?:x\s*(\d+(?:\.\d+)?))?\s*thread/i);
    if (threadMatch) {
        features.push(`M${threadMatch[1]} thread`);
    } else if (/\bthread(?:ed|s)?\b/i.test(text)) {
        features.push('threaded');
    }

    // Slots
    if (/\bslot(?:ted|s)?\b/i.test(text)) features.push('slots');

    // Grooves
    if (/\bgroove[ds]?\b/i.test(text)) features.push('grooves');

    // Keyway
    if (/\bkeyway\b/i.test(text)) features.push('keyway');

    // Chamfer
    const chamferMatch = text.match(/(\d+(?:\.\d+)?)\s*mm\s*chamfer/i);
    if (chamferMatch) features.push(`${chamferMatch[1]}mm chamfer`);
    else if (/\bchamfer(?:ed)?\b/i.test(text)) features.push('chamfered');

    // Fillet
    const filletMatch = text.match(/(\d+(?:\.\d+)?)\s*mm\s*fillet/i);
    if (filletMatch) features.push(`${filletMatch[1]}mm fillet`);
    else if (/\bfillet(?:ed)?\b|rounded\s+(?:corners?|edges?)/i.test(text)) features.push('filleted');

    // Counterbore
    if (/\bcounterbore[ds]?\b/i.test(text)) features.push('counterbored');

    // Countersink
    if (/\bcountersink|countersunk\b/i.test(text)) features.push('countersunk');

    // NEMA Mount Feature Detection
    const nemaMatch = text.match(/\b(nema\s*\d+)\b/i);
    if (nemaMatch) {
        features.push(`${nemaMatch[1].toUpperCase().replace(/\s+/, ' ')} Mount`);
    }

    return features;
}

function extractLoad(text: string): number | undefined {
    // Detect Forces
    // "1000N", "10kN", "500 n", "5 kn"
    const forceMatch = text.match(/(\d+(?:\.\d+)?)\s*(kn|n|newtons?)\b/i);
    if (forceMatch) {
        const val = parseFloat(forceMatch[1]);
        const unit = forceMatch[2].toLowerCase();
        if (unit.startsWith('k')) return val * 1000;
        return val;
    }

    // Detect Mass (as Load) -> "hold 5kg" -> ~50N
    // Support variations like "holding", "supporting", "carrying", "for a 50kg load"
    const massMatch = text.match(/(?:hold|support|carry|load|capacity|weight|for\s+a)[a-z]*\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*(kg|g|lbs)\b/i);
    if (massMatch) {
        const val = parseFloat(massMatch[1]);
        const unit = massMatch[2].toLowerCase();
        if (unit === 'kg') return val * 9.81;
        if (unit === 'g') return (val / 1000) * 9.81;
        if (unit === 'lbs') return val * 4.448; // 1 lb = 4.448 N
    }

    return undefined;
}

function extractContext(text: string, words: string[]): DesignContext {
    const context: DesignContext = {};

    // Purpose detection
    for (const [keyword, purpose] of Object.entries(PURPOSE_KEYWORDS)) {
        if (text.includes(keyword)) {
            context.purpose = purpose;
            break;
        }
    }

    // Size category
    for (const [keyword, info] of Object.entries(SIZE_MODIFIERS)) {
        if (text.includes(keyword) && info.category === 'size') {
            context.sizeCategory = keyword;
            break;
        }
    }

    // Aesthetics
    const aesthetics: string[] = [];
    for (const keyword of AESTHETIC_KEYWORDS) {
        if (text.includes(keyword)) {
            aesthetics.push(keyword);
        }
    }
    if (aesthetics.length > 0) context.aesthetics = aesthetics;

    // Constraints
    const constraints: string[] = [];
    for (const [keyword, constraint] of Object.entries(CONSTRAINT_KEYWORDS)) {
        if (text.includes(keyword)) {
            constraints.push(constraint);
        }
    }
    if (constraints.length > 0) context.constraints = constraints;

    // Quantity
    const qtyMatch = text.match(/(\d+)\s*(?:pieces?|pcs?|units?|of\s+them)/i);
    if (qtyMatch) {
        context.quantity = parseInt(qtyMatch[1]);
    }

    // Environment
    if (/\boutdoor|outside|external|weather\b/i.test(text)) context.environment = 'outdoor';
    if (/\bindoor|inside|internal\b/i.test(text)) context.environment = 'indoor';
    if (/\bunderwater|submerged|marine\b/i.test(text)) context.environment = 'underwater';
    if (/\bhigh.?temp|hot|heat\b/i.test(text)) context.environment = 'high-temperature';
    if (/\bcold|freezing|cryo\b/i.test(text)) context.environment = 'low-temperature';

    return context;
}

function applyContextualSizing(dims: Record<string, number>, text: string, context: DesignContext): void {
    // Apply size modifiers
    for (const [keyword, info] of Object.entries(SIZE_MODIFIERS)) {
        if (text.includes(keyword)) {
            if (info.category === 'size') {
                dims.length = (dims.length || 100) * info.multiplier;
                dims.width = (dims.width || 100) * info.multiplier;
                dims.height = (dims.height || 20) * info.multiplier;
                dims.diameter = (dims.diameter || 50) * info.multiplier;
            } else if (info.category === 'thickness') {
                dims.thickness = (dims.thickness || 2) * info.multiplier;
            } else if (info.category === 'height') {
                dims.height = (dims.height || 20) * info.multiplier;
            } else if (info.category === 'length') {
                dims.length = (dims.length || 100) * info.multiplier;
            } else if (info.category === 'width') {
                dims.width = (dims.width || 100) * info.multiplier;
            }
        }
    }
}

function capitalize(str: string): string {
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ===== DESIGN INTENT GENERATOR =====
export function generateDesignIntent(parsed: ParsedDesign): any {
    return {
        part_id: `GEN-${Date.now().toString().slice(-4)}`,
        revision: 'A.1',
        materials: [parsed.material],
        parameters: {
            profile: parsed.profile,
            primitive_type: parsed.primitiveType,
            thread: parsed.standardSpec, // Pass the detected standard (e.g. "M10")
            length_mm: Math.round(parsed.dimensions.length || 100),
            width_mm: Math.round(parsed.dimensions.width || 100),
            height_mm: Math.round(parsed.dimensions.height || 20),
            diameter_mm: Math.round(parsed.dimensions.diameter || 50),
            radius_mm: Math.round(parsed.dimensions.radius || 25),
            thickness_mm: Math.round(parsed.dimensions.thickness || 2),
            fillet_radius: parsed.dimensions.fillet || 0,
            chamfer_size: parsed.dimensions.chamfer || 0,
            modifiers: parsed.modifiers,
            features: parsed.features,
            context: parsed.context
        },
        constraints: [
            { id: 'c1', type: 'bound', expression: 'max_stress < yield_strength', severity: 'blocker' },
            ...(parsed.context.constraints?.map((c, i) => ({
                id: `ctx${i}`,
                type: 'goal',
                expression: c,
                severity: 'preference'
            })) || [])
        ],
        objectives: parsed.context.constraints || ['Minimize Mass'],
        acceptance: {
            max_mass_g: 5000,
            safety_factor_min: 1.5
        }
    };
}
