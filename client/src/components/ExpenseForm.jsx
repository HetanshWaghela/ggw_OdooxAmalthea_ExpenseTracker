import { useState, useEffect } from 'react';
import { currencyAPI } from '../services/api';

const ExpenseForm = ({ expense, categories, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    description: '',
    categoryId: '',
    amount: '',
    currency: 'USD',
    paidBy: '',
    remarks: '',
    receiptUrl: '',
  });
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || '',
        categoryId: expense.category_id || '',
        amount: expense.amount || '',
        currency: expense.currency || 'USD',
        paidBy: expense.paid_by || '',
        remarks: expense.remarks || '',
        receiptUrl: expense.receipt_url || '',
      });
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
        toCurrency: 'USD', // Assuming company base currency is USD
      });
      setConvertedAmount(response.data.convertedAmount);
    } catch (error) {
      console.error('Currency conversion failed:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (expense) {
        await onSubmit(expense.id, formData);
      } else {
        await onSubmit(formData);
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  name="amount"
                  required
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="form-label">Currency</label>
                <select
                  name="currency"
                  required
                  className="form-input"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>

            {convertedAmount && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  Amount in company currency: <span className="font-medium">${convertedAmount.toFixed(2)} USD</span>
                </p>
              </div>
            )}

            <div>
              <label className="form-label">Paid By</label>
              <select
                name="paidBy"
                className="form-input"
                value={formData.paidBy}
                onChange={handleChange}
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
              />
            </div>

            <div>
              <label className="form-label">Receipt URL</label>
              <input
                type="url"
                name="receiptUrl"
                className="form-input"
                placeholder="https://example.com/receipt"
                value={formData.receiptUrl}
                onChange={handleChange}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
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
                className="btn-primary"
              >
                {isSubmitting ? 'Saving...' : (expense ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;
