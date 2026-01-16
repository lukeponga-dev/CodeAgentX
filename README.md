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

## 📦 Installation & Setup

Get CodeAgent X running in your local environment in under 2 minutes.

### Prerequisites
- **Node.js**: Version 18.0.0 or higher (LTS recommended)
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: Version 2.30.0 or higher
- **Google AI Studio Account**: For Gemini API access ([Get API Key](https://aistudio.google.com/))

### Quick Setup

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

4. **Launch Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   - Navigate to `http://localhost:5173` (default Vite port)

### Advanced Setup Options

#### Using Yarn
```bash
yarn install
yarn dev
```

#### Using pnpm
```bash
pnpm install
pnpm dev
```

#### Environment Variables
```env
# Required
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
VITE_ANALYTICS_ID=your_analytics_id
```

**Security Note**: Never commit `.env.local` or any file containing API keys to version control.

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

## 🔧 Development

### Project Structure
```
CodeAgentX/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── DependencyGraph.tsx
│   │   ├── FileTree.tsx
│   │   ├── GithubModal.tsx
│   │   └── MessageBubble.tsx
│   ├── services/           # Business logic services
│   │   ├── dependencyService.ts
│   │   ├── geminiService.ts
│   │   └── githubService.ts
│   ├── types.ts            # TypeScript type definitions
│   ├── App.tsx             # Main application component
│   └── index.tsx           # Application entry point
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

### Development Scripts
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **TypeScript**: Static type checking

## 🔑 API Configuration

### Gemini API Integration

CodeAgent X uses Google's Gemini models with different capabilities:

- **Architect Mode**: Gemini 3 Pro with extended thinking budget (up to 4096 tokens)
- **Debug Mode**: Gemini 3 Pro with iterative verification loop
- **Fast Mode**: Gemini 3 Flash for quick responses

### Rate Limits & Costs

Be aware of Gemini API limitations:
- **Rate Limits**: Vary by model and usage tier
- **Token Limits**: Context window constraints (varies by model)
- **Cost**: Pay-per-use pricing model

Monitor usage in the [Google Cloud Console](https://console.cloud.google.com/).

## 🚀 Advanced Usage

### Agent Modes Deep Dive

#### Architect Mode (Think)
- **Use Case**: Complex refactoring, system design, architectural decisions
- **Thinking Budget**: Configurable up to 4096 tokens
- **Latency**: High (10-30 seconds)
- **Best For**: Understanding large codebases, planning major changes

#### Debug Mode (Fix)
- **Use Case**: Bug fixing, error resolution, code debugging
- **Features**: Autonomous verification loop with mental simulation
- **Process**: Draft → Verify → Refine (if needed)
- **Best For**: Stack trace analysis, runtime error fixes

#### Fast Mode (Execute)
- **Use Case**: Quick questions, documentation, simple refactoring
- **Latency**: Low (2-5 seconds)
- **Best For**: Code explanations, documentation generation

### File Types Supported
- **Code Files**: `.js`, `.ts`, `.tsx`, `.py`, `.java`, etc.
- **Config Files**: `package.json`, `tsconfig.json`, etc.
- **Documentation**: `.md`, `.txt`
- **Logs**: `.log` files for error analysis
- **Images**: Screenshots, diagrams for multimodal analysis

### Session Management
- **Persistence**: Chat history and loaded files saved to localStorage
- **Reset**: Clear session data with the trash icon
- **Limits**: Browser storage quotas may apply for large codebases

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
**Issue**: `Module not found` errors
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

#### API Errors
**Issue**: `API_KEY_INVALID`
**Solution**: Verify API key in `.env.local` and ensure it's active in Google AI Studio

**Issue**: Rate limit exceeded
**Solution**: Wait for quota reset or upgrade your Google Cloud plan

#### Performance Issues
**Issue**: Slow response times
**Solution**:
- Check internet connection
- Verify API key permissions
- Reduce thinking budget in Architect mode
- Switch to Fast mode for simple queries

#### File Upload Issues
**Issue**: Files not loading
**Solution**: Check file size limits (recommended <10MB total) and supported formats

### Debug Mode
Enable debug logging:
```env
VITE_DEBUG_MODE=true
```
Check browser console for detailed error messages.

### Getting Help
1. Check [existing issues](https://github.com/user/CodeAgentX/issues)
2. Review [SETUP.md](./SETUP.md) for detailed setup instructions
3. Create a new issue with:
   - Error messages
   - Browser/OS information
   - Steps to reproduce

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on:
- Development workflow
- Code standards
- Testing guidelines
- Pull request process

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
Built for the <b>Gemini 3 Global Hackathon</b> by the DeepMind Team.
</div>
