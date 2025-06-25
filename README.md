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
- [Database Management](#database-management)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Key Features

### Core Modules
- **📦 Procurement Management**: Streamline purchase orders, record purchases, and vehicle arrivals
- **💰 Sales Management**: Track sales orders, dispatch management, and customer interactions
- **📊 Inventory Control**: Real-time inventory tracking, adjustments, and stock management
- **🤝 Partner Portal**: Customer and supplier management with detailed profiles
- **💳 Financial Management**: Payment tracking, ledger management, and financial reporting
- **📈 Dashboard Analytics**: Real-time KPIs, charts, and business insights

### Advanced Features
- **🏢 Multi-Organization Support**: Manage multiple organizations with isolated data
- **👥 User Management**: Role-based access control (Admin, Super Admin, Regular Users)
- **🔐 Secure Authentication**: JWT-based authentication with Supabase
- **📱 Responsive Design**: Mobile-first design that works on all devices
- **🔄 Real-time Updates**: Live data synchronization across all modules
- **📋 Purchase Record Closure**: Multi-stage purchase completion workflow
- **💸 Multiple Payment Support**: Handle partial and multiple payments per transaction

## Tech Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **Radix UI** for accessible component primitives
- **React Router DOM** for client-side routing
- **Lucide React** for consistent iconography
- **React Hot Toast** for user notifications
- **Date-fns** for date manipulation

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL database with Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication and authorization
  - Automated migrations

### Development Tools
- **TypeScript** for static type checking
- **ESLint** for code linting
- **GitHub Actions** for CI/CD
- **Supabase CLI** for database management

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher) or **yarn**
- **Git**
- **Supabase CLI** (for database management)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bindalkapil/FxDPartnerERP.git
   cd FxDPartnerERP
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your Supabase configuration:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**:
   ```bash
   # Install Supabase CLI globally
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link to your project
   supabase link --project-ref your-project-id
   
   # Apply migrations
   npm run supabase:push
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser** and navigate to `http://localhost:5173`

## Usage

### Authentication
The system supports multiple user roles:
- **Super Admin**: Full system access across all organizations
- **Admin**: Organization-level administrative access
- **User**: Standard user access within assigned organization

### Navigation
- **Sidebar Navigation**: Access all modules (Dashboard, Sales, Procurement, Inventory, Partners, Finance)
- **Organization Switcher**: Switch between organizations (for multi-org users)
- **User Menu**: Profile settings, logout, and user-specific actions

### Key Workflows

#### Procurement Process
1. **Record Purchase** → Create purchase records with supplier details
2. **Vehicle Arrival** → Track incoming shipments and update inventory
3. **Purchase Closure** → Complete multi-stage purchase workflow

#### Sales Process
1. **Create Sale** → Generate sales orders with customer information
2. **Dispatch Management** → Handle order fulfillment and shipping
3. **Payment Tracking** → Record payments and manage outstanding amounts

#### Inventory Management
- Real-time stock tracking
- Inventory adjustments
- Low stock alerts
- Product management with SKU codes

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── charts/         # Chart components for analytics
│   ├── dashboard/      # Dashboard-specific components
│   ├── forms/          # Form components
│   ├── modals/         # Modal dialogs
│   ├── navigation/     # Navigation components
│   └── ui/             # Base UI components
├── contexts/           # React contexts for state management
├── layouts/            # Layout components
├── lib/                # Utility functions and API clients
├── pages/              # Page components organized by module
│   ├── admin/          # Admin panel pages
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard pages
│   ├── finance/        # Financial management pages
│   ├── inventory/      # Inventory management pages
│   ├── partners/       # Customer/Supplier management pages
│   ├── procurement/    # Procurement management pages
│   ├── sales/          # Sales management pages
│   ├── settings/       # Settings pages
│   └── superadmin/     # Super admin pages
└── types/              # TypeScript type definitions

supabase/
├── config.toml         # Supabase configuration
└── migrations/         # Database migration files

.github/
└── workflows/          # GitHub Actions for CI/CD
```

## Database Management

### Available Scripts
```bash
# Local Development
npm run supabase:start      # Start local Supabase instance
npm run supabase:stop       # Stop local Supabase instance
npm run supabase:reset      # Reset local database

# Migration Management
npm run supabase:diff       # Generate migration from schema changes
npm run supabase:push       # Push migrations to remote
npm run supabase:pull       # Pull remote schema changes

# Type Generation
npm run supabase:generate-types  # Generate TypeScript types from database

# Status and Verification
npm run supabase:status     # Check Supabase status
npm run supabase:verify     # Verify migration integrity
```

### Migration Workflow
1. Make schema changes locally
2. Generate migration: `npm run supabase:diff`
3. Test locally: `npm run supabase:reset`
4. Push to remote: `npm run supabase:push`

## Deployment

### Automatic Deployment
The project is automatically deployed to GitHub Pages via GitHub Actions:
- **Trigger**: Push to `main` branch
- **URL**: [https://bindalkapil.github.io/FxDPartnerERP](https://bindalkapil.github.io/FxDPartnerERP)
- **Workflow**: `.github/workflows/deploy-pages.yml`

### Manual Deployment
```bash
npm run deploy
```

### Environment Variables
Configure these secrets in your GitHub repository:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### GitHub Pages Setup
1. Go to repository Settings → Pages
2. Set source to "GitHub Actions"
3. Add required environment variables to repository secrets

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Ensure responsive design
- Add proper error handling
- Write meaningful commit messages
- Test your changes thoroughly

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by the Vegrow Tech Team
