# Cadence - Parametric Design Intelligence

![Cadence Banner](https://raw.githubusercontent.com/placeholder/cadence-banner.png)

**Cadence** is an AI-augmented design system for parametric engineering. It bridges the gap between rough design intent and manufacturable engineering specifications.

> **Local-Only & Ephemeral**: This application runs entirely on your machine. No design data is sent to the cloud. All state is cleared when you refresh the page.

---

## 🚀 Key Features

### 🧠 AI-Driven Design
- **Natural Language Input**: Describe your part (e.g., *"Fidget spinner with 3 arms"* or *"Mounting bracket 150x80mm"*) and Cadence generates the specs.
- **Rule Engine**: Deterministic checks for manufacturing constraints (wall thickness, hole spacing, mass limits).
- **Risk Assessment**: Real-time evaluation of structural, manufacturing, and tolerance risks.

### 📐 Dynamic Parametric Modeling
- **Live 3D Preview**: Interactive WebGL viewer (Three.js) that updates instantly.
- **Part Types**: Specialized generators for:
  - 🔩 Brackets
  - 📦 Enclosures
  - 🔧 Shafts
  - ⚙️ Gears
  - 🔃 Spinners (Custom)
- **Inspect Mode**: Click on any part region (body, holes, pockets) to view engineering data.

### 🏭 Manufacturing Ready
- **Procedure Generation**: Automatic generation of standard operating procedures (SOPs) based on feature analysis.
- **Export**:
  - 📄 **PDF Reports**: Comprehensive DFM reports with risk analysis.
  - 🧊 **GLB Models**: Export 3D binary files for use in CAD/Blender.
  - 📋 **JSON Specs**: Machine-readable design intent files.

---

## 🛠️ Installation & Running

### Prerequisites
- Node.js 18+
- npm

### Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### ⚠️ Port Conflicts?
If port `3000` or `3001` is in use, run on a specific port (e.g., 3002):

```bash
npm run dev -- -p 3002
```

---

## 📖 Usage Guide

1. **Define Intent**:
   - Use the **Spec Input** panel (left) to select a part type.
   - Or type a description in the **"Describe Your Design"** box.
   - Adjust parameters (Length, Material, Process) manually if needed.

2. **Generate Variants**:
   - Click **"Generate Design Variants"**.
   - Review the 3 generated options: **Strength**, **Weight**, and **Cost** optimized.

3. **Analyze & Inspect**:
   - Click **"Inspect"** in the 3D viewer toolbar to probe details.
   - Check the **Info Panel** (right) for Risk Assessment and Rule Violations.

4. **Export**:
   - Go to the **Export** tab in the Info Panel.
   - Download PDF reports or GLB models.

---

## 🏗️ Architecture

- **Framework**: Next.js 16 (React 19)
- **State Management**: Zustand (Ephemeral store)
- **3D Engine**: React Three Fiber / Drei
- **Styling**: Tailwind CSS (Premium Dark Theme)
- **Export**:
  - `jspdf` for Reports
  - `three/GLTFExporter` for 3D Models

### Core Modules
- `src/lib/schemas`: TypeScript definitions for Design Intent.
- `src/lib/rules`: Deterministic engineering rule engine.
- `src/lib/ai`: Heuristic-based reasoning layer (simulated AI).
- `src/components/ParametricMesh.tsx`: Procedural geometry generator.

---

## 🔒 Privacy & Security

Cadence is designed as a **local-first** tool.
- No database.
- No API calls to external AI services.
- All "AI" reasoning is performed locally via heuristic algorithms for speed and privacy.
