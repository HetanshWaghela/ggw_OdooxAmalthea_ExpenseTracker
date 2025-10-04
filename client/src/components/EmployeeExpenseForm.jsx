import { useState, useEffect, useRef } from 'react';
import { currencyAPI, expensesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EmployeeExpenseForm = ({ expense, categories, onSubmit, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    description: '',
    categoryId: '',
    amount: '',
    currency: 'USD',
    expenseDate: '',
    paidBy: '',
    remarks: '',
    receiptUrl: '',
  });
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [companyBaseCurrency, setCompanyBaseCurrency] = useState('USD');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [showOcrResults, setShowOcrResults] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Set company base currency from user context
    if (user?.company?.base_currency) {
      setCompanyBaseCurrency(user.company.base_currency);
    }
  }, [user]);

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || '',
        categoryId: expense.category_id || '',
        amount: expense.amount || '',
        currency: expense.currency || 'USD',
        expenseDate: expense.submission_date ? new Date(expense.submission_date).toISOString().split('T')[0] : '',
        paidBy: expense.paid_by || '',
        remarks: expense.remarks || '',
        receiptUrl: expense.receipt_url || '',
      });
      
      // Load approval history if expense is submitted/approved
      if (expense.status !== 'draft') {
        loadApprovalHistory(expense.id);
      }
    } else {
      // Set default date to today for new expenses
      setFormData(prev => ({
        ...prev,
        expenseDate: new Date().toISOString().split('T')[0]
      }));
    }
  }, [expense]);

  useEffect(() => {
    if (formData.amount && formData.currency) {
      convertCurrency();
    }
  }, [formData.amount, formData.currency]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const convertCurrency = async () => {
    try {
      const response = await currencyAPI.convertCurrency({
        amount: parseFloat(formData.amount),
        fromCurrency: formData.currency,
        toCurrency: companyBaseCurrency,
      });
      setConvertedAmount(response.data.convertedAmount);
    } catch (error) {
      console.error('Currency conversion failed:', error);
    }
  };

  const loadApprovalHistory = async (expenseId) => {
    try {
      // This would typically call an API to get approval history
      // For now, we'll mock some data
      setApprovalHistory([
        {
          approver: 'Sarah',
          status: 'Approved',
          time: '12:44 4th Oct, 2025'
        }
      ]);
    } catch (error) {
      console.error('Failed to load approval history:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a JPG, PNG, or PDF file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const response = await expensesAPI.uploadReceipt(file);
      setUploadedFile({
        name: response.data.originalName,
        path: response.data.path,
        filename: response.data.filename,
        mimeType: file.type
      });
      setFormData(prev => ({
        ...prev,
        receiptUrl: response.data.path
      }));
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setFormData(prev => ({
      ...prev,
      receiptUrl: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processReceiptWithOCR = async () => {
    if (!uploadedFile) {
      alert('Please upload a receipt first');
      return;
    }

    setIsProcessingOCR(true);
    try {
      const response = await expensesAPI.processExistingReceipt(
        uploadedFile.path,
        uploadedFile.mimeType || 'image/jpeg'
      );
      
      setOcrResult(response.data.ocrData);
      setShowOcrResults(true);
      
      // Auto-fill form with OCR results
      if (response.data.ocrData) {
        const ocrData = response.data.ocrData;
        setFormData(prev => ({
          ...prev,
          description: ocrData.description || prev.description,
          amount: ocrData.amount || prev.amount,
          currency: ocrData.currency || prev.currency,
          expenseDate: ocrData.expenseDate || prev.expenseDate,
          categoryId: findCategoryIdByName(ocrData.category) || prev.categoryId
        }));
      }
    } catch (error) {
      console.error('OCR processing failed:', error);
      alert('Failed to process receipt with OCR. Please try again.');
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const findCategoryIdByName = (categoryName) => {
    const category = categories.find(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    );
    return category ? category.id : null;
  };

  const applyOcrResults = () => {
    if (ocrResult) {
      setFormData(prev => ({
        ...prev,
        description: ocrResult.description || prev.description,
        amount: ocrResult.amount || prev.amount,
        currency: ocrResult.currency || prev.currency,
        expenseDate: ocrResult.expenseDate || prev.expenseDate,
        categoryId: findCategoryIdByName(ocrResult.category) || prev.categoryId
      }));
      setShowOcrResults(false);
    }
  };

  const dismissOcrResults = () => {
    setShowOcrResults(false);
    setOcrResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (expense) {
        // Update existing expense
        await onSubmit(expense.id, formData);
      } else {
        // Create new expense
        await onSubmit(formData);
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expense) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this expense?\n\nDescription: ${expense.description}\nAmount: ${expense.amount} ${expense.currency}\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) return;
    
    setIsSubmitting(true);
    try {
      await expensesAPI.deleteExpense(expense.id);
      alert('Expense deleted successfully!');
      window.location.reload(); // Refresh to update the list
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setIsSubmitting(true);
    try {
      if (expense) {
        // Submit existing expense for approval
        await expensesAPI.submitExpense(expense.id);
        alert('Expense submitted for approval successfully!');
      } else {
        // Create new expense and submit for approval
        const newExpense = await onSubmit(formData);
        if (newExpense && newExpense.id) {
          await expensesAPI.submitExpense(newExpense.id);
          alert('Expense created and submitted for approval successfully!');
        }
      }
      // Refresh the expense data to show updated status
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Failed to submit expense:', error);
      alert('Failed to submit expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly = expense && expense.status !== 'draft';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                disabled={isReadOnly}
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isReadOnly || isUploading}
                className="btn-secondary"
              >
                {isUploading ? 'Uploading...' : 'Attach Receipt'}
              </button>
              {uploadedFile && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={processReceiptWithOCR}
                    disabled={isReadOnly || isProcessingOCR}
                    className="text-blue-600 hover:text-blue-800 text-sm bg-blue-50 px-2 py-1 rounded"
                  >
                    {isProcessingOCR ? 'Processing...' : 'Process with OCR'}
                  </button>
                  <button
                    type="button"
                    onClick={removeUploadedFile}
                    disabled={isReadOnly}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Draft &gt; Waiting approval &gt; Approved
            </div>
          </div>
          
          {/* OCR Results Modal */}
          {showOcrResults && ocrResult && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    OCR Results
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Confidence</label>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${ocrResult.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{ocrResult.confidence}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {ocrResult.description || 'Not detected'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Amount</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {ocrResult.amount ? `${ocrResult.amount} ${ocrResult.currency}` : 'Not detected'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Date</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {ocrResult.expenseDate || 'Not detected'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {ocrResult.category || 'Not detected'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Merchant</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {ocrResult.merchant || 'Not detected'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
                    <button
                      type="button"
                      onClick={dismissOcrResults}
                      className="btn-secondary"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={applyOcrResults}
                      className="btn-primary"
                    >
                      Apply to Form
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    name="description"
                    required
                    className="form-input"
                    placeholder="Enter expense description"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={isReadOnly}
                  />
                </div>

                <div>
                  <label className="form-label">Category</label>
                  <select
                    name="categoryId"
                    required
                    className="form-input"
                    value={formData.categoryId}
                    onChange={handleChange}
                    disabled={isReadOnly}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Total amount in currency selection</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      name="amount"
                      required
                      step="0.01"
                      className="form-input flex-1"
                      placeholder="567"
                      value={formData.amount}
                      onChange={handleChange}
                      disabled={isReadOnly}
                    />
                    <select
                      name="currency"
                      required
                      className="form-input w-24"
                      value={formData.currency}
                      onChange={handleChange}
                      disabled={isReadOnly}
                    >
                      <option value="USD">$</option>
                      <option value="EUR">€</option>
                      <option value="GBP">£</option>
                      <option value="INR">₹</option>
                      <option value="CAD">C$</option>
                      <option value="AUD">A$</option>
                    </select>
                  </div>
                  
                  {/* Currency conversion notes */}
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-red-600">
                      Employee can submit expense in any currency (currency in which he spent the money in receipt)
                    </p>
                    <p className="text-xs text-red-600">
                      In manager's approval dashboard, the amount should get auto-converted to base currency of the company with real-time today's currency conversion rates.
                    </p>
                    {convertedAmount && (
                      <p className="text-xs text-gray-500">
                        Converted to company currency: ${convertedAmount.toFixed(2)} ${companyBaseCurrency}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="form-label">Expense Date</label>
                  <input
                    type="date"
                    name="expenseDate"
                    required
                    className="form-input"
                    value={formData.expenseDate}
                    onChange={handleChange}
                    disabled={isReadOnly}
                  />
                </div>

                <div>
                  <label className="form-label">Paid by</label>
                  <select
                    name="paidBy"
                    className="form-input"
                    value={formData.paidBy}
                    onChange={handleChange}
                    disabled={isReadOnly}
                  >
                    <option value="">Select payment method</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Remarks</label>
                  <textarea
                    name="remarks"
                    rows={3}
                    className="form-input"
                    placeholder="Additional notes (optional)"
                    value={formData.remarks}
                    onChange={handleChange}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>

            {/* Approval History Section */}
            {approvalHistory.length > 0 && (
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Approval History</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approver</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {approvalHistory.map((approval, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{approval.approver}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-success-100 text-success-800">
                              {approval.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{approval.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {!isReadOnly && (
              <div className="flex justify-between pt-4 border-t">
                <div>
                  {expense && expense.status === 'draft' && (
                    <button
                      type="button"
                      onClick={handleDeleteExpense}
                      disabled={isSubmitting}
                      className="btn-danger"
                    >
                      {isSubmitting ? 'Deleting...' : 'Delete Draft'}
                    </button>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-secondary"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitForApproval}
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                  </button>
                </div>
              </div>
            )}

            {/* Post-submission instructions */}
            {isReadOnly && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Once submitted the record should become readonly for employee and the submit button should be invisible and state should be pending approval. Now, there should be a log history visible that which user approved/rejected your request at what time.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeExpenseForm;
