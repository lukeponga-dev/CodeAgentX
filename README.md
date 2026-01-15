<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# ⚡ CodeAgent X
### The Autonomous Software Maintenance Transformer

[![Gemini 3 Pro](https://img.shields.io/badge/Model-Gemini%203%20Pro-blueviolet?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/Framework-React%2019-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)

**CodeAgent X** is a next-generation AI agent designed to revolutionize how developers maintain and refactor complex codebases. By leveraging the advanced reasoning capabilities of **Gemini 3 Pro**, CodeAgent X doesn't just suggest code—it architecturally audits entire repositories, visualizes coupling, and autonomously verifies fixes in a simulated sandbox.

[View App in AI Studio](https://ai.studio/apps/drive/1GV062vOJ1eqtwloi2Sv7ELo9mUk7jsdz) | [Explore Features](#-key-capabilities) | [Quick Start](#-installation)

</div>

---

## 🎨 Interface Preview

<div align="center">
<img src="mockup.png" width="800" alt="CodeAgent X Interface Mockup" />
<p><i>The CodeAgent X "Architect" interface showing deep reasoning, dependency visualization, and autonomous repair loops.</i></p>
</div>

---

## 🚀 Key Capabilities

| Feature | Description |
| :--- | :--- |
| **🧠 Deep Reasoning** | Utilizes Gemini 3's extended thinking budget to solve non-trivial architectural technical debt. |
| **📁 Full Context Analysis** | Ingest whole repositories via GitHub or local upload for holistic project understanding. |
| **🕸️ Visual Engineering** | Interactive D3-powered dependency graphs to spot high-coupling and spaghetti code. |
| **🛠️ Autonomous Repair** | A closed-loop "Debug Mode" that drafts, simulates, and refines fixes until they pass QA. |
| **📸 Multimodal Input** | Interprets system logs, complex screenshots, and architectural diagrams to diagnose issues. |

## 🛠️ Operating Modes

CodeAgent X operates in three distinct cognitive states:

1.  **Architect (Think)**: High-latency, deep-thought mode for restructuring and system design.
2.  **Debug (Fix)**: Autonomous repair loop that verifies logic in a mental sandbox before proposing solutions.
3.  **Fast (Execute)**: Low-latency mode for quick refactoring, documentation, and logic explanations.

## 📦 Installation

Get CodeAgent X running in your local environment in under 2 minutes.

### Prerequisites
- **Node.js**: Version 18 or higher.
- **Gemini API Key**: Obtainable via [Google AI Studio](https://aistudio.google.com/).

### Setup

1. **Clone & Enter**
   ```bash
   git clone https://github.com/user/CodeAgentX.git
   cd CodeAgentX
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Launch**
   ```bash
   npm run dev
   ```

## 🖥️ Usage Guide

### 1. Ingesting Code
- **GitHub Import**: Paste any public repository URL to download and analyze its structure.
- **Local Upload**: Drag and drop your `src` folder or specific files (including `.log` and images).

### 2. Dependency Visualization
Switch to the **Graph View** to see a live-updating D3 visualization of how your modules interact. Click nodes to see file contents and coupling metrics.

### 3. The Repair Loop
Enter **Debug Mode** and describe a stack trace. CodeAgent X will:
- **Analyze** the relevant files.
- **Draft** a potential fix.
- **Simulate** the execution (Verification).
- **Refine** automatically if the simulation fails.

## 🧰 Tech Stack
- **AI Core**: Google Gemini 3 Pro
- **Frontend**: React 19, Tailwind CSS (Glassmorphism UI)
- **Visualization**: D3.js (Force-directed graphs)
- **Icons**: Lucide React
- **Logic**: TypeScript
- **Bundler**: Vite

---

<div align="center">
Built for the <b>Gemini 3 Global Hackathon</b> by the DeepMind Team.
</div>
