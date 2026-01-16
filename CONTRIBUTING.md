# Contributing to CodeAgent X

Thank you for your interest in contributing to CodeAgent X! This document provides guidelines and information for contributors.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)
- [Documentation](#documentation)

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## Getting Started

### Prerequisites
- Node.js 18+
- npm 8+
- Git
- Google AI Studio account (for testing Gemini integration)

### Setup
1. Fork the repository on GitHub
2. Clone your fork locally
3. Follow the setup instructions in [SETUP.md](./SETUP.md)
4. Create a feature branch for your changes

## Development Workflow

### Branch Naming Convention
- `feature/description-of-feature`
- `bugfix/issue-description`
- `docs/update-documentation`
- `refactor/component-name`

### Commit Message Format
Use conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(ui): add dark mode toggle
fix(api): handle rate limit errors gracefully
docs(readme): update installation instructions
```

### Pull Request Process

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clear, focused commits
   - Test your changes thoroughly
   - Update documentation if needed

3. **Run Quality Checks**
   ```bash
   npm run lint
   npm run build
   npm test
   ```

4. **Submit Pull Request**
   - Use a descriptive title
   - Provide detailed description of changes
   - Reference any related issues
   - Request review from maintainers

## Code Standards

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer `const` over `let`, avoid `var`

### React Components
- Use functional components with hooks
- Follow component naming conventions (PascalCase)
- Use TypeScript interfaces for props
- Implement proper error boundaries
- Optimize with `React.memo` when appropriate

### File Organization
```
src/
├── components/     # UI components
│   ├── ComponentName.tsx
│   ├── ComponentName.test.tsx
│   └── index.ts    # Barrel exports
├── services/       # Business logic
├── types/          # Type definitions
├── utils/          # Utility functions
└── constants/      # Constants and enums
```

### Styling
- Use Tailwind CSS classes
- Follow the established design system
- Maintain consistent spacing and colors
- Ensure responsive design

## Testing

### Testing Strategy
- Unit tests for utilities and services
- Integration tests for components
- E2E tests for critical user flows
- Mock external API calls

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test ComponentName.test.tsx
```

### Writing Tests
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test both success and error scenarios
- Aim for >80% code coverage

Example:
```typescript
describe('MessageBubble', () => {
  it('renders user message correctly', () => {
    const message = { id: '1', role: 'user', text: 'Hello', timestamp: Date.now() };
    render(<MessageBubble message={message} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Submitting Changes

### Before Submitting
- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main

### Pull Request Template
Please use the following template for pull requests:

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe the testing performed:
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] All existing tests pass

## Screenshots (if applicable)
Add screenshots to show visual changes.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
```

## Reporting Issues

### Bug Reports
When reporting bugs, please include:

- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Steps to reproduce**: Detailed steps
- **Environment**: Browser, OS, Node version
- **Screenshots**: If applicable
- **Console errors**: Browser console output

### Feature Requests
For feature requests, please provide:

- **Problem**: What's the problem you're trying to solve
- **Solution**: Describe your proposed solution
- **Alternatives**: Any alternative solutions considered
- **Use case**: How would this feature be used

## Documentation

### Updating Documentation
- Keep README.md current with new features
- Update SETUP.md for installation changes
- Add code comments for complex logic
- Update API documentation for service changes

### Documentation Standards
- Use Markdown for all documentation
- Include code examples where helpful
- Keep language clear and concise
- Use consistent formatting

## Recognition

Contributors will be recognized in:
- GitHub repository contributors list
- Changelog for significant contributions
- Project documentation

## Getting Help

- Check existing issues and documentation first
- Join our community discussions
- Contact maintainers for guidance

Thank you for contributing to CodeAgent X! 🚀
