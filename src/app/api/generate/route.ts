// API Route for Design Generation
// Uses intelligent NLP to understand ANY plain English description

import { NextResponse } from 'next/server';
import { mergeIntents, setCurrentIntent } from '@/lib/context/designContext';
import { parseDesignDescription, generateDesignIntent } from '@/lib/nlp/designParser';

export async function POST(request: Request) {
    const body = await request.json();
    const { spec } = body;

    // Use the intelligent NLP parser
    const parsed = parseDesignDescription(spec);

    // Generate structured design intent
    const designIntent = generateDesignIntent(parsed);

    // Add the legacy fields for compatibility
    const lowerSpec = spec.toLowerCase();

    // ===== ADDITIONAL FEATURE EXTRACTION =====

    // Holes: "4 holes", "with holes", "M5 holes"
    const holeMatch = lowerSpec.match(/(\d+)\s*(x\s*)?(m\d+\s*)?holes?/i) || lowerSpec.match(/holes?\s*(\d+)?/i);
    const holeCount = holeMatch ? (parseInt(holeMatch[1]) || 4) : (lowerSpec.includes('hole') ? 4 : 0);
    const holeSizeMatch = lowerSpec.match(/m(\d+)\s*holes?/i);
    const holeSize = holeSizeMatch ? parseInt(holeSizeMatch[1]) : 5;

    // Fillets: "2mm fillet", "fillet radius 3"
    const filletMatch = lowerSpec.match(/(\d+(\.\d+)?)\s*mm?\s*fillet/i) || lowerSpec.match(/fillet\s*(\d+(\.\d+)?)/i);
    const filletRadius = filletMatch ? parseFloat(filletMatch[1]) : (lowerSpec.includes('fillet') || lowerSpec.includes('rounded') ? 2 : 0);

    // Chamfers: "1mm chamfer", "chamfered edges"
    const chamferMatch = lowerSpec.match(/(\d+(\.\d+)?)\s*mm?\s*chamfer/i);
    const chamferSize = chamferMatch ? parseFloat(chamferMatch[1]) : (lowerSpec.includes('chamfer') ? 1 : 0);

    // Load Conditions: "withstand 100N", "support 5kg", "100 newton"
    const loadMatch = lowerSpec.match(/(\d+(\.\d+)?)\s*(n|newton|kg|kilogram)/i);
    let loadN = 0;
    if (loadMatch) {
        loadN = parseFloat(loadMatch[1]);
        if (loadMatch[3].toLowerCase().startsWith('kg')) loadN *= 9.81;
    }

    // Tolerances: "±0.1mm", "tolerance 0.05"
    const toleranceMatch = lowerSpec.match(/[±+-]?\s*(\d+(\.\d+)?)\s*mm\s*tolerance/i) || lowerSpec.match(/tolerance\s*[±+-]?\s*(\d+(\.\d+)?)/i);
    const tolerance = toleranceMatch ? parseFloat(toleranceMatch[1]) : 0.1;

    // Surface Finish
    let surfaceFinish = "As Machined";
    if (lowerSpec.includes('anodiz')) surfaceFinish = "Anodized";
    else if (lowerSpec.includes('polish')) surfaceFinish = "Polished";
    else if (lowerSpec.includes('brush')) surfaceFinish = "Brushed";
    else if (lowerSpec.includes('matte') || lowerSpec.includes('bead blast')) surfaceFinish = "Bead Blasted";
    else if (lowerSpec.includes('paint')) surfaceFinish = "Painted";

    // Thread
    const threadMatch = lowerSpec.match(/m(\d+)\s*thread/i);
    const threadSize = threadMatch ? `M${threadMatch[1]}` : (lowerSpec.includes('thread') ? 'M6' : null);



    // Merge with previous intent for iterative design
    const mergedIntent = mergeIntents(designIntent);
    // Store as current for next iteration
    setCurrentIntent(mergedIntent);

    // Return merged intent in response
    return NextResponse.json({
        spec,
        type: parsed.primitiveType,
        designIntent: mergedIntent,
        parsed: {
            primitiveType: parsed.primitiveType,
            modifiers: parsed.modifiers,
            confidence: parsed.confidence
        },
        instructions: [
            `Detected Shape: ${parsed.profile.toUpperCase()} (${parsed.primitiveType})`,
            `Material: ${parsed.material}`,
            `Dimensions: ${parsed.dimensions.length}x${parsed.dimensions.width}x${parsed.dimensions.height}mm`,
            parsed.modifiers.length > 0 ? `Modifiers: ${parsed.modifiers.join(', ')}` : null,
            parsed.features.length > 0 ? `Features: ${parsed.features.join(', ')}` : null,
            "Review parsed parameters in the 'Structured' tab."
        ].filter(Boolean)
    });
}
