# GitHub Pages Deployment Guide

This document provides a comprehensive guide for deploying the FxD Partner ERP system to GitHub Pages.

## Overview

The project is configured for automatic deployment to GitHub Pages using GitHub Actions. The deployment URL will be:
**https://bindalkapil.github.io/FxDPartnerERP**

## Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to a GitHub repository
2. **GitHub Pages Enabled**: GitHub Pages must be enabled in repository settings
3. **Environment Variables**: Supabase credentials must be configured as repository secrets

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your GitHub repository
2. Navigate to **Settings** → **Pages**
3. Under "Source", select **GitHub Actions**
4. Save the settings

### 2. Configure Repository Secrets

Add the following secrets in **Settings** → **Secrets and variables** → **Actions**:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### 3. Deployment Workflow

The deployment is handled by `.github/workflows/deploy-pages.yml` which:

1. **Triggers on**:
   - Push to `main` branch (excluding Supabase migration files)
   - Manual workflow dispatch

2. **Build Process**:
   - Installs Node.js dependencies
   - Injects environment variables from GitHub secrets
   - Builds the React application with Vite
   - Optimizes for production

3. **Deployment**:
   - Uploads build artifacts to GitHub Pages
   - Deploys to the live site

## Configuration Files

### Vite Configuration (`vite.config.ts`)
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/FxDPartnerERP/',  // GitHub Pages subdirectory
  build: {
    outDir: 'dist',
  },
  // ... other config
});
```

### Package.json Updates
```json
{
  "homepage": "https://bindalkapil.github.io/FxDPartnerERP",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

### SPA Routing Support
- `public/404.html`: Handles client-side routing for direct URL access
- `index.html`: Contains SPA routing script for GitHub Pages compatibility

## Manual Deployment

If you need to deploy manually:

```bash
# Build the project
npm run build

# Deploy using gh-pages
npm run deploy
```

## Troubleshooting

### Common Issues

1. **404 Errors on Direct Routes**
   - Ensure `public/404.html` is present
   - Verify SPA routing script in `index.html`

2. **Environment Variables Not Working**
   - Check repository secrets are correctly named
   - Verify secrets are accessible to the workflow

3. **Build Failures**
   - Check Node.js version compatibility
   - Ensure all dependencies are properly installed

4. **Assets Not Loading**
   - Verify `base: '/FxDPartnerERP/'` in `vite.config.ts`
   - Check asset paths are relative

### Debugging Steps

1. **Check Workflow Logs**:
   - Go to **Actions** tab in GitHub repository
   - Click on the failed workflow run
   - Review build and deployment logs

2. **Test Local Build**:
   ```bash
   npm run build
   npm run preview
   ```

3. **Verify Environment Variables**:
   - Ensure secrets are set in repository settings
   - Check variable names match exactly

## Deployment Status

You can monitor deployment status:

1. **GitHub Actions**: Check the **Actions** tab for workflow runs
2. **Pages Settings**: View deployment history in **Settings** → **Pages**
3. **Live Site**: Visit https://bindalkapil.github.io/FxDPartnerERP

## Migration from Netlify

If migrating from Netlify:

1. **Environment Variables**: Transfer Supabase credentials to GitHub secrets
2. **Custom Domain**: Update DNS if using custom domain
3. **Redirects**: GitHub Pages handles SPA routing differently than Netlify
4. **Build Settings**: GitHub Actions replaces Netlify build settings

## Security Considerations

- **Public Repository**: Environment variables are safely handled through GitHub secrets
- **Frontend Variables**: Only `VITE_` prefixed variables are exposed to the frontend
- **Supabase Keys**: Anonymous keys are safe for frontend use

## Performance Optimization

The deployment includes:

- **Asset Optimization**: Vite handles asset bundling and optimization
- **Code Splitting**: React components are automatically code-split
- **Caching**: GitHub Pages provides CDN caching
- **Compression**: Assets are automatically compressed

## Support

For deployment issues:

1. Check this documentation
2. Review GitHub Actions logs
3. Verify repository settings
4. Test local build process

---

**Note**: This deployment replaces the previous Netlify deployment. Ensure all environment variables and settings are properly migrated before discontinuing Netlify.
