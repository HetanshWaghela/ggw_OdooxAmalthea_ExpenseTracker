import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, expensesAPI, approvalsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import UserManagement from '../components/UserManagement';
import ApprovalRules from '../components/ApprovalRules';
import ManagerDashboard from './ManagerDashboard';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
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

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Refresh stats when switching to approvals tab
    if (tabId === 'approvals' || tabId === 'overview') {
      fetchStats();
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'approvals', name: 'Pending Approvals', icon: '⏳' },
    { id: 'users', name: 'User Management', icon: '👥' },
    { id: 'rules', name: 'Approval Rules', icon: '⚙️' },
    { id: 'reports', name: 'Reports', icon: '📈' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Dashboard Overview</h2>
            <button
              onClick={fetchStats}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Stats
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalExpenses}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pendingApprovals}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-success-100 rounded-lg">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Amount</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Company Name</p>
                <p className="text-lg text-gray-900">{user?.company?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Country</p>
                <p className="text-lg text-gray-900">{user?.company?.country}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Base Currency</p>
                <p className="text-lg text-gray-900">{user?.company?.base_currency}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Admin</p>
                <p className="text-lg text-gray-900">{user?.firstName} {user?.lastName}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && <ManagerDashboard />}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'rules' && <ApprovalRules />}
      {activeTab === 'reports' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports</h3>
          <p className="text-gray-500">Reports feature coming soon...</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
