# FxD Partner ERP System

A comprehensive Enterprise Resource Planning (ERP) solution designed specifically for FxD partners to manage their procurement, sales, inventory, and financial operations efficiently.

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
- Supabase CLI (for local development)

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
   - Create a `.env` file in the root directory
   - Add your Supabase configuration:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Start the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser** and navigate to `http://localhost:5173`

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
```



Built with ❤️ by the Vegrow Tech Team
