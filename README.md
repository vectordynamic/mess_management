# Amar Dera - Mess Management System 🏠

**Amar Dera** (Our Home) is a comprehensive Mess (Bachelor Hostel) Management System designed to simplify the daily chaos of shared living. It automates meal tracking, bazar expenses, house costs, and provides a social marketplace for bachelors.

---

## ✨ Key Features

### 🏢 Mess Management
- **Create or Join**: Start a new mess as an Admin or request to join an existing one using a unique Mess ID.
- **Member Approval**: Admins and Managers can approve/reject new join requests.
- **RBAC (Role Based Access Control)**:
  - **Admin**: Full control, can assign/remove Managers.
  - **Manager**: Manages daily operations (meals, bazar, payments).
  - **Member**: Submits bazar entries, payments, and views reports.

### 💰 Finance & Accounting
- **Meal Tracking**: A monthly grid to track daily meals (Breakfast, Lunch, Dinner).
- **Bazar Management**: easy entry for daily market expenses with Manager verification.
- **Fixed Costs**: Management for shared bills like House Rent, WiFi, Water, and Gas.
- **Automated Calculations**: Real-time calculation of Meal Rates, Total Expenses, and Individual Balances.
- **Payment Verification**: Track cash payments with a submission and verification workflow.

### 🍱 Bachelor Feed
- **Marketplace**: Buy/Sell used furniture, gadgets, or appliances.
- **Flatmates Wanted**: Post "Seat Available" or "House Rent" advertisements.
- **Bua/Service**: Find or recommend domestic helps and services.
- **Filters**: Filter by category (Rent, Buy, Sell, Help) or view only "Your Posts".

### 🔒 History & Security
- **Month Locking**: Financial data is locked at the end of the month to prevent tampering.
- **Unlock Requests**: Managers can request Admins to unlock past months for corrections.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: React Context & TanStack Query (React Query)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Backend
- **Language**: Go (Golang)
- **Framework**: Gin Gonic
- **Database**: MongoDB (Official Go Driver)
- **Auth**: JWT (JSON Web Tokens) with Argon2 hashing

---

## 🚀 Getting Started

### Prerequisites
- [Go](https://go.dev/dl/) (1.21 or higher)
- [Node.js](https://nodejs.org/) (18.x or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (Running locally or on Atlas)

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file (copy from `.env.example` if available):
   ```env
   PORT=8080
   MONGO_URI=mongodb://localhost:27017
   DB_NAME=amar_dera
   JWT_SECRET=your_secret_key_here
   ```
3. Run the development server:
   ```bash
   make run
   # Or manually: go run cmd/server/main.go
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

---

## 📁 Project Structure

```bash
amar-dera/
├── backend/            # Go Backend (Clean Architecture)
│   ├── cmd/            # Entry points
│   ├── internal/       # Core logic (Domain, Services, Handlers, Repos)
│   └── pkg/            # Common utilities
├── frontend/           # Next.js Frontend
│   ├── app/            # Routes & Pages
│   ├── components/     # UI Components
│   └── services/       # API integration
└── postman.json        # API Collection for testing
```

---

## 📱 Mobile Support
The system is fully responsive, optimized for use on mobile phones so members can update meals and bazar entries on the go.

## 📄 License
This project is developed for personal mess management. All rights reserved.
