import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { approvalsAPI, expensesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ReceiptViewer from '../components/ReceiptViewer';
import ApprovalModal from '../components/ApprovalModal';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingApproval, setProcessingApproval] = useState(null);
  const [companyBaseCurrency, setCompanyBaseCurrency] = useState('USD');
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedExpenseHistory, setSelectedExpenseHistory] = useState(null);
  const [expenseHistory, setExpenseHistory] = useState([]);

  useEffect(() => {
    fetchApprovals();
    fetchAllExpenses();
    // Set company base currency from user context
    if (user?.company?.base_currency) {
      setCompanyBaseCurrency(user.company.base_currency);
    }
  }, [user]);

  const fetchApprovals = async () => {
    try {
      // Try to get pending approvals first
      try {
        const response = await approvalsAPI.getPendingApprovals();
        setApprovals(response.data.approvals);
      } catch (approvalError) {
        console.log('Approval requests not found, fetching submitted expenses directly');
        // Fallback: get submitted expenses directly
        const response = await expensesAPI.getExpenses({ status: 'submitted' });
        const submittedExpenses = response.data.expenses.map(expense => ({
          id: expense.id,
          status: 'pending',
          expense: expense
        }));
        setApprovals(submittedExpenses);
      }
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllExpenses = async () => {
    try {
      const response = await expensesAPI.getExpenses();
      setAllExpenses(response.data.expenses);
    } catch (error) {
      console.error('Failed to fetch all expenses:', error);
    }
  };

  const refreshDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchApprovals(),
        fetchAllExpenses()
      ]);
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approvalId, comments) => {
    setProcessingApproval(approvalId);
    
    try {
      await approvalsAPI.approveExpense(approvalId, comments);
      
      // Refresh both approvals and all expenses
      await Promise.all([
        fetchApprovals(),
        fetchAllExpenses()
      ]);
      
      setShowApprovalModal(false);
      setSelectedExpense(null);
      alert('Expense approved successfully!');
    } catch (error) {
      console.error('Failed to approve expense:', error);
      alert('Failed to approve expense. Please try again.');
    } finally {
      setProcessingApproval(null);
    }
  };

  const handleRejection = async (approvalId, comments) => {
    setProcessingApproval(approvalId);
    
    try {
      await approvalsAPI.rejectExpense(approvalId, comments);
      
      // Refresh both approvals and all expenses
      await Promise.all([
        fetchApprovals(),
        fetchAllExpenses()
      ]);
      
      setShowApprovalModal(false);
      setSelectedExpense(null);
      alert('Expense rejected successfully!');
    } catch (error) {
      console.error('Failed to reject expense:', error);
      alert('Failed to reject expense. Please try again.');
    } finally {
      setProcessingApproval(null);
    }
  };

  const handleViewReceipt = (receiptUrl) => {
    setSelectedReceipt(receiptUrl);
    setShowReceipt(true);
  };

  const handleReviewExpense = (approval) => {
    setSelectedExpense(approval);
    setShowApprovalModal(true);
  };

  const handleViewExpenseHistory = async (expenseId) => {
    try {
      const response = await approvalsAPI.getApprovalHistory(expenseId);
      setExpenseHistory(response.data.approvals);
      setSelectedExpenseHistory(expenseId);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Failed to fetch expense history:', error);
      alert('Failed to fetch expense history. Please try again.');
    }
  };

  const formatCurrency = (amount, originalCurrency, baseCurrency) => {
    if (originalCurrency === baseCurrency) {
      return `${amount.toLocaleString()} ${baseCurrency}`;
    }
    // Mock conversion rate for demo (you can replace with real API)
    const conversionRate = 88; // This should come from a real currency API
    return `${amount.toLocaleString()} ${originalCurrency} = ${(amount * conversionRate).toLocaleString()} ${baseCurrency}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-success-100 text-success-800';
      case 'rejected':
        return 'bg-danger-100 text-danger-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manager's View</h1>
        <button
          onClick={refreshDashboard}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh Dashboard'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Approvals ({approvals.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Expenses ({allExpenses.length})
          </button>
        </nav>
      </div>

      {/* Pending Approvals Tab */}
      {activeTab === 'pending' && (
        <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Approvals to review</h3>
        
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Approval Subject</th>
                <th className="table-header-cell">Request Owner</th>
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Request Status</th>
                <th className="table-header-cell">Total amount (in company's currency)</th>
                <th className="table-header-cell">Actions</th>
                <th className="table-header-cell"></th>
              </tr>
            </thead>
            <tbody className="table-body">
              {approvals.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-cell text-center py-8">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-2 text-sm">No pending approvals</p>
                      <p className="text-xs text-gray-400">All expense requests have been processed</p>
                    </div>
                  </td>
                </tr>
              ) : (
                approvals.map((approval) => (
                  <tr key={approval.id}>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">
                        {approval.expense?.description || 'none'}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">
                        {approval.expense?.employees?.first_name} {approval.expense?.employees?.last_name}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">
                        {approval.expense?.categories?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(approval.status)}`}>
                        {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(
                          approval.expense?.amount_in_base_currency || approval.expense?.amount || 0,
                          approval.expense?.currency || 'USD',
                          companyBaseCurrency
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        {approval.expense?.receipt_url && (
                          <button
                            onClick={() => handleViewReceipt(approval.expense.receipt_url)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            View Receipt
                          </button>
                        )}
                        <button
                          onClick={() => handleReviewExpense(approval)}
                          disabled={processingApproval === approval.id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {processingApproval === approval.id ? 'Processing...' : 'Review'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Instructional Text */}
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                <strong>Important:</strong> Once the expense is approved/rejected by manager that record should become readonly, the status should get set in request status field and the buttons should become invisible.
              </p>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* All Expenses Tab */}
      {activeTab === 'history' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">All Expenses</h3>
          
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Description</th>
                  <th className="table-header-cell">Employee</th>
                  <th className="table-header-cell">Amount</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Date</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {allExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-cell text-center py-8">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mt-2 text-sm">No expenses found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  allExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">
                          {expense.description || 'No description'}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">
                          {expense.employees?.first_name} {expense.employees?.last_name}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(
                            expense.amount_in_base_currency || expense.amount || 0,
                            expense.currency || 'USD',
                            companyBaseCurrency
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">
                          {new Date(expense.submission_date || expense.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          {expense.receipt_url && (
                            <button
                              onClick={() => handleViewReceipt(expense.receipt_url)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              View Receipt
                            </button>
                          )}
                          <button
                            onClick={() => handleViewExpenseHistory(expense.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            View History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Additional Manager Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="bg-primary-100 rounded-lg p-4 mb-3">
            <h3 className="text-lg font-semibold text-primary-800 mb-2">Pending Reviews</h3>
            <p className="text-2xl font-bold text-primary-900">
              {approvals.filter(a => a.status === 'pending').length}
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Expenses waiting for your approval
          </p>
        </div>

        <div className="card text-center">
          <div className="bg-success-100 rounded-lg p-4 mb-3">
            <h3 className="text-lg font-semibold text-success-800 mb-2">Approved Today</h3>
            <p className="text-2xl font-bold text-success-900">
              {allExpenses.filter(expense => 
                expense.status === 'approved' && 
                new Date(expense.updated_at || expense.created_at).toDateString() === new Date().toDateString()
              ).length}
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Expenses approved today
          </p>
        </div>

        <div className="card text-center">
          <div className="bg-danger-100 rounded-lg p-4 mb-3">
            <h3 className="text-lg font-semibold text-danger-800 mb-2">Rejected Today</h3>
            <p className="text-2xl font-bold text-danger-900">
              {allExpenses.filter(expense => 
                expense.status === 'rejected' && 
                new Date(expense.updated_at || expense.created_at).toDateString() === new Date().toDateString()
              ).length}
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Expenses rejected today
          </p>
        </div>
      </div>

      {/* Receipt Viewer Modal */}
      {showReceipt && (
        <ReceiptViewer
          receiptUrl={selectedReceipt}
          onClose={() => {
            setShowReceipt(false);
            setSelectedReceipt(null);
          }}
        />
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedExpense && (
        <ApprovalModal
          expense={selectedExpense}
          onApprove={handleApproval}
          onReject={handleRejection}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedExpense(null);
          }}
          isProcessing={processingApproval === selectedExpense.id}
        />
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Approval History
              </h3>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedExpenseHistory(null);
                  setExpenseHistory([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              {expenseHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No approval history found</p>
              ) : (
                expenseHistory.map((approval, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">
                          {approval.approvers?.first_name} {approval.approvers?.last_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {approval.comments && `"${approval.comments}"`}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(approval.status)}`}>
                          {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {approval.approved_at && new Date(approval.approved_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;