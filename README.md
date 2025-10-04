# OberaConnect Interface Platform

## 🎯 Platform Overview

OberaConnect is a clause-aware, multi-tenant SaaS platform that provides AI-powered integrations and department-specific dashboards for MSP (Managed Service Provider) operations. The platform enables seamless integration with billing, security, RMM, and compliance systems while maintaining customer-specific customization and branding.

## 🏗️ Architecture Philosophy

This project follows a **modular, documented, and role-independent** development strategy designed for:
- **Resilience**: Platform remains operational regardless of team changes
- **Maintainability**: Clear separation of concerns and documentation
- **Extensibility**: New features can be added without full system knowledge

## 📋 Quick Start

### Prerequisites
- Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Git

### Installation
```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start development server
npm run dev
```

## 🧩 Technology Stack

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn-ui + Radix UI
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Lovable Cloud (Supabase)
- **State Management**: TanStack Query
- **Routing**: React Router v6
- **Authentication**: Supabase Auth

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn)
│   └── [feature]/      # Feature-specific components
├── pages/              # Route-level pages
│   ├── Auth.tsx        # Authentication
│   ├── Index.tsx       # Landing page
│   ├── *Dashboard.tsx  # Department dashboards
│   └── IntegrationsPage.tsx
├── hooks/              # Custom React hooks
│   ├── useCustomerCustomization.tsx
│   └── useDemoMode.tsx
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client & types
└── lib/                # Utility functions

supabase/
├── functions/          # Edge functions
│   ├── department-assistant/  # AI assistant endpoints
│   └── mcp-server/            # MCP server integration
└── migrations/         # Database migrations
```

## 🔑 Key Features

### 1. Employee Portal & Application Launcher (NEW)
- 🏢 **Unified Employee Portal**: Single sign-on access to all work applications
- 🚀 **App Launcher**: Dynamic application tiles based on role/department
- 🔐 **Microsoft 365 Integration**: Native OAuth authentication with account linking
- 🎯 **Role-Based Access**: Applications shown based on employee department (IT, HR, Finance, Sales, Operations, Executive)
- ⚙️ **Admin Panel**: Manage applications and configure department access (`/admin/applications`)
- 📱 **Scalable**: Add new applications without code changes

**⚠️ CRITICAL SETUP REQUIRED:**
1. **Enable Azure Provider** in Lovable Cloud backend (Item #1 in [`URGENT_NEXT_STEPS.md`](./URGENT_NEXT_STEPS.md))
2. Configure Azure AD app permissions (Item #2)

### 2. Microsoft 365 Integration
- 🔐 **Single Sign-On**: Native Microsoft 365 OAuth authentication
- 🔗 **Account Linking**: Link Microsoft 365 to existing email accounts
- 📧 **Email Access**: View recent emails with read status
- 📅 **Calendar Integration**: Display upcoming calendar events
- 💬 **Teams Integration**: Access recent Teams chats and conversations
- 📁 **OneDrive/SharePoint**: File browser (coming soon)
- 👤 **User Profile**: Sync Microsoft 365 profile data
- 🔄 **Reconnect Flow**: Graceful token expiration handling

**Technical Details:** See [`MICROSOFT365_INTEGRATION.md`](./MICROSOFT365_INTEGRATION.md)

### 3. Customer Customization
- Per-customer branding (logo, colors)
- Enabled features and integrations
- Custom dashboard layouts
- Role-based access control

### 4. Department-Specific Dashboards
- **Admin**: Customer management and system overview
- **Compliance**: Framework tracking, controls, evidence
- **IT & Security**: Integration status, server health, anomalies
- **Operations**: Workflow efficiency, ML insights
- **HR**: Employee management, session tracking
- **Finance**: Revenue, subscriptions, customer data
- **Sales**: Pipeline, deals, forecasting
- **Executive**: KPIs, compliance metrics, strategic overview

### 5. Integration Management
- **Microsoft 365**: Calendar, Email, Teams, OneDrive (NEW)
- Onebill/rev.io (Billing & Revenue)
- Azure, Lighthouse, CIPP (Cloud & Identity)
- SonicWall, UniFi, MikroTik (Network Security)
- Keeper Security (Password & Access Management)
- NinjaOne (RMM & Infrastructure)
- Threatdown, OpenText (Cybersecurity)

### 6. AI-Powered Assistance
- Department-specific AI assistants
- MCP (Model Context Protocol) server integration
- Lovable AI for seamless model access

## 🗄️ Database Schema

### Core Tables
- `customers` - Customer organizations
- `user_profiles` - User accounts with department roles
- `customer_customizations` - Per-customer UI/feature settings
- `applications` - Employee application registry (NEW)
- `application_access` - Role/department-based app access control (NEW)
- `integrations` - System integration configurations
- `mcp_servers` - MCP server registry
- `compliance_frameworks` - Compliance tracking
- `ml_insights` - Machine learning analytics
- `workflows` - Operations workflow management

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed schema documentation.

## 🔐 Security & Authentication

- Row Level Security (RLS) policies on all tables
- Department-based access control
- Auto-confirm email signups (development)
- Customer-isolated data access

## 🚀 Deployment

### Via Lovable
1. Open [Lovable Project](https://lovable.dev/projects/2e37e4cf-64eb-4e9a-8cf1-14b876d69899)
2. Click Share → Publish

### Custom Domain
Navigate to Project > Settings > Domains and click Connect Domain.
[Documentation](https://docs.lovable.dev/features/custom-domain#custom-domain)

## 📚 Documentation

### 🚨 Priority Documentation (Read First)
- [**URGENT_NEXT_STEPS.md**](./URGENT_NEXT_STEPS.md) - **Critical blockers and immediate action items**
- [**MICROSOFT365_INTEGRATION.md**](./MICROSOFT365_INTEGRATION.md) - **Microsoft 365 technical documentation**

### Architecture & Development
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and design decisions
- [ONBOARDING.md](./ONBOARDING.md) - New developer onboarding guide
- [MODULE_STRUCTURE.md](./MODULE_STRUCTURE.md) - Module organization and dependencies
- [API_REFERENCE.md](./API_REFERENCE.md) - API endpoints and data flows
- [DEVELOPER_HANDOFF.md](./DEVELOPER_HANDOFF.md) - Knowledge transfer protocol

## 🔄 Development Workflow

### Version Control Discipline
- Feature branches for all new work
- Pull request reviews required
- Commit messages follow conventional commits
- All changes traceable and reversible

### Code Standards
- TypeScript strict mode enabled
- ESLint + Prettier for code quality
- Component-driven development
- Design system tokens for all styling (no hardcoded colors)

### Testing Strategy
- Manual testing via preview environment
- Integration testing for critical flows
- Database migrations tested before production

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes with clear commit messages
3. Test thoroughly in preview environment
4. Create pull request with description
5. Update relevant documentation

## 📞 Support & Resources

- **Lovable Documentation**: [docs.lovable.dev](https://docs.lovable.dev/)
- **Project URL**: [Lovable Project](https://lovable.dev/projects/2e37e4cf-64eb-4e9a-8cf1-14b876d69899)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)

## 📄 License

Proprietary - OberaConnect Platform

---

**Developer Continuity Note**: This project is designed for organizational resilience. All strategic design decisions, architecture patterns, and business logic are documented to ensure continuity across team transitions.