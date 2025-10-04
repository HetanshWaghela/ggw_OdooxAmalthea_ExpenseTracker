import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { expensesAPI, approvalsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const ReportsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    approvedExpenses: 0,
    rejectedExpenses: 0,
    pendingExpenses: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const [expensesResponse, approvalsResponse] = await Promise.all([
        expensesAPI.getExpenses(),
        approvalsAPI.getPendingApprovals().catch(() => ({ data: { approvals: [] } }))
      ]);

      const expenses = expensesResponse.data.expenses;
      const pendingApprovals = approvalsResponse.data.approvals || [];

      const approvedExpenses = expenses.filter(exp => exp.status === 'approved');
      const rejectedExpenses = expenses.filter(exp => exp.status === 'rejected');
      const pendingExpenses = expenses.filter(exp => exp.status === 'submitted');

      const totalAmount = expenses.reduce((sum, expense) => {
        return sum + (expense.amount_in_base_currency || expense.amount || 0);
      }, 0);

      setStats({
        totalExpenses: expenses.length,
        approvedExpenses: approvedExpenses.length,
        rejectedExpenses: rejectedExpenses.length,
        pendingExpenses: pendingExpenses.length,
        totalAmount,
      });
    } catch (error) {
      console.error('Failed to fetch report data:', error);
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <button
          onClick={fetchReportData}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Reports
        </button>
      </div>

      {/* Expense Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="p-2 bg-success-100 rounded-lg">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.approvedExpenses}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-danger-100 rounded-lg">
              <svg className="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Rejected</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.rejectedExpenses}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingExpenses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Amount Processed</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Approval Rate</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalExpenses > 0 
                ? `${Math.round((stats.approvedExpenses / stats.totalExpenses) * 100)}%`
                : '0%'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Features */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Expense Trends</h4>
            <p className="text-sm text-gray-500">Monthly expense trends and patterns</p>
            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Coming Soon
            </span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Department Analysis</h4>
            <p className="text-sm text-gray-500">Expense breakdown by department</p>
            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Coming Soon
            </span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Category Insights</h4>
            <p className="text-sm text-gray-500">Most common expense categories</p>
            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Coming Soon
            </span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Export Reports</h4>
            <p className="text-sm text-gray-500">Download detailed reports in PDF/Excel</p>
            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
