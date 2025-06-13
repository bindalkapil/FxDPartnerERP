# FxD Partner ERP System

A comprehensive Enterprise Resource Planning (ERP) solution designed specifically for FxD partners to manage their procurement, sales, inventory, and financial operations efficiently.

🌐 **Live Demo**: [https://bindalkapil.github.io/FxDPartnerERP](https://bindalkapil.github.io/FxDPartnerERP)

## Table of Contents
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)

## Key Features

- **Procurement Management**: Streamline purchase orders and vendor management
- **Sales Tracking**: Monitor sales orders and customer interactions
- **Inventory Control**: Real-time inventory tracking and management
- **Partner Portal**: Dedicated space for partner management and collaboration
- **Financial Reporting**: Comprehensive financial tracking and reporting tools
- **User Management**: Role-based access control and user permissions
- **Dashboard**: Real-time analytics and key performance indicators

## Tech Stack

- **Frontend**: 
  - React 18
  - TypeScript
  - Tailwind CSS
  - Vite
  - React Router DOM
  - Lucide React (Icons)
  - React Hot Toast (Notifications)

- **Backend & Database**:
  - Supabase (Backend as a Service)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm (v8 or higher) or yarn
- Git
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Supabase CLI (for local development and database migrations)

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Vegrow-Tech/FxDPartnerERP.git
   cd FxDPartnerERP
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**:
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Update the `.env` file with your Supabase configuration:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Database Setup** (First time only):
   - Install Supabase CLI: `npm install -g supabase`
   - Login to Supabase: `supabase login`
   - Link to your project: `supabase link --project-ref your-project-id`
   - For detailed setup instructions, see [SUPABASE_DEPLOYMENT.md](./SUPABASE_DEPLOYMENT.md)

5. **Start the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser** and navigate to `http://localhost:5173`

## Usage

1. **Login**:
   - Use your provided credentials to log in to the system
   - Demo credentials (if available for development):
     - Email: demo@fxdpartner.com
     - Password: demo123

2. **Navigation**:
   - Use the sidebar to navigate between different modules
   - The top navigation provides quick access to notifications and user settings

3. **Dashboard**:
   - View key metrics and recent activities
   - Access quick actions for common tasks

## Database Migrations

This project uses automated Supabase migrations deployed via GitHub Actions. 

### For Developers:
- **Creating migrations**: `supabase migration new migration_name`
- **Local testing**: `npm run supabase:start` and `npm run supabase:reset`
- **Deployment**: Automatic on push to main branch

### Available Scripts:
```bash
npm run supabase:start      # Start local Supabase
npm run supabase:stop       # Stop local Supabase
npm run supabase:status     # Check status
npm run supabase:diff       # Check differences
npm run supabase:push       # Push migrations
npm run supabase:pull       # Pull remote schema
```

For detailed migration setup and troubleshooting, see [SUPABASE_DEPLOYMENT.md](./SUPABASE_DEPLOYMENT.md).

## Deployment

This project is automatically deployed to GitHub Pages using GitHub Actions.

### Automatic Deployment
- **Trigger**: Push to `main` branch (excluding Supabase migration files)
- **URL**: [https://bindalkapil.github.io/FxDPartnerERP](https://bindalkapil.github.io/FxDPartnerERP)
- **Workflow**: `.github/workflows/deploy-pages.yml`

### Manual Deployment
You can also deploy manually using the gh-pages package:
```bash
npm run deploy
```

### Environment Variables for Deployment
The following GitHub repository secrets must be configured:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Setting up GitHub Pages
1. Go to your repository settings
2. Navigate to "Pages" section
3. Set source to "GitHub Actions"
4. Add the required environment variables to repository secrets

For detailed GitHub Pages setup and troubleshooting, see [GITHUB_PAGES_DEPLOYMENT.md](./GITHUB_PAGES_DEPLOYMENT.md).

## Project Structure

```
src/
├── assets/          # Static assets (images, fonts, etc.)
├── components/      # Reusable UI components
├── config/          # Application configuration
├── contexts/        # React contexts
├── hooks/           # Custom React hooks
├── layouts/         # Layout components
├── lib/             # Utility functions and libraries
├── pages/           # Page components
├── services/        # API services
├── types/           # TypeScript type definitions
└── utils/           # Helper functions

supabase/
├── config.toml      # Supabase configuration
└── migrations/      # Database migration files

.github/
└── workflows/       # GitHub Actions for automated deployment
```



Built with ❤️ by the Vegrow Tech Team
