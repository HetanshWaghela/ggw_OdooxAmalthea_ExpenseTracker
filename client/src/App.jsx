import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import HeroPage from './pages/HeroPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import UserManagement from './pages/UserManagement';
import ApprovalRules from './pages/ApprovalRules';
import Reports from './pages/Reports';
import ResetPassword from './components/ResetPassword';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={!user ? <HeroPage /> : <Navigate to="/app/dashboard" replace />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/app/dashboard" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/app/dashboard" replace />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      {/* Protected Routes */}
      <Route path="/app" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        <Route path="admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        } />
        
        <Route path="admin/rules" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ApprovalRules />
          </ProtectedRoute>
        } />
        
        <Route path="admin/reports" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Reports />
          </ProtectedRoute>
        } />
        
        <Route path="manager/*" element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="manager/approvals" element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="employee/*" element={
          <ProtectedRoute allowedRoles={['employee', 'admin']}>
            <EmployeeDashboard />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;