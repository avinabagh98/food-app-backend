# 🍽️ Restaurant Food Delivery Backend

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Roles & Access Control](#3-roles--access-control)

---

## 1. Project Overview

A **single-restaurant food delivery backend**, built as a REST API. This is **not** a multi-tenant SaaS — it serves one restaurant only.

Three client apps consume this API:

| Client App | Primary Role |
|---|---|
| **Customer App** | Browse menu, manage cart, place orders |
| **Restaurant Admin Panel** | Manage menu, orders, users, rider assignments |
| **Rider App** | View assigned deliveries, update delivery status |

**Scope:** Backend only (no frontend). All communication is over REST/JSON. **Payment integration is out of scope for this phase.**

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Runtime | Node.js v18+ | LTS version required |
| Framework | Express.js | Minimal, unopinionated |
| Database | MySQL | Relational, transactions supported |
| DB Access | **mysql2** (raw SQL) | No ORM; all queries are explicit SQL strings |
| Auth | JWT | Access token (15 min) + Refresh token (7 days) |
| File Storage | Multer → local `/uploads` | No cloud storage in current scope |
| OTP Delivery | External HTTP API (abstracted) | Provider-agnostic via `otp.service.js` |
| Environment | dotenv | `.env` file; never committed |
| Logging | Winston | App-level logging (structured, file + console) |

> 🚧 FUTURE: Redis (caching, session), Socket.io (real-time), MongoDB (analytics) are explicitly out of scope for the current phase..

---

## 3. Roles & Access Control

All roles are stored in a **single `users` table** with a `role` ENUM field. There is no separate roles table.

| Role | Description | Key Permissions |
|---|---|---|
| `customer` | End user placing orders | Cart, orders |
| `admin` | Full restaurant control | Everything including user management |
| `manager` | Operations staff | Menu + order management; **cannot** manage users or change roles |
| `rider` | Delivery staff | View assigned orders, update delivery status |

### Role Hierarchy Rules

- `admin` > `manager` > `rider` / `customer`
- **Only `admin`** can: create users, assign roles, change roles, activate/deactivate accounts
- `manager` has identical access to `admin` for menu and order operations
- `rider` accounts are created by `admin`; riders cannot self-register
- Customers **self-register** via OTP flow (phone number)
