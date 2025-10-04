# Expense Management System

A comprehensive expense management system built with React, Node.js, Express, and Supabase. This system allows companies to manage employee expenses with flexible approval workflows, multi-level approvals, and real-time currency conversion.

## Features

### 🔐 Authentication & User Management
- Company registration with automatic admin creation
- Role-based access (Admin, Manager, Employee)
- User management and role assignment
- Manager-employee relationships

### 💰 Expense Management
- Expense submission with receipt upload
- Multiple currency support with real-time conversion
- Expense categorization and tracking
- Draft, submitted, approved, and rejected statuses

### ✅ Approval Workflow
- Flexible approval rules configuration
- Multi-level approval sequences
- Percentage-based approval requirements
- Manager and custom approver assignments
- Real-time approval status tracking

### 🌍 International Support
- Country-based currency selection
- Real-time currency conversion using external APIs
- Support for multiple currencies

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens
- **APIs**: REST Countries API, Exchange Rate API

## Project Structure

```
expense-tracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── services/      # API services
│   │   └── hooks/         # Custom hooks
│   └── package.json
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── utils/            # Utility functions
│   ├── database/        # Database schema
│   └── package.json
└── package.json          # Root package.json
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd expense-tracker
```

### 2. Install dependencies
```bash
npm run install-all
```

### 3. Set up Supabase

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `expense-tracker`
   - Database Password: (generate a strong password)
   - Region: (choose closest to you)
6. Click "Create new project"

#### Get Supabase Credentials
1. Go to Settings → API
2. Copy the following:
   - Project URL
   - Anon public key

#### Set up Database Schema
1. Go to SQL Editor in your Supabase dashboard
2. Copy the contents of `server/database/schema.sql`
3. Paste and run the SQL script

### 4. Configure Environment Variables

#### Backend Configuration
```bash
cd server
cp env.example .env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Frontend Configuration
```bash
cd client
cp env.example .env
```

Edit `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Run the Application

#### Development Mode (Both Frontend and Backend)
```bash
npm run dev
```

#### Run Separately
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Usage

### 1. Company Registration
1. Visit the application
2. Click "Create a new company account"
3. Fill in admin details and select country
4. The system will automatically create your company and admin account

### 2. User Management (Admin)
1. Login as admin
2. Go to "User Management"
3. Create employees and managers
4. Assign manager relationships

### 3. Approval Rules (Admin)
1. Go to "Approval Rules"
2. Create approval rules for specific users
3. Configure approvers and sequences
4. Set minimum approval percentages

### 4. Expense Submission (Employee)
1. Login as employee
2. Click "Add New Expense"
3. Fill in expense details
4. Submit for approval

### 5. Expense Approval (Manager)
1. Login as manager
2. Go to "Pending Approvals"
3. Review and approve/reject expenses
4. Add comments if needed

## API Endpoints

### Authentication
- `POST /api/auth/register` - Company registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Password reset

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `GET /api/users/managers` - Get managers
- `GET /api/users/employees` - Get employees

### Expenses
- `GET /api/expenses` - Get expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `POST /api/expenses/:id/submit` - Submit expense
- `GET /api/expenses/categories` - Get categories

### Approvals
- `GET /api/approvals/pending` - Get pending approvals
- `POST /api/approvals/:id/approve` - Approve expense
- `POST /api/approvals/:id/reject` - Reject expense
- `GET /api/approvals/expense/:id` - Get approval history

### Currency
- `GET /api/currency/countries` - Get countries
- `POST /api/currency/convert` - Convert currency
- `GET /api/currency/rates/:base` - Get exchange rates

## Database Schema

The system uses the following main tables:
- `companies` - Company information
- `users` - User accounts and roles
- `expenses` - Expense records
- `approval_rules` - Approval workflow rules
- `approvers` - Approver assignments
- `approval_requests` - Approval requests
- `expense_categories` - Expense categories
- `currency_rates` - Cached exchange rates

## Deployment

### Frontend Deployment (Vercel/Netlify)
1. Build the frontend:
```bash
cd client
npm run build
```

2. Deploy the `dist` folder to your hosting service

3. Update environment variables:
```env
VITE_API_URL=https://your-backend-url.com/api
```

### Backend Deployment (Railway/Heroku)
1. Set environment variables in your hosting platform
2. Deploy the server folder
3. Update CORS settings for production

### Database (Supabase)
- Supabase handles database hosting automatically
- No additional setup required

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
1. Check the documentation
2. Review the code comments
3. Open an issue on GitHub

## Roadmap

- [ ] Mobile app development
- [ ] Advanced reporting features
- [ ] OCR receipt scanning
- [ ] Email notifications
- [ ] Advanced approval workflows
- [ ] Integration with accounting software
# karlo_bhai
