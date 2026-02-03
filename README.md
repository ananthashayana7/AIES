# Cadence - The Engineering Agent

**Cadence** is an autonomous engineering system that transforms natural language into manufacturable, simulated, and standard-compliant engineering models. It is built to act as a **Mec Agent**—an intelligent assistant that understands physics, standards, and manufacturing constraints.

> **Local-Only & Ephemeral**: This application runs entirely on your machine. No design data is sent to the cloud.

---

## 🧠 The "Thinking Pipeline" (Architecture)

Cadence operates on a 6-layer architecture designed to mimic a human engineer's workflow:
=======
##  Key Features

### AI-Driven Design
- **Natural Language Input**: Describe your part and Cadence generates the specs.
- **Rule Engine**: Deterministic checks for manufacturing constraints (wall thickness, hole spacing, mass limits).
- **Risk Assessment**: Real-time evaluation of structural, manufacturing, and tolerance risks.

###  Dynamic Parametric Modeling
- **Live 3D Preview**: Interactive WebGL viewer (Three.js) that updates instantly.
- **Part Types**: Specialized generators for:
  -  Brackets
  -  Enclosures
  -  Shafts
  -  Gears
  -  Spinners (Custom)
- **Inspect Mode**: Click on any part region (body, holes, pockets) to view engineering data.

### 🏭 Manufacturing Ready
- **Procedure Generation**: Automatic generation of standard operating procedures (SOPs) based on feature analysis.
- **Export**:
  -  **PDF Reports**: Comprehensive DFM reports with risk analysis.
  -  **GLB Models**: Export 3D binary files for use in CAD/Blender.
  -  **JSON Specs**: Machine-readable design intent files.

---

##  Installation & Running

### 1. The Configurator (NLP & Agent)
- **Interrogative Logic**: The Agent actively asks for missing information (e.g., *"What is the load?"* or *"What size bolt?"*).
- **Scope Awareness**: It detects complex assembly requests (e.g., "Design an aircraft engine") and guides the user to component-level engineering.
- **Context Extraction**: Extracts Loads (N/kg), Constraints, and Manufacturing Intents from natural language.

### 2. The Engineer (Standards Library)
- **Source of Truth**: Hardcoded library (`src/lib/standards/mechanical.ts`) for ISO Threads (M2-M24), Bearings (6000 series), and NEMA Motor patterns.
- **Strict Compliance**: No hallucinations. M10 bolts always have a 1.5mm pitch and 17mm hex head.

### 3. The Factory (Parametric Geometry)
- **Universal Generator**: Creates high-fidelity 3D meshes (Three.js) based on engineering specs.
- **Feature Awareness**: Automatically cuts NEMA mounting holes, threads, and pilot bores based on detected standards.

### 4. The Analyst (Simulation & Cost)
- **Physics Engine**: Performs linear-elastic simulation (Beam Bending, Tensile Stress) to calculate **Safety Factors**.
- **Manufacturing Engine**: Generates detailed **Standard Operating Procedures (SOPs)** (e.g., *"Drill 4x M3 Holes", "Face Mill Top"*).
- **Cost Engine**: Estimates part cost based on Material Volume, Density, and CNC Machine Time.

### 5. The Solver (Optimization Agent)
- **Autonomous Iteration**: The Solver loops through design parameters (e.g., Plate Thickness 1mm -> 25mm) to find the optimal design that meets the **Safety Factor (SF >= 1.5)** for a given Load.
- **Self-Correction**: If a part is too weak, the Solver automatically reinforces it before presenting it to the user.

### 6. The Interface (UI & Export)
- **Visual FEM**: Real-time Heatmap visualization of stress concentrations.
- **System Audit**: A live checklist verifying Standards Compliance, Structural Integrity, and Manufacturability.
- **Export Power**: Generate PDF Engineering Reports and GLB/STL files for manufacturing.

---

## 📖 Usage Guide

### 1. Conversational Engineering
Type your request in the **Agent** panel:
- *"I need a mount for a NEMA 17 motor."* -> Agent will ask for the Load.
- *"It needs to hold 5kg."* -> Agent will run the Solver and design a plate with the correct thickness.
- *"Make it lighter."* -> Agent will optimize for weight.
- *"Design a generic M10 bolt."* -> Agent generates a standard ISO M10 bolt.

### 2. Analysis & Review
- **Guidance Tab**: Step-by-step CAD workflow instructions.
- **Manufacturing Tab**: View the generated SOP and Cost estimation.
- **Simulation Tab**: Compare material trade-offs (Al vs. Steel) for Mass, Cost, and Deflection.
- **Audit Tab**: View the system health check (Pass/Fail) for your design.

### 3. Visual Inspection
- **Inspect Mode**: Click "Inspect Parameters" in the 3D viewer to see dimensions.
- **Heatmap**: Ask the agent to *"Show stress"* to view the FEM analysis.

---

## 🛠️ Installation

```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Technology Stack
- **Core**: Next.js 16 (React 19), TypeScript
- **State**: Zustand
- **3D**: Three.js, React Three Fiber
- **Docs**: jsPDF
- **Simulation**: Custom FEA-lite physics engine (Local)

---

## 🔒 Privacy & Security
Cadence is local-first. Your proprietary engineering designs never leave your machine.
