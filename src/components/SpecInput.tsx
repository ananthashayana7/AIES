'use client';

// Freeform Specification Input - Natural language + table-based parameter entry
// AI interprets specs and generates 3D models

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { DesignIntent } from '@/lib/schemas/designIntent';
import { v4 as uuidv4 } from 'uuid';

interface ParameterRow {
  id: string;
  name: string;
  value: string;
  unit: string;
}

// Common units for autocomplete
const commonUnits = ['mm', 'cm', 'm', 'in', 'μm', 'deg', '°', 'qty', 'g', 'kg', 'N', 'MPa', '%'];

// Example prompts
const examplePrompts = [
  "Fidget spinner with 3 arms, 80mm diameter, 8mm thick, bearing hole 22mm in center",
  "Mounting bracket 150x80x20mm with 4 M4 holes at corners, 2mm wall, aluminum",
  "Spur gear module 2, 24 teeth, 15mm face width, 10mm bore with keyway",
  "Enclosure box 200x150x60mm for electronics, snap-fit lid, ventilation slots",
  "Shaft 25mm diameter, 200mm long, with M10 threaded end and 6mm keyway",
];

export default function SpecInput() {
  const { setDesignIntent, generateVariantsFromIntent, isProcessing } = useAppStore();

  // Natural language description
  const [description, setDescription] = useState('');

  // Freeform parameter table
  const [parameters, setParameters] = useState<ParameterRow[]>([
    { id: '1', name: 'Diameter', value: '80', unit: 'mm' },
    { id: '2', name: 'Thickness', value: '8', unit: 'mm' },
    { id: '3', name: 'Arms', value: '3', unit: 'qty' },
  ]);

  // Material and process
  const [material, setMaterial] = useState('Aluminum 6061-T6');
  const [process, setProcess] = useState('CNC_machining');

  const addParameter = () => {
    setParameters(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      value: '',
      unit: 'mm',
    }]);
  };

  const updateParameter = (id: string, field: keyof ParameterRow, value: string) => {
    setParameters(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeParameter = (id: string) => {
    setParameters(prev => prev.filter(p => p.id !== id));
  };

  const loadExample = (example: string) => {
    setDescription(example);
    // Parse example into parameters (simplified)
    const parsed = parseDescription(example);
    if (parsed.length > 0) {
      setParameters(parsed);
    }
  };

  const parseDescription = (text: string): ParameterRow[] => {
    const params: ParameterRow[] = [];

    // Extract dimensions like "80mm", "150x80x20mm"
    const dimMatch = text.match(/(\d+)x(\d+)x(\d+)\s*mm/i);
    if (dimMatch) {
      params.push({ id: '1', name: 'Length', value: dimMatch[1], unit: 'mm' });
      params.push({ id: '2', name: 'Width', value: dimMatch[2], unit: 'mm' });
      params.push({ id: '3', name: 'Height', value: dimMatch[3], unit: 'mm' });
    }

    // Extract diameter
    const diaMatch = text.match(/(\d+)\s*mm\s*diameter/i) || text.match(/diameter\s*(\d+)\s*mm/i);
    if (diaMatch) {
      params.push({ id: 'd1', name: 'Diameter', value: diaMatch[1], unit: 'mm' });
    }

    // Extract thickness
    const thickMatch = text.match(/(\d+)\s*mm\s*thick/i);
    if (thickMatch) {
      params.push({ id: 't1', name: 'Thickness', value: thickMatch[1], unit: 'mm' });
    }

    // Extract holes
    const holeMatch = text.match(/(\d+)\s*(M\d+)\s*holes?/i);
    if (holeMatch) {
      params.push({ id: 'h1', name: 'Holes', value: holeMatch[1], unit: 'qty' });
      params.push({ id: 'h2', name: 'Thread', value: holeMatch[2], unit: '' });
    }

    // Extract arms (for spinners)
    const armMatch = text.match(/(\d+)\s*arms?/i);
    if (armMatch) {
      params.push({ id: 'a1', name: 'Arms', value: armMatch[1], unit: 'qty' });
    }

    // Extract bore/bearing hole
    const boreMatch = text.match(/(?:bore|bearing)\s*(?:hole)?\s*(\d+)\s*mm/i);
    if (boreMatch) {
      params.push({ id: 'b1', name: 'Bore Diameter', value: boreMatch[1], unit: 'mm' });
    }

    // Extract teeth (gears)
    const teethMatch = text.match(/(\d+)\s*teeth/i);
    if (teethMatch) {
      params.push({ id: 'g1', name: 'Teeth', value: teethMatch[1], unit: 'qty' });
    }

    // Extract module (gears)
    const moduleMatch = text.match(/module\s*(\d+\.?\d*)/i);
    if (moduleMatch) {
      params.push({ id: 'g2', name: 'Module', value: moduleMatch[1], unit: 'mod' });
    }

    return params;
  };

  const handleGenerate = () => {
    // Parse description for potential overrides
    const parsedParams = parseDescription(description);

    // Build intent from parameters
    const getParam = (name: string): number => {
      // Check table parameters first (user override)
      let p = parameters.find(x => x.name.toLowerCase().includes(name.toLowerCase()));

      // If not in table, check parsed parameters
      if (!p || !p.value) {
        p = parsedParams.find(x => x.name.toLowerCase().includes(name.toLowerCase()));
      }

      return p ? parseFloat(p.value) || 0 : 0;
    };

    const L = getParam('length') || getParam('diameter') || 100;
    const W = getParam('width') || L * 0.6;
    const H = getParam('height') || getParam('thickness') || 20;

    const intent: DesignIntent = {
      id: uuidv4(),
      partType: 'custom_ai_generated',
      envelope: { L, W, H, units: 'mm' },
      material: { name: material, finish: 'anodized matte black', Ra: 1.6 },
      features: {
        mountingHoles: {
          count: getParam('holes') || 4,
          thread: parameters.find(p => p.name.toLowerCase().includes('thread'))?.value || 'M4',
          pattern: 'rectangular',
          edgeOffset: 10,
        },
        edgeStyle: { type: 'fillet', radius: [2, 4] },
        pockets: { enabled: true, maxDepth: 3 },
      },
      constraints: {
        minWall: getParam('wall') || 2,
        maxMassG: 500,
        manufacturing: process as 'CNC_machining' | 'additive' | 'sheet_metal' | 'casting',
      },
      variants: ['strength', 'weight', 'cost'],
      // Store raw params for AI generation
      customParams: Object.fromEntries(parameters.map(p => [p.name, { value: p.value, unit: p.unit }])),
      aiDescription: description,
    } as DesignIntent;

    setDesignIntent(intent);
    setTimeout(() => generateVariantsFromIntent(), 100);
  };

  const isAmbiguous = description.length > 0 && description.length < 20 && !parameters.some(p => p.value);

  return (
    <div className="spec-input">
      {/* Natural Language Input */}
      <div className="section">
        <div className="section-header">
          <span className="title">✨ Describe Your Design</span>
          <span className="subtitle">AI will interpret and build</span>
        </div>
        <textarea
          className="description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your part in plain English...&#10;e.g. Fidget spinner with 3 arms, 80mm diameter..."
          rows={3}
        />

        {isAmbiguous && (
            <div className="ambiguity-warning">
                ⚠️ Description might be too vague. Consider adding dimensions or parameters below.
            </div>
        )}

        <div className="examples">
          <span className="label">Examples:</span>
          <div className="example-chips">
            {examplePrompts.slice(0, 3).map((ex, i) => (
              <button
                key={i}
                className="chip"
                onClick={() => loadExample(ex)}
              >
                {ex.slice(0, 25)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Parameters Table */}
      <div className="section params-section">
        <div className="section-header">
          <span className="title">📐 Parameters</span>
          <button className="add-btn" onClick={addParameter}>+ Add</button>
        </div>
        <div className="params-table">
          {parameters.map((param) => (
            <div key={param.id} className="param-row">
              <input
                type="text"
                className="name-input"
                value={param.name}
                onChange={(e) => updateParameter(param.id, 'name', e.target.value)}
                placeholder="Parameter name"
              />
              <input
                type="text"
                className="value-input"
                value={param.value}
                onChange={(e) => updateParameter(param.id, 'value', e.target.value)}
                placeholder="Value"
              />
              <select
                className="unit-select"
                value={param.unit}
                onChange={(e) => updateParameter(param.id, 'unit', e.target.value)}
              >
                {commonUnits.map(u => <option key={u} value={u}>{u}</option>)}
                <option value="">-</option>
              </select>
              <button
                className="remove-btn"
                onClick={() => removeParameter(param.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Material & Process */}
      <div className="section">
        <div className="inline-options">
          <select value={material} onChange={(e) => setMaterial(e.target.value)}>
            <option>Aluminum 6061-T6</option>
            <option>Aluminum 7075-T6</option>
            <option>Steel 1018</option>
            <option>Stainless 304</option>
            <option>Titanium Ti-6Al-4V</option>
            <option>ABS Plastic</option>
            <option>Nylon PA12</option>
            <option>PLA</option>
            <option>PETG</option>
          </select>
          <select value={process} onChange={(e) => setProcess(e.target.value)}>
            <option value="CNC_machining">CNC</option>
            <option value="additive">3D Print</option>
            <option value="sheet_metal">Sheet Metal</option>
            <option value="casting">Casting</option>
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <motion.button
        className="generate-btn"
        onClick={handleGenerate}
        disabled={isProcessing}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isProcessing ? (
          <><span className="spinner" /> Generating...</>
        ) : (
          <>🚀 Generate 3D Model</>
        )}
      </motion.button>

      <style jsx>{`
        .spec-input {
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 14px;
          overflow-y: auto;
        }
        
        .section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .section-header .title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .section-header .subtitle {
          font-size: 10px;
          color: var(--text-muted);
        }
        
        .add-btn {
          padding: 4px 10px;
          background: rgba(124,58,237,0.15);
          border: 1px solid rgba(124,58,237,0.3);
          border-radius: 6px;
          color: var(--accent-primary);
          font-size: 11px;
          cursor: pointer;
        }
        
        .add-btn:hover {
          background: rgba(124,58,237,0.25);
        }
        
        .description-input {
          width: 100%;
          padding: 12px;
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 13px;
          resize: none;
          line-height: 1.5;
        }
        
        .description-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.15);
        }
        
        .description-input::placeholder {
          color: var(--text-muted);
        }
        
        .examples {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .examples .label {
          font-size: 10px;
          color: var(--text-muted);
        }
        
        .example-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .chip {
          padding: 5px 10px;
          background: rgba(6,182,212,0.1);
          border: 1px solid rgba(6,182,212,0.2);
          border-radius: 12px;
          color: var(--accent-secondary);
          font-size: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .chip:hover {
          background: rgba(6,182,212,0.2);
          border-color: rgba(6,182,212,0.4);
        }
        
        .params-section {
          flex: 1;
          min-height: 0;
        }
        
        .params-table {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 200px;
          overflow-y: auto;
          padding-right: 4px;
        }
        
        .param-row {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        
        .name-input {
          flex: 2;
          min-width: 0;
          padding: 8px 10px;
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 12px;
        }
        
        .value-input {
          flex: 1;
          min-width: 50px;
          padding: 8px 10px;
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 12px;
          text-align: right;
        }
        
        .unit-select {
          width: 55px;
          padding: 8px 4px;
          background: rgba(124,58,237,0.1);
          border: 1px solid rgba(124,58,237,0.2);
          border-radius: 6px;
          color: var(--accent-primary);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }
        
        .remove-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 16px;
          cursor: pointer;
          opacity: 0.5;
          transition: all 0.2s;
        }
        
        .remove-btn:hover {
          color: #ef4444;
          opacity: 1;
        }
        
        .inline-options {
          display: flex;
          gap: 8px;
        }
        
        .inline-options select {
          flex: 1;
          padding: 10px;
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 12px;
        }
        
        .generate-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px;
          background: var(--gradient-primary);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: var(--glow-primary);
          flex-shrink: 0;
        }
        
        .generate-btn:hover:not(:disabled) {
          box-shadow: 0 8px 30px rgba(124, 58, 237, 0.5);
        }
        
        .generate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin { to { transform: rotate(360deg); } }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: var(--accent-primary);
        }

        .ambiguity-warning {
            padding: 8px 12px;
            background: rgba(245, 158, 11, 0.15);
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 8px;
            color: #fbbf24;
            font-size: 11px;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
