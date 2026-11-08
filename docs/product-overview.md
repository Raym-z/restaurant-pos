# Product Overview

## 1. Introduction

Restaurant POS is a staff-facing Point of Sale and restaurant management application designed for restaurant businesses operating across multiple physical branches.

The platform provides a centralized workspace where restaurant owners and authorized employees can manage daily operations, monitor business performance, and coordinate activities across their branches.

The application is part of a larger multi-tenant restaurant SaaS platform.

## 2. Platform Structure

The platform follows a multi-tenant organizational structure:

- **Organization:** Represents a restaurant business or brand.
- **Branch:** Represents a physical restaurant location belonging to an organization.

An organization may operate multiple branches, each with its own operational configuration, staff assignments, menus, tables, queues, and orders.

## 3. Target Users

The application is designed for the following staff roles:

- Restaurant owners
- Organization administrators
- Branch managers
- Cashiers
- Kitchen staff

Access to features and operational data depends on the user's assigned role, organization, and branch permissions.

## 4. Core Features

### 4.1 Dashboard

Provides an overview of restaurant operations and business performance, including relevant sales figures, order activity, and operational summaries.

### 4.2 Organization and Branch Management

Allows authorized users to manage restaurant business information and oversee multiple branches.

### 4.3 Staff Management

Allows administrators to manage staff accounts, assign employees to branches, and configure their access permissions.

### 4.4 Menu Management

Provides tools to manage menu categories, menu items, variants, modifier groups, and modifier options.

Menu availability and pricing may differ between branches.

### 4.5 Table Management

Allows staff to configure restaurant tables, manage table availability, and generate QR codes for customer ordering.

### 4.6 Queue Management

Allows authorized staff to monitor and manage customer waiting lists, including calling, skipping, recalling, and seating customers.

Customer-facing waitlist registration and queue tracking are handled by the separate Waitlist application.

### 4.7 Point of Sale

Provides cashier functionality for creating and managing customer orders, including orders created directly by staff.

### 4.8 Dining Sessions and Billing

Supports table-based dining sessions, running bills, payment processing, and session closure.

### 4.9 Kitchen Display System

Provides kitchen staff with a dedicated interface for monitoring incoming orders and updating their preparation status.

The Kitchen Display System (KDS) is integrated into the POS application rather than maintained as a separate application.

### 4.10 Reports and Analytics

Provides authorized users with operational and business reports, such as sales summaries, order statistics, and branch performance.

### 4.11 Branch Settings

Allows authorized staff to configure branch-specific settings, including business hours and operational preferences.

## 5. Application Boundaries

The platform consists of four separate repositories:

| Application         | Responsibility                                                    |
| ------------------- | ----------------------------------------------------------------- |
| Restaurant POS      | Staff operations, management, cashier workflows, and KDS          |
| Restaurant Ordering | Public customer-facing QR menu and ordering                       |
| Restaurant Waitlist | Customer accounts and public waiting list                         |
| Platform Backend    | Shared database, authentication infrastructure, and backend logic |

The POS application must remain restricted to authenticated restaurant staff.

Customer-facing features must be implemented in their respective applications rather than duplicated inside the POS.

## 6. Platform Principles

- Multi-tenant architecture with organization-level data isolation.
- Support for multiple branches under one organization.
- Role-based and branch-aware access control.
- Centralized backend infrastructure.
- Real-time operational updates.
- Secure and reliable transaction processing.
- Consistent experience across restaurant branches.
