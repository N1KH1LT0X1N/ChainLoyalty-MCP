# NPM Publishing Guide

This guide explains how to publish the ChainLoyalty MCP Server to NPM.

## Prerequisites

1. **NPM Account**: You need an NPM account. If you don't have one, sign up at [npmjs.com](https://www.npmjs.com/)
2. **Organization**: The package is scoped under `@chainloyalty`. You'll need to:
   - Either create the `@chainloyalty` organization on NPM
   - Or change the package name to your preferred scope

## Setup

### 1. Login to NPM

```bash
npm login
```

Enter your NPM username, password, and email when prompted.

### 2. Verify Package Configuration

The `package.json` is already configured with:
- `name`: `@chainloyalty/mcp-server`
- `version`: `1.0.0`
- `publishConfig.access`: `public` (required for scoped packages)
- `files`: Specifies which files to include in the package

### 3. Update Package Name (if needed)

If you want to publish under a different scope, update the name in `package.json`:

```json
{
  "name": "@yourscope/mcp-server"
}
```

## Publishing

### Manual Publishing

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Dry run (optional)**:
   ```bash
   npm publish --dry-run
   ```
   This shows what files will be published without actually publishing.

3. **Publish**:
   ```bash
   npm publish --access public
   ```

### Automated Publishing (GitHub Actions)

The repository includes a GitHub Actions workflow that automatically publishes to NPM when you create a release.

1. **Add NPM_TOKEN to GitHub Secrets**:
   - Go to GitHub → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your NPM authentication token (get it from npmjs.com → Access Tokens)

2. **Create a Release**:
   - Go to GitHub → Releases → Create a new release
   - Tag: `v1.0.0` (or your version)
   - Title: "Release v1.0.0"
   - Description: Release notes
   - Click "Publish release"

3. **Workflow runs automatically**:
   - The workflow will build and publish to NPM
   - Check the Actions tab for status

## Version Management

### Semantic Versioning

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes (x.0.0)
- **MINOR**: New features (0.x.0)
- **PATCH**: Bug fixes (0.0.x)

### Updating Version

1. Update version in `package.json`:
   ```bash
   npm version patch  # or minor, or major
   ```

2. Or manually edit `package.json`:
   ```json
   {
     "version": "1.0.1"
   }
   ```

3. Update `CHANGELOG.md` with the new version

4. Commit and push:
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: bump version to 1.0.1"
   git push
   ```

## Package Contents

The following files are included in the NPM package (defined in `files` array):

- `dist/` - Built JavaScript files
- `prisma/` - Prisma schema and migrations
- `resources/` - React widgets
- `docs/` - Documentation and images
- `README.md` - Main documentation
- `LICENSE` - MIT license
- `.env.example` - Environment variable template

## Testing Before Publishing

1. **Local Testing**:
   ```bash
   npm pack
   ```
   This creates a `.tgz` file you can inspect.

2. **Install locally**:
   ```bash
   npm install ./chainloyalty-mcp-server-1.0.0.tgz
   ```

3. **Test in another project**:
   ```bash
   mkdir test-project
   cd test-project
   npm init -y
   npm install ../path/to/chainloyalty-mcp-server-1.0.0.tgz
   ```

## Post-Publishing

After publishing:

1. **Verify on NPM**:
   - Visit: https://www.npmjs.com/package/@chainloyalty/mcp-server
   - Check that all files are present
   - Verify README is rendered correctly

2. **Update Documentation**:
   - Add installation instructions to README
   - Update any "coming soon" sections

3. **Announce**:
   - Share on social media
   - Post in relevant communities
   - Update project website

## Troubleshooting

### "You do not have permission to publish..."

- Ensure you're logged in: `npm login`
- For scoped packages, ensure you have access to the organization
- For new organizations, create it first: `npm org create @chainloyalty`

### "Package name is too similar..."

- NPM has name similarity rules
- Use a more unique name or scope

### "Version already exists"

- You cannot publish the same version twice
- Bump the version number before publishing

### "npm ERR! 404 Not Found"

- Scoped packages need `--access public` flag
- Check that the scope name is correct

## Commands Summary

```bash
# Login
npm login

# Build
npm run build

# Dry run (preview what will be published)
npm publish --dry-run

# Publish (manual)
npm publish --access public

# Check published package
npm view @chainloyalty/mcp-server

# Install published package
npm install @chainloyalty/mcp-server

# Update version
npm version patch|minor|major
```

## Support

For help with NPM publishing:
- [NPM Documentation](https://docs.npmjs.com/)
- [Publishing Scoped Packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages)
- [Semantic Versioning](https://semver.org/)

---

**Next Steps**: Follow the steps above to publish your package to NPM!
