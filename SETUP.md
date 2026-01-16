# Setup Guide for CodeAgent X

This guide provides detailed instructions for setting up CodeAgent X for development, testing, and deployment.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Development Setup](#development-setup)
- [API Configuration](#api-configuration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Node.js**: Version 18.0.0 or higher (LTS recommended)
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: Version 2.30.0 or higher
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

### Hardware Requirements
- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: 500MB free space for installation and dependencies
- **Internet**: Stable connection for API calls and package downloads

### Required Accounts
- **Google AI Studio Account**: For Gemini API access ([Get API Key](https://aistudio.google.com/))

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/CodeAgentX.git
   cd CodeAgentX
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Create environment file
   cp .env.example .env.local
   # Edit .env.local with your API key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:5173` (default Vite port)

## Environment Configuration

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Required: Gemini API Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Development Configuration
VITE_APP_ENV=development
VITE_DEBUG_MODE=true

# Optional: Analytics (if implemented)
VITE_ANALYTICS_ID=your_analytics_id
```

### API Key Setup

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create a new project or select existing one
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key to your `.env.local` file

**Security Note**: Never commit `.env.local` or any file containing API keys to version control.

## Development Setup

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

# Type checking
npm run type-check  # (if configured)
```

### Code Quality Tools

The project includes several code quality tools:

- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **TypeScript**: Static type checking

Run linting:
```bash
npx eslint src --ext .ts,.tsx
```

Format code:
```bash
npx prettier --write src
```

## API Configuration

### Gemini API Integration

CodeAgent X uses Google's Gemini 3 Pro and Gemini 3 Flash models:

- **Architect Mode**: Gemini 3 Pro with extended thinking budget (up to 4096 tokens)
- **Debug Mode**: Gemini 3 Pro with iterative verification loop
- **Fast Mode**: Gemini 3 Flash for quick responses

### Rate Limits and Quotas

Be aware of Gemini API limitations:
- **Rate Limits**: Vary by model and usage tier
- **Token Limits**: Context window constraints
- **Cost**: Pay-per-use pricing model

Monitor your usage in the Google Cloud Console.

### Error Handling

The application includes comprehensive error handling for:
- API key validation
- Network connectivity issues
- Rate limit exceeded
- Invalid responses

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
src/
├── __tests__/             # Unit tests
├── __mocks__/             # Mock data and functions
└── components/
    └── __tests__/         # Component tests
```

### Manual Testing Checklist

- [ ] Application loads without errors
- [ ] File upload functionality works
- [ ] GitHub repository import works
- [ ] Chat interface responds correctly
- [ ] Dependency graph visualization renders
- [ ] All three agent modes function
- [ ] Error states are handled gracefully

## Deployment

### Build Process

1. **Environment Setup**
   ```bash
   # Ensure production environment variables are set
   export VITE_GEMINI_API_KEY=your_production_key
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Deploy Build**
   - The `dist/` folder contains production-ready files
   - Deploy to any static hosting service (Netlify, Vercel, GitHub Pages, etc.)

### Deployment Platforms

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# VITE_GEMINI_API_KEY = your_key_here
```

#### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### GitHub Pages
```bash
# Install gh-pages
npm i -g gh-pages

# Deploy
npm run build
gh-pages -d dist
```

### Environment Variables for Production

Ensure these are set in your deployment platform:

```env
VITE_GEMINI_API_KEY=your_production_api_key
VITE_APP_ENV=production
```

## Troubleshooting

### Common Issues

#### Build Errors
**Issue**: `Module not found` errors
**Solution**: Clear node_modules and reinstall
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

#### File Upload Issues
**Issue**: Files not loading
**Solution**: Check file size limits and supported formats

### Debug Mode

Enable debug logging by setting:
```env
VITE_DEBUG_MODE=true
```

Check browser console for detailed error messages.

### Getting Help

1. Check existing GitHub issues
2. Review the README.md for usage examples
3. Create a new issue with:
   - Error messages
   - Browser/OS information
   - Steps to reproduce

### Performance Optimization

- Use Fast mode for simple queries
- Limit file uploads to essential code
- Clear session data periodically
- Monitor API usage costs

---

For additional support, please refer to the main README.md or create an issue on GitHub.
