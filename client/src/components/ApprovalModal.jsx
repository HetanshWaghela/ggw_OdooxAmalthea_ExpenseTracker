import { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const ApprovalModal = ({ expense, onApprove, onReject, onClose, isProcessing }) => {
  const [action, setAction] = useState(null);
  const [comments, setComments] = useState('');

  const handleSubmit = () => {
    if (action === 'approved') {
      onApprove(expense.id, comments); // expense.id is now the approval ID
    } else if (action === 'rejected') {
      onReject(expense.id, comments); // expense.id is now the approval ID
    }
  };

  const handleClose = () => {
    setAction(null);
    setComments('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Review Expense
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Expense Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Expense Details</h4>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Description:</span> {expense.expense?.description || expense.description}</div>
            <div><span className="font-medium">Amount:</span> {expense.expense?.amount || expense.amount} {expense.expense?.currency || expense.currency}</div>
            <div><span className="font-medium">Category:</span> {expense.expense?.categories?.name || expense.categories?.name || 'N/A'}</div>
            <div><span className="font-medium">Date:</span> {new Date(expense.expense?.submission_date || expense.expense?.created_at || expense.submission_date || expense.created_at).toLocaleDateString()}</div>
            <div><span className="font-medium">Employee:</span> {expense.expense?.employees?.first_name || expense.employees?.first_name} {expense.expense?.employees?.last_name || expense.employees?.last_name}</div>
            {(expense.expense?.remarks || expense.remarks) && (
              <div><span className="font-medium">Remarks:</span> {expense.expense?.remarks || expense.remarks}</div>
            )}
          </div>
        </div>

        {/* Action Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Decision
          </label>
          <div className="flex space-x-4">
            <button
              onClick={() => setAction('approved')}
              className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${
                action === 'approved'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-green-300'
              }`}
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Approve
            </button>
            <button
              onClick={() => setAction('rejected')}
              className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${
                action === 'rejected'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 hover:border-red-300'
              }`}
            >
              <XCircleIcon className="h-5 w-5 mr-2" />
              Reject
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {action === 'rejected' ? 'Rejection Reason (Required)' : 'Comments (Optional)'}
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={action === 'rejected' ? 'Please provide a reason for rejection...' : 'Add any comments...'}
            required={action === 'rejected'}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!action || (action === 'rejected' && !comments.trim()) || isProcessing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              action === 'approved'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : action === 'rejected'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            {isProcessing ? 'Processing...' : `${action === 'approved' ? 'Approve' : 'Reject'} Expense`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;
