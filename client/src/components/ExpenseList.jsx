import { useState } from 'react';
import { approvalsAPI } from '../services/api';

const ExpenseList = ({ expenses, onEdit, onSubmit, onDelete, showActions = false }) => {
  const [showHistory, setShowHistory] = useState({});
  const [approvalHistory, setApprovalHistory] = useState({});

  const handleShowHistory = async (expenseId) => {
    if (showHistory[expenseId]) {
      setShowHistory(prev => ({ ...prev, [expenseId]: false }));
      return;
    }

    try {
      const response = await approvalsAPI.getApprovalHistory(expenseId);
      setApprovalHistory(prev => ({ ...prev, [expenseId]: response.data.approvals }));
      setShowHistory(prev => ({ ...prev, [expenseId]: true }));
    } catch (error) {
      console.error('Failed to fetch approval history:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-warning-100 text-warning-800';
      case 'submitted':
        return 'bg-primary-100 text-primary-800';
      case 'approved':
        return 'bg-success-100 text-success-800';
      case 'rejected':
        return 'bg-danger-100 text-danger-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Description</th>
              <th className="table-header-cell">Category</th>
              <th className="table-header-cell">Amount</th>
              <th className="table-header-cell">Paid By</th>
              <th className="table-header-cell">Date</th>
              <th className="table-header-cell">Status</th>
              {showActions && <th className="table-header-cell">Actions</th>}
            </tr>
          </thead>
          <tbody className="table-body">
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="table-cell">
                  <div>
                    <div className="font-medium">{expense.description}</div>
                    {expense.remarks && (
                      <div className="text-sm text-gray-500">{expense.remarks}</div>
                    )}
                  </div>
                </td>
                <td className="table-cell">
                  {expense.categories?.name || 'N/A'}
                </td>
                <td className="table-cell">
                  <div>
                    <div className="font-medium">
                      {formatCurrency(expense.amount, expense.currency)}
                    </div>
                    {expense.amount_in_base_currency && expense.currency !== 'USD' && (
                      <div className="text-sm text-gray-500">
                        ≈ {formatCurrency(expense.amount_in_base_currency, 'USD')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="table-cell">{expense.paid_by || 'N/A'}</td>
                <td className="table-cell">
                  {formatDate(expense.submission_date || expense.created_at)}
                </td>
                <td className="table-cell">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                    {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                  </span>
                </td>
                {showActions && (
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      {expense.status === 'draft' && (
                        <>
                          <button
                            onClick={() => onEdit(expense)}
                            className="text-primary-600 hover:text-primary-900 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onSubmit(expense.id)}
                            className="text-success-600 hover:text-success-900 text-sm"
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => onDelete && onDelete(expense.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {expense.status !== 'draft' && (
                        <button
                          onClick={() => handleShowHistory(expense.id)}
                          className="text-gray-600 hover:text-gray-900 text-sm"
                        >
                          {showHistory[expense.id] ? 'Hide' : 'Show'} History
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Approval History */}
      {Object.keys(showHistory).map(expenseId => 
        showHistory[expenseId] && (
          <div key={expenseId} className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Approval History</h4>
            {approvalHistory[expenseId]?.map((approval, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                <div>
                  <div className="font-medium">
                    {approval.approvers?.first_name} {approval.approvers?.last_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {approval.comments && `"${approval.comments}"`}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(approval.status)}`}>
                    {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                  </span>
                  <div className="text-sm text-gray-500">
                    {approval.approved_at && formatDate(approval.approved_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default ExpenseList;
