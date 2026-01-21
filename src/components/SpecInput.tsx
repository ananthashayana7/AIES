'use client';

// Advanced Design Intent Editor v0.9+ 
// Supports high-complexity parameter systems & multi-scenario modeling.

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { DesignIntent, IntentConstraint } from '@/lib/schemas/designIntent';

import { MATERIAL_LIBRARY } from '@/lib/simulation/materialLibrary';

export default function SpecInput() {
  const { setDesignIntent, generateGuidance, isProcessing, designIntent } = useAppStore();
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [localIntent, setLocalIntent] = useState<DesignIntent>(designIntent || {
    part_id: 'CPLX-001',
    revision: 'A.0',
    materials: ['Aluminum 6061-T6'],
    parameters: {
      "profile": "Baseplate",
      "length_mm": 200,
      "width_mm": 200,
      "thickness_mm": 12,
      "hole_count": 4,
      "hole_dia_mm": 14,
      "load_kn": 15
    },
    constraints: [
      { id: 'c1', type: 'bound', expression: 'max_deflection < 0.1mm', severity: 'blocker' }
    ],
    objectives: ["Minimize Mass", "Max Stiffness"],
    acceptance: {
      max_mass_g: 5000,
      safety_factor_min: 3.0
    }
  });

  // Keep local intent in sync if store changes (e.g. example load)
  useEffect(() => {
    if (designIntent) setLocalIntent(designIntent);
  }, [designIntent]);

  const toggleMaterial = (name: string) => {
    const mats = [...localIntent.materials];
    let newMats = mats;

    if (mats.includes(name)) {
      if (mats.length > 1) {
        newMats = mats.filter(m => m !== name);
      } else {
        // Don't allow removing the last material
        return;
      }
    } else {
      newMats = [...mats, name];
    }

    const updatedIntent = { ...localIntent, materials: newMats };
    setLocalIntent(updatedIntent);

    // Auto-apply material changes to trigger re-simulation
    setTimeout(() => {
      setDesignIntent(updatedIntent);
      generateGuidance();
    }, 100);
  };

  const updateParam = (oldKey: string, newKey: string, value: any) => {
    const newParams = { ...localIntent.parameters };
    if (oldKey !== newKey) {
      delete newParams[oldKey];
    }
    newParams[newKey] = value;
    setLocalIntent({ ...localIntent, parameters: newParams });
  };

  const removeParam = (key: string) => {
    const newParams = { ...localIntent.parameters };
    delete newParams[key];
    setLocalIntent({ ...localIntent, parameters: newParams });
  };

  const addParam = () => {
    const key = `param_${Object.keys(localIntent.parameters).length + 1}`;
    updateParam(key, key, 0);
  };

  const setConstraint = (index: number, field: keyof IntentConstraint, val: any) => {
    const newConstraints = [...localIntent.constraints];
    newConstraints[index] = { ...newConstraints[index], [field]: val };
    setLocalIntent({ ...localIntent, constraints: newConstraints });
  };

  const normalizeIntent = (obj: any): DesignIntent => {
    const base: DesignIntent = {
      part_id: obj.part_id || obj.product || 'CUSTOM-001',
      revision: obj.revision || 'A.0',
      materials: Array.isArray(obj.materials) ? obj.materials : (obj.material ? [JSON.stringify(obj.material)] : ['Aluminum 6061-T6']),
      parameters: obj.parameters || {},
      constraints: obj.constraints || [],
      objectives: obj.objectives || [],
      acceptance: obj.acceptance || { max_mass_g: 5000, safety_factor_min: 3.0 }
    };

    // If it's a "Loose" JSON (user pasted arbitrary fields), map them to parameters
    Object.keys(obj).forEach(key => {
      const reserved = ['part_id', 'revision', 'materials', 'parameters', 'constraints', 'objectives', 'acceptance', 'guidance_steps'];
      if (!reserved.includes(key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          // Flatten nested objects like "dimensions"
          Object.entries(obj[key]).forEach(([subK, subV]) => {
            base.parameters[`${key}.${subK}`] = subV as any;
          });
        } else {
          base.parameters[key] = obj[key];
        }
      }
    });

    return base;
  };

  const handleApply = () => {
    setDesignIntent(localIntent);
    generateGuidance();
  };

  const handleBulkChange = (val: string) => {
    setBulkText(val);
    try {
      const parsed = JSON.parse(val);
      const normalized = normalizeIntent(parsed);
      setLocalIntent(normalized);
    } catch (e) {
      // Allow invalid JSON during typing, don't update localIntent
    }
  };

  const enterBulkMode = () => {
    setBulkText(JSON.stringify(localIntent, null, 2));
    setBulkMode(true);
  };

  return (
    <div className="intent-editor">
      <div className="tab-header">
        <button className={!bulkMode ? 'active' : ''} onClick={() => setBulkMode(false)}>STRUCTURED</button>
        <button className={bulkMode ? 'active' : ''} onClick={enterBulkMode}>BULK JSON</button>
      </div>

      <div className="scroll-area">
        {!bulkMode ? (
          <>
            <div className="section">
              <div className="meta-row">
                <div className="field">
                  <label>PART ID</label>
                  <input
                    value={localIntent.part_id}
                    onChange={e => setLocalIntent({ ...localIntent, part_id: e.target.value })}
                  />
                </div>
                <div className="field short">
                  <label>REV</label>
                  <input
                    value={localIntent.revision}
                    onChange={e => setLocalIntent({ ...localIntent, revision: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="section">
              <h3>MATERIALS (SIMULATION TARGETS)</h3>
              <div className="material-chips">
                {Object.values(MATERIAL_LIBRARY).map(m => (
                  <button
                    key={m.name}
                    className={`mat-chip ${localIntent.materials.includes(m.name) ? 'active' : ''}`}
                    onClick={() => toggleMaterial(m.name)}
                  >
                    {m.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="section">
              <div className="section-header">
                <h3>PARAMETERS</h3>
                <button onClick={addParam} className="icon-btn" title="Add Parameter">+</button>
              </div>
              <div className="param-list">
                <div className="list-headers">
                  <span>SPECIFICATION / KEY</span>
                  <span className="val-head">VALUE</span>
                </div>
                {Object.entries(localIntent.parameters).map(([key, val]) => (
                  <div key={key} className="param-edit-row">
                    <input
                      disabled={['profile', 'length_mm', 'width_mm'].includes(key)}
                      className="k-input"
                      value={key}
                      onChange={e => updateParam(key, e.target.value, val)}
                    />
                    <input
                      className="v-input"
                      value={val}
                      onChange={e => updateParam(key, key, e.target.value)}
                    />
                    <button className="del-btn" onClick={() => removeParam(key)}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="section">
              <div className="section-header">
                <h3>CONSTRAINTS</h3>
                <button onClick={() => setLocalIntent({ ...localIntent, constraints: [...localIntent.constraints, { id: 'c' + Date.now(), type: 'bound', expression: '', severity: 'info' }] })} className="icon-btn">+</button>
              </div>
              <div className="constraints-list">
                {localIntent.constraints.map((c, i) => (
                  <div key={c.id} className="c-row">
                    <select className="c-type" value={c.type} onChange={e => setConstraint(i, 'type', e.target.value)}>
                      <option value="bound">BOUND</option>
                      <option value="tolerance">TOLERANCE</option>
                      <option value="interface">INTERFACE</option>
                    </select>
                    <input
                      className="c-exp"
                      value={c.expression}
                      placeholder="Expression..."
                      onChange={e => setConstraint(i, 'expression', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="section">
              <h3>ACCEPTANCE</h3>
              <div className="acceptance-grid">
                <div className="a-row">
                  <label>MAX MASS (G)</label>
                  <input type="number" value={localIntent.acceptance.max_mass_g} onChange={e => setLocalIntent({ ...localIntent, acceptance: { ...localIntent.acceptance, max_mass_g: Number(e.target.value) } })} />
                </div>
                <div className="a-row">
                  <label>MIN S.F.</label>
                  <input type="number" step="0.1" value={localIntent.acceptance.safety_factor_min} onChange={e => setLocalIntent({ ...localIntent, acceptance: { ...localIntent.acceptance, safety_factor_min: Number(e.target.value) } })} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="json-area">
            <textarea
              value={bulkText}
              onChange={e => handleBulkChange(e.target.value)}
              placeholder="Paste design specifications in JSON format..."
            />
            <p className="hint">Direct JSON edit for complex specifications. Supports loose object mapping.</p>
          </div>
        )}
      </div>

      <div className="footer">
        <button
          className="apply-btn"
          onClick={handleApply}
          disabled={isProcessing}
        >
          {isProcessing ? 'MODELING SCENARIO...' : 'EXECUTE GUIDANCE ENGINE'}
        </button>
      </div>

      <style jsx>{`
        .intent-editor {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #000;
          color: #fff;
          font-family: var(--font-mono);
        }

        .tab-header {
          display: flex;
          border-bottom: 1px solid #1a1a1a;
        }

        .tab-header button {
          flex: 1;
          background: transparent;
          border: none;
          padding: 10px;
          color: #444;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
        }

        .tab-header button.active {
          color: #fff;
          background: #111;
        }

        .scroll-area {
          flex: 1;
          overflow-y: auto;
        }

        .section {
          padding: 16px;
          border-bottom: 1px solid #1a1a1a;
        }

        .material-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .mat-chip {
          background: #000;
          border: 1px solid #222;
          color: #444;
          padding: 4px 8px;
          font-size: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .mat-chip.active {
          border-color: #fff;
          color: #fff;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        h3 { font-size: 10px; color: #666; margin: 0; letter-spacing: 1px; }

        .meta-row { display: flex; gap: 12px; }
        .field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .field.short { flex: 0 0 60px; }
        label { font-size: 9px; color: #444; font-weight: 700; text-transform: uppercase; }

        input, select, textarea {
          background: #050505;
          border: 1px solid #222;
          color: #fff;
          padding: 6px 8px;
          font-size: 11px;
        }

        input:focus { border-color: #fff; outline: none; }

        .list-headers {
          display: flex;
          justify-content: space-between;
          font-size: 8px;
          color: #222;
          margin-bottom: 6px;
        }
        .val-head { padding-right: 40px; }

        .param-edit-row {
          display: flex;
          gap: 2px;
          margin-bottom: 2px;
        }

        .k-input { flex: 1; color: #888; border-color: transparent; padding-left: 0; }
        .k-input:focus { color: #fff; border-color: #222; }
        .v-input { width: 80px; text-align: right; border-color: transparent; }
        .v-input:focus { border-color: #555; }
        
        .icon-btn { 
          background: transparent; border: 1px solid #222; 
          color: #666; width: 20px; height: 20px; font-size: 14px; 
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }
        .icon-btn:hover { border-color: #444; color: #fff; }

        .del-btn {
          background: transparent; border: none; color: #222;
          cursor: pointer; font-size: 14px; padding: 0 4px;
        }
        .del-btn:hover { color: #f44; }

        .c-row { display: flex; gap: 4px; margin-bottom: 4px; }
        .c-type { font-size: 9px; width: 80px; }
        .c-exp { flex: 1; font-size: 10px; }

        .acceptance-grid { display: flex; flex-direction: column; gap: 8px; }
        .a-row { display: flex; justify-content: space-between; align-items: center; }
        .a-row input { width: 80px; text-align: right; }

        .json-area { padding: 16px; height: 300px; display: flex; flex-direction: column; gap: 8px; }
        .json-area textarea { flex: 1; font-size: 10px; font-family: monospace; white-space: pre; }
        .hint { font-size: 9px; color: #444; margin: 0; }

        .footer { padding: 16px; background: #000; border-top: 1px solid #1a1a1a; }
        .apply-btn {
          width: 100%;
          background: #fff;
          color: #000;
          border: none;
          padding: 12px;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 1.5px;
          cursor: pointer;
        }
        .apply-btn:hover { background: #eee; }
        .apply-btn:disabled { background: #111; color: #444; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
