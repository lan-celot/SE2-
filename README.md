# Installations needed
## run one by one in terminal!
```bash
npm install
```
```bash
npm install firebase
```
```bash
npm install -g firebase-tools
```
# not required to run as always: Update All Dependencies & Dev Dependencies (except tailwind)
```bash
npx npm-check-updates -u --reject tailwindcss
```

# run this after checking for updates
```bash
npm install
```

# Check for Updates Without Applying Changes
```bash
npx npm-check-updates
```

# Mar & Nor Auto Repair - Management System

A full-stack web application for managing car repair and maintenance services. This application provides separate interfaces for administrators and customers, with robust authentication and role-based access control.

## Table of Contents

- [Overview](#overview)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Admin Features](#admin-features)
- [Customer Features](#customer-features)
- [Authentication & Security](#authentication--security)
- [Database Structure](#database-structure)
- [Responsive Design](#responsive-design)
- [Deployment](#deployment)

## Overview

Mar & Nor Auto Repair is a comprehensive management system for a car repair shop. It enables customers to book appointments, track repair status, and view past transactions. Administrators can manage bookings, services, employees, inventory, and view detailed reports.

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Hooks (useState, useEffect)
- **Routing**: Next.js App Router
- **Charts & Visualizations**: Recharts
- **Form Handling**: React Hook Form
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Project Structure

The application follows Next.js 13+ App Router structure:

```
/app
  /admin - Admin-specific pages
    /dashboard - Admin dashboard
    /customers - Customer management
    /employees - Employee management
    /reservations - Booking management
    /sales - Sales and financial reports
    /transactions - Transaction management
  /customer - Customer-specific pages
    /dashboard - Customer dashboard
    /profile - User profile management
    /book - Booking interface
    /reservations - View reservations
    /transactions - View transactions
/components
  /admin-components - Admin UI components
  /customer-components - Customer UI components
  /ui - Shared UI components
/hooks - Custom React hooks
/lib - Utility functions and services
/middleware - Authentication and routing middleware
```

## Getting Started

### Prerequisites

- Node.js latest stable version

### Installation

1. Install project dependencies
    ```bash
    npm install
    ```

2. Install firebase
    ```bash
    npm install firebase
    ```

3. Install firebase tools
    ```bash
    npm install -g firebase-tools
    ```

4. Not required to run as always: Update All Dependencies & Dev Dependencies (except tailwind)
    ```bash
    npx npm-check-updates -u --reject tailwindcss
    ```

5. Run this after doing no. 4 if there are new versions of dependencies
    ```bash
    npm install
    ```

6. Check for dependency updates without updating (optional):
    ```bash
    npx npm-check-updates
    ```

4. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Admin Features

### Dashboard
- **Overview**: Quick access to important metrics and data
- **Metrics**: Display of pending reservations, completed services, ongoing repairs
- **Calendar**: Interactive calendar showing scheduled appointments
- **Recent Activities**: Activity logs showing recent system actions
- **Client Statistics**: New vs. returning client metrics
- **Today's Arrivals**: List of customers scheduled for today

### Reservation Management
- **Status Tracking**: Track reservations through different stages (Pending, Confirmed, Repairing, Completed, Cancelled)
- **Filtering**: Filter reservations by status
- **Searching**: Search by customer name, ID, car model, etc.
- **Service Management**: Add, edit, or remove services for each reservation
- **Mechanic Assignment**: Assign mechanics to specific services
- **Bulk Actions**: Update status for multiple reservations at once
- **Vehicle Details**: View detailed information about customer vehicles

### Employee Management
- **Directory**: List all employees with their details
- **Status Management**: Set employee status (Active, Inactive, Terminated)
- **Role Assignment**: Assign roles (Administrator, Lead Mechanic, Assistant Mechanic, Helper Mechanic)
- **New Employee**: Add new employees to the system
- **Employee Details**: View and manage individual employee information
- **Work Tracking**: See services and repairs assigned to each employee
- **Filtering**: Filter employees by status (active, inactive, terminated)

### Customer Management
- **Directory**: List all customers with their details
- **Search**: Find customers by name, phone number, or ID
- **Customer Details**: View individual customer profiles
- **Booking History**: See all bookings and transactions for each customer
- **Service History**: View services completed for each customer

### Transactions and Sales
- **Transaction List**: View all completed transactions
- **Service Details**: See services, mechanics, and pricing for each transaction
- **Pricing Management**: Set and adjust service prices
- **Discount Management**: Apply discounts to services
- **Payment Processing**: Record payments and calculate change
- **Receipt Generation**: Generate and print transaction receipts
- **Sales Reports**: View sales metrics and financial data
- **Revenue Tracking**: Track daily, weekly, and yearly sales

## Customer Features

### Dashboard
- **Overview**: Quick access to important information
- **Reservation Status**: Monitor status of current reservations
- **Booking History**: View past and upcoming bookings
- **Service Calendar**: Interactive calendar showing scheduled services

### Profile Management
- **Personal Information**: View and update personal details
- **Address Information**: Manage address information
- **Booking Statistics**: See completed and ongoing reservations

### Booking System
- **Service Selection**: Choose from available repair and maintenance services
- **Custom Services**: Request custom services
- **Scheduling**: Select preferred date and time for service
- **Vehicle Information**: Add car model, year, and specific issues
- **Confirmation**: Receive booking confirmation

### Reservation Tracking
- **Status Updates**: Track the status of reservations in real-time
- **Service Details**: View details of services being performed
- **Communication**: Direct communication with the shop regarding repairs
- **History**: Access complete service history

### Transactions
- **Payment History**: View all past payments
- **Service Breakdown**: See detailed breakdown of services and costs
- **Receipts**: Access digital receipts for all transactions

## Authentication & Security

The application uses a comprehensive authentication and security system:

1. **Authentication**: Email/password-based authentication through Firebase
2. **Role-Based Access Control**: Different permissions for admins and customers
3. **Protected Routes**: Middleware protection for sensitive routes
4. **Password Verification**: Secondary verification for critical actions
5. **Session Management**: Cookie-based session handling

## Database Structure

The application uses Firebase Firestore with the following main collections:

- **users**: Customer account information
- **bookings**: Service reservations and appointments
- **employees**: Staff information and roles
- **transactions**: Financial transactions and payments

## Responsive Design

The application is fully responsive and works on desktop, tablet, and mobile devices through:

- **Responsive Layouts**: Flexible grid and layout systems
- **Adaptive Components**: Components that adjust to screen size
- **Custom Hooks**: `useResponsiveRows` and `useMobile` for responsive behavior
- **Tailwind Breakpoints**: Consistent breakpoint usage throughout the application

## Deployment

The application can be deployed to Vercel or any other Next.js-compatible hosting service.

### Building for Production

```bash
npm run build
```

### Running in Production

```bash
npm start
```