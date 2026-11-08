# Restaurant POS

A multi-tenant restaurant management and Point of Sale platform built for restaurant businesses operating across multiple branches.

## Overview

Restaurant POS is the staff-facing application used to manage restaurant operations from a centralized platform.

It provides restaurant owners and authorized employees with tools to manage their branches, menus, tables, orders, payments, and kitchen operations.

## Features

The application is planned to include:

- **Dashboard:** Overview of restaurant operations and business performance.
- **Organization Management:** Manage restaurant business information and branches.
- **Staff Management:** Manage employees, branch assignments, and permissions.
- **Menu Management:** Manage categories, menu items, variants, and modifiers.
- **Table Management:** Configure restaurant tables and generate customer QR codes.
- **Queue Management:** Manage customer waiting lists and queue operations.
- **Point of Sale:** Handle cashier operations and customer orders.
- **Billing and Payments:** Manage dining bills, payments, and refunds.
- **Kitchen Display System:** Monitor and manage incoming kitchen orders.
- **Reports:** Review restaurant performance and operational data.
- **Settings:** Configure branch-specific settings and business hours.

## Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL

## Platform Architecture

This application is part of a four-repository platform:

| Repository                    | Responsibility                             |
| ----------------------------- | ------------------------------------------ |
| `restaurant-pos`              | Staff-facing POS and KDS                   |
| `restaurant-ordering`         | Public customer QR ordering                |
| `restaurant-waitlist`         | Customer accounts and waiting lists        |
| `restaurant-platform-backend` | Shared database and backend infrastructure |

All applications share a centralized Supabase backend.

## Getting Started

Development setup instructions will be added after the initial application configuration.

## Project Status

Currently in the initial development and architecture phase.
