# GEMINI.md: OberaConnect ERP Platform

This document provides a comprehensive overview of the OberaConnect ERP project, its architecture, and development conventions to be used as instructional context for AI-assisted development.

## 1. Project Overview

OberaConnect is a sophisticated, multi-tenant SaaS platform designed as an all-in-one solution for Managed Service Providers (MSPs). It features a modular, "hub-and-spoke" architecture with a rich feature set.

-   **Purpose**: To provide MSPs with AI-powered integrations and department-specific dashboards for operations, including billing, security, RMM, and compliance.
-   **Frontend**: A modern React (v18) and TypeScript application built with Vite. It uses `shadcn/ui` for components, Tailwind CSS for styling, TanStack Query for state management, and React Router for navigation.
-   **Backend**: A serverless backend powered by Supabase (internally referred to as "Lovable Cloud"), making extensive use of its Postgres database, Edge Functions for business logic, and Supabase Auth for authentication.
-   **Architecture**: The system is designed around a database-centric "hub-and-spoke" model. The Supabase database acts as the central hub and single source of truth, while all features (dashboards, integrations, etc.) are "spokes" that interact with it. This ensures a clean separation of concerns and high scalability. Data is isolated between tenants using Postgres Row Level Security (RLS).
-   **Key Features**:
    -   Department-specific dashboards (Sales, Finance, IT, HR, etc.).
    -   Extensive third-party integrations (Microsoft 365, NinjaOne, CIPP).
    -   A full-fledged Configuration Management Database (CMDB).
    -   A visual workflow builder and automation engine.
    -   AI-powered assistants and features.

## 2. Building and Running

The project uses `npm` for package management and `vite` as its build tool.

### Key Commands

-   **Install Dependencies**:
    ```bash
    npm install
    ```

-   **Run Development Server**: Starts the application locally, typically on `http://localhost:5173`.
    ```bash
    npm run dev
    ```

-   **Build for Production**: Compiles and bundles the application for deployment.
    ```bash
    npm run build
    ```

-   **Lint Code**: Analyzes the code for style and quality issues using ESLint.
    ```bash
    npm run lint
    ```

-   **Preview Production Build**: Serves the production build locally for testing.
    ```bash
    npm run preview
    ```

## 3. Development Conventions

The project adheres to a set of modern and professional development practices.

-   **Technology Stack**:
    -   **Frontend**: React, TypeScript, Vite, Tailwind CSS, `shadcn/ui`.
    -   **Backend**: Supabase (Postgres, Edge Functions in Deno/TypeScript).
    -   **State Management**: TanStack Query for server state.
    -   **Routing**: React Router.
    -   **Styling**: A design token system is used for all styling (no hardcoded colors).

-   **Code Style & Quality**:
    -   TypeScript is used with `strict` mode enabled.
    -   Code formatting and quality are enforced by ESLint and Prettier.
    -   The codebase is highly modular, with a clear separation of concerns between pages, reusable components, hooks, and utilities.

-   **Architecture & Patterns**:
    -   **Hub-and-Spoke Model**: All development should align with the central database-centric architecture.
    -   **Component-Driven Development**: New UI should be built as reusable components where possible.
    -   **Serverless Functions**: Backend logic is encapsulated in single-purpose Supabase Edge Functions.
    -   **Security**: All database tables are protected with Row Level Security (RLS) to ensure strict data isolation between tenants.

-   **Testing**:
    -   The project has a custom-built "System Validation Dashboard" (`/test/validation`) for running a suite of automated checks, including database schema validation, RLS policy tests, and edge function health checks.
    -   While a formal testing framework like Jest or Cypress is not explicitly mentioned in `package.json`, the testing philosophy is robust and documented in `TESTING_GUIDE.md`. The focus is on integrated validation rather than isolated unit tests.

-   **Documentation**:
    -   The project is **exceptionally well-documented**. Before starting any work, developers should consult the `DOCUMENTATION_INDEX.md` and `ARCHITECTURE.md` files.
    -   All new features or changes should be accompanied by corresponding documentation updates.
