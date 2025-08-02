# Linky Pay

## Overview

Linky Pay is a full-stack product management system built with Express.js backend and React frontend. The application provides comprehensive product inventory management, customer assignment tracking, and Stripe payment integration capabilities. It supports multiple product entry methods including manual entry, CSV/Excel import, and OCR-based image processing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Authentication System
**Changed from Replit Auth to Email-Based Authentication (January 30, 2025)**
- Users register with email/password instead of requiring Replit account access
- Email verification system with secure tokens (24-hour expiry)
- Password hashing using Node.js crypto.scrypt
- Session management with PostgreSQL session store
- Development mode logs verification URLs when email credentials not configured

### Data Isolation System
**Implemented User-Scoped Data Access (February 2, 2025)**
- Added userId field to products table to enforce data isolation
- All product operations (create, read, update, delete) are now user-specific
- Each user only sees and can manage their own products
- Updated CSV/Excel import and OCR processing to create user-scoped products
- Stats dashboard shows user-specific metrics (products, assignments, payments)

### Full-Stack Monorepo Structure
The application follows a monorepo pattern with clear separation between client, server, and shared code:
- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js with TypeScript, Passport.js for authentication
- **Shared**: Common schemas and types shared between frontend and backend
- **Database**: PostgreSQL with Drizzle ORM

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **File Processing**: Multer for file uploads, XLSX for spreadsheet parsing, Tesseract.js for OCR
- **Payment Processing**: Stripe integration for payment links

## Key Components

### Database Schema
The system uses PostgreSQL with the following main entities:
- **Users**: User accounts with Stripe customer integration
- **System Users**: Imported users for assignment purposes (separate from auth users)
- **Products**: Product catalog with pricing and categorization
- **User Assignments**: Linking users to products with assignment tracking
- **Payment Links**: Stripe payment links associated with user assignments
- **Upload Sessions**: Tracking file upload and processing sessions

### API Endpoints
- **Products**: CRUD operations, search, and bulk import
- **System Users**: CRUD operations for imported users
- **User Intake**: CSV/Excel import and OCR processing for user lists
- **Assignments**: Create and manage user-product assignments
- **Payment Links**: Generate Stripe payment links for assigned products
- **File Upload**: CSV/Excel import and OCR processing endpoints
- **Stats**: Dashboard statistics and analytics

### Frontend Pages
- **Dashboard**: Overview with user-specific statistics and product listing
- **Add Products**: Multiple product entry methods (manual, CSV, OCR)
- **User Intake**: Import users via Excel/CSV files or handwritten photos with OCR
- **User Assignments**: Assign products to users and view assignments
- **Payment Links**: Generate and manage Stripe payment links

### UI/UX Improvements
**Cleaned Up Header Interface (February 2, 2025)**
- Removed non-functional notification bell and hardcoded "Admin User" text
- Removed redundant user information display (already shown in sidebar)
- Streamlined header to focus on page titles and navigation context
- Simplified interface focuses on essential functionality

**Improved Navigation Labels (February 2, 2025)**
- Changed "User Intake" to "Customer Intake" for better business context
- Changed "User Assignments" to "Assign Products to Customers" for clearer functionality
- Updated sidebar navigation, page headers, and all content within pages for consistency
- All references to "users" changed to "customers" throughout the interface

**App Rebranding (February 2, 2025)**
- Changed app name from "Fashion Product Dashboard"/"ProductHub" to "Linky Pay"
- Updated all instances across landing page, authentication page, sidebar, and HTML title
- Maintains focus on payment link generation and customer management functionality

## Data Flow

### Product Management Flow
1. Products can be added via three methods:
   - Manual entry through forms
   - Bulk import via CSV/Excel files
   - OCR processing of product images
2. All products are stored in the PostgreSQL database
3. Products can be searched and filtered by category

### User Intake Flow
1. Users can be imported via three methods:
   - Manual entry through forms
   - Bulk import via CSV/Excel files
   - OCR processing of handwritten or printed user lists
2. OCR supports both English and Mandarin Chinese text recognition
3. System automatically extracts names, emails, phone numbers from text
4. All imported users are stored in the system_users table

### Assignment Workflow
1. Users select products and assign them to specific users
2. Assignments track user details and assigned products
3. Assignment data is used to generate payment links

### Payment Processing
1. Payment links are generated for user assignments
2. Stripe handles the actual payment processing
3. Payment status is tracked and updated via webhooks

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL (serverless PostgreSQL)
- **Payment Processing**: Stripe for payment links and processing
- **File Processing**: 
  - XLSX for Excel/CSV parsing
  - Tesseract.js for OCR functionality
  - Multer for file upload handling

### UI Dependencies
- **Component Library**: Radix UI primitives
- **Styling**: Tailwind CSS with shadcn/ui components
- **Icons**: Lucide React icon library
- **Form Handling**: React Hook Form with Hookform resolvers

### Development Tools
- **Build**: Vite with React plugin
- **TypeScript**: Full TypeScript support across the stack
- **Database Migrations**: Drizzle Kit for schema management

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: esbuild bundles TypeScript server code to `dist`
- **Shared Code**: TypeScript compilation with path mapping for shared schemas

### Environment Configuration
- **Database**: Requires `DATABASE_URL` environment variable for PostgreSQL connection
- **Stripe**: Requires `STRIPE_SECRET_KEY` for payment processing
- **Development**: Hot module replacement with Vite dev server
- **Production**: Static file serving with Express

### Development Workflow
- Development server runs backend and frontend concurrently
- Vite provides hot module replacement for frontend changes
- TypeScript compilation ensures type safety across the stack
- Database schema changes managed through Drizzle migrations

The application is designed to be deployed on platforms like Replit, with support for both development and production environments. The monorepo structure allows for easy development while maintaining clear separation of concerns between frontend, backend, and shared code.