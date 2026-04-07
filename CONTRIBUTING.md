# Contributing to ChainLoyalty MCP Server

Thank you for your interest in contributing! This guide will help you get started.

## 🤝 How to Contribute

### Reporting Bugs

- Use the [Bug Report issue template](.github/ISSUE_TEMPLATE/bug_report.md)
- Provide clear steps to reproduce
- Include environment details (OS, Node version, etc.)
- Add relevant logs or screenshots

### Suggesting Features

- Use the [Feature Request issue template](.github/ISSUE_TEMPLATE/feature_request.md)
- Describe the use case clearly
- Explain why it would be valuable
- Consider if it fits the project scope

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed
4. **Commit your changes**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Git

### Local Development

1. Clone your fork
   ```bash
   git clone https://github.com/N1KH1LT0X1N/ChainLoyalty-MCP.git
   cd ChainLoyalty-MCP
   ```

2. Install dependencies
   ```bash
   npm install --ignore-scripts --force
   ```

3. Set up environment
   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL
   ```

4. Generate Prisma client
   ```bash
   npx prisma generate
   ```

5. Start development server
   ```bash
   npx mcp-use dev
   ```

## 📝 Code Style Guidelines

### TypeScript

- Use strict TypeScript settings
- Provide proper types for all functions
- Prefer interfaces over types for object shapes

### Tools & Resources

- Follow the existing tool structure in `src/tools/`
- Use Zod for input validation
- Return consistent response formats
- Include helpful error messages

### Widgets

- Follow the component structure in `resources/`
- Use Tailwind CSS for styling
- Ensure responsive design
- Add loading states for async operations

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

### Writing Tests

- Unit tests for tool logic
- Integration tests for database operations
- Widget component tests
- Mock external dependencies

## 📚 Documentation

### Updating Docs

- Keep README.md up to date
- Document new tools in the tools table
- Add inline comments for complex logic
- Update API documentation

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

## 🚀 Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create a GitHub release
4. Deploy to MCP-Use

## 💬 Getting Help

- Open an issue for questions
- Join our Discord community (link coming soon)
- Check existing issues and discussions

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
