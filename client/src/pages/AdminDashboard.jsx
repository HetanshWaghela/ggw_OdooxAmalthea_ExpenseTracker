import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, expensesAPI, approvalsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExpenses: 0,
    pendingApprovals: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersResponse, expensesResponse, approvalsResponse] = await Promise.all([
        usersAPI.getUsers(),
        expensesAPI.getExpenses(),
        approvalsAPI.getPendingApprovals().catch(() => ({ data: { approvals: [] } })) // Fallback if no approvals
      ]);

      const users = usersResponse.data.users;
      const expenses = expensesResponse.data.expenses;
      const pendingApprovals = approvalsResponse.data.approvals || [];

      const totalAmount = expenses.reduce((sum, expense) => {
        return sum + (expense.amount_in_base_currency || expense.amount || 0);
      }, 0);

      setStats({
        totalUsers: users.length,
        totalExpenses: expenses.length,
        pendingApprovals: pendingApprovals.length,
        totalAmount,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const baseCurrency = user?.company?.base_currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: baseCurrency,
    }).format(amount);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-700 to-purple-700 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.firstName}! Here's what's happening today.</p>
        </div>
        <button
          onClick={fetchStats}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Stats
        </button>
      </div>

      {/* Dashboard Overview */}
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Dashboard Overview</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">Live Data</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="stat-card stat-card-primary group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-warning group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalExpenses}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-secondary group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingApprovals}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-accent group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="card-gradient group">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Company Information</h3>
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/60 rounded-xl p-4 border border-gray-100 group-hover:bg-white/80 transition-colors duration-300">
              <p className="text-sm font-medium text-gray-500 mb-1">Company Name</p>
              <p className="text-lg font-semibold text-gray-900">{user?.company?.name}</p>
            </div>
            <div className="bg-white/60 rounded-xl p-4 border border-gray-100 group-hover:bg-white/80 transition-colors duration-300">
              <p className="text-sm font-medium text-gray-500 mb-1">Country</p>
              <p className="text-lg font-semibold text-gray-900">{user?.company?.country}</p>
            </div>
            <div className="bg-white/60 rounded-xl p-4 border border-gray-100 group-hover:bg-white/80 transition-colors duration-300">
              <p className="text-sm font-medium text-gray-500 mb-1">Base Currency</p>
              <p className="text-lg font-semibold text-gray-900">{user?.company?.base_currency}</p>
            </div>
            <div className="bg-white/60 rounded-xl p-4 border border-gray-100 group-hover:bg-white/80 transition-colors duration-300">
              <p className="text-sm font-medium text-gray-500 mb-1">Admin</p>
              <p className="text-lg font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
