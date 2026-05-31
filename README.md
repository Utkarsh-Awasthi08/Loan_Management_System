# 🏦 Loan Management System (LMS)

A full-stack lending platform built with the MERN stack and Next.js, where borrowers apply for loans and internal executives manage them through their lifecycle.

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend    | Node.js + Express.js + TypeScript   |
| Database   | MongoDB + Mongoose                  |
| Auth       | JWT + bcrypt                        |
| File Upload| multer (local storage)              |

---

## Project Structure

```
lms/
├── backend/
│   └── src/
│       ├── config/       # DB connection
│       ├── controllers/  # Route handlers
│       ├── middleware/   # auth + upload
│       ├── models/       # Mongoose schemas
│       ├── routes/       # All API routes
│       ├── types/        # TypeScript types
│       ├── utils/        # BRE, JWT, seed
│       └── index.ts      # Entry point
└── frontend/
    └── src/
        ├── app/          # Next.js App Router pages
        │   ├── auth/     # Login + Register
        │   ├── borrower/ # Multi-step loan application
        │   └── dashboard/# Operations modules
        ├── components/   # Reusable UI
        ├── lib/          # API client, BRE utils
        ├── store/        # Zustand auth store
        └── types/        # Shared TypeScript types
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

---

### Backend Setup

```bash
cd backend
npm install

# Create .env
cp .env.example .env
# Edit .env and set MONGODB_URI and JWT_SECRET

# Start dev server
npm run dev

# Run seed script (creates all role accounts)
npm run seed
```

The backend runs on `http://localhost:5000`.

---

### Frontend Setup

```bash
cd frontend
npm install

# Create .env.local
cp .env.example .env.local
# Edit NEXT_PUBLIC_API_URL=http://localhost:5000

# Start dev server
npm run dev
```

The frontend runs on `http://localhost:3000`.

---

## Login Credentials (Seeded Accounts)

| Role         | Email                   | Password      |
|--------------|-------------------------|---------------|
| Admin        | admin@lms.com           | Admin@123     |
| Sales        | sales@lms.com           | Sales@123     |
| Sanction     | sanction@lms.com        | Sanction@123  |
| Disbursement | disbursement@lms.com    | Disburse@123  |
| Collection   | collection@lms.com      | Collect@123   |
| Borrower     | borrower@lms.com        | Borrower@123  |

---

## Database Collections

### `users`
```
{ name, email, password (hashed), role, timestamps }
```

### `borrowerprofiles`
```
{ userId, fullName, pan, dateOfBirth, monthlySalary, employmentMode,
  salarySlipUrl, salarySlipType, breStatus, breFailureReasons, timestamps }
```

### `loans`
```
{ borrowerId, amount, tenureDays, interestRate, simpleInterest, totalRepayment,
  totalPaid, outstandingBalance, status, rejectionReason,
  sanctionedBy, sanctionedAt, disbursedBy, disbursedAt, closedAt, timestamps }
```

### `payments`
```
{ loanId, utr (unique index), amount, paidAt, recordedBy, timestamps }
```

---

## API Reference

### Auth
| Method | Endpoint        | Description          | Auth |
|--------|----------------|----------------------|------|
| POST   | /api/auth/register | Register borrower | No  |
| POST   | /api/auth/login    | Login any user    | No  |
| GET    | /api/auth/me       | Get current user  | Yes |

### Borrower
| Method | Endpoint              | Auth         |
|--------|-----------------------|--------------|
| POST   | /api/borrower/details | BORROWER     |
| POST   | /api/borrower/upload  | BORROWER     |
| POST   | /api/borrower/apply   | BORROWER     |
| GET    | /api/borrower/me      | BORROWER     |
| GET    | /api/borrower/loans/:id | BORROWER   |

### Loans (Operations)
| Method | Endpoint                  | Auth                        |
|--------|---------------------------|-----------------------------|
| GET    | /api/loans?status=PENDING | SANCTION, DISBURSEMENT, COLLECTION, ADMIN |
| GET    | /api/loans/:id            | SANCTION, DISBURSEMENT, COLLECTION, ADMIN |
| PATCH  | /api/loans/:id/sanction   | SANCTION, ADMIN             |
| PATCH  | /api/loans/:id/reject     | SANCTION, ADMIN             |
| PATCH  | /api/loans/:id/disburse   | DISBURSEMENT, ADMIN         |

### Sales
| Method | Endpoint           | Auth         |
|--------|--------------------|--------------|
| GET    | /api/sales/leads   | SALES, ADMIN |

### Payments
| Method | Endpoint               | Auth              |
|--------|------------------------|-------------------|
| POST   | /api/payments          | COLLECTION, ADMIN |
| GET    | /api/payments/:loanId  | COLLECTION, ADMIN |

---

## Business Rules Engine (BRE)

Validated on **both** frontend (UX) and **backend** (security):

| Rule       | Condition                           |
|------------|-------------------------------------|
| Age        | Must be between 23 and 50 years     |
| Salary     | Must be ≥ ₹25,000/month             |
| PAN        | Must match `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` |
| Employment | Must not be UNEMPLOYED              |

---

## Loan Lifecycle

```
[Register] → [Submit Details (BRE)] → [Upload Slip] → [Apply]
                                                          ↓
PENDING → SANCTIONED → DISBURSED → CLOSED
   ↘ REJECTED
```

### Valid Transitions
| From       | To         | Who          |
|------------|------------|--------------|
| PENDING    | SANCTIONED | SANCTION     |
| PENDING    | REJECTED   | SANCTION     |
| SANCTIONED | DISBURSED  | DISBURSEMENT |
| DISBURSED  | CLOSED     | Auto (when totalPaid >= totalRepayment) |

---

## Loan Calculation

```
SI = (P × R × T) / (365 × 100)
where P = Principal, R = 12 (fixed), T = Tenure in days

Total Repayment = P + SI
Outstanding = Total Repayment - Total Paid
```

---

## RBAC Design

| Role         | Access                          |
|--------------|---------------------------------|
| BORROWER     | Borrower portal only            |
| SALES        | Sales module (leads)            |
| SANCTION     | Sanction module                 |
| DISBURSEMENT | Disbursement module             |
| COLLECTION   | Collection module               |
| ADMIN        | All dashboard modules           |

- **Frontend**: Routes check user role from Zustand store; sidebar only shows permitted modules
- **Backend**: `authMiddleware` (validates JWT) + `authorize(...roles)` factory (checks role) on every protected route

Unauthorized requests return `403 Forbidden`.

---

## UTR Validation (Collection)

- MongoDB `unique` index on `payments.utr`
- Backend rejects duplicates with a clean 409 error before hitting the DB constraint
- Client validates amount ≤ outstanding balance
- Loan auto-closes when `totalPaid >= totalRepayment`

---

## Environment Variables

### Backend `.env`
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lms
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```
