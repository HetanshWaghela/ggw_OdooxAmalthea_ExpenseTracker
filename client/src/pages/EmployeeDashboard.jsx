import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { expensesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmployeeExpenseForm from '../components/EmployeeExpenseForm';
import ExpenseList from '../components/ExpenseList';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [companyBaseCurrency, setCompanyBaseCurrency] = useState('USD');

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
    // Set company base currency from user context
    if (user?.company?.base_currency) {
      setCompanyBaseCurrency(user.company.base_currency);
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      const response = await expensesAPI.getExpenses();
      setExpenses(response.data.expenses);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await expensesAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleCreateExpense = async (expenseData) => {
    try {
      await expensesAPI.createExpense(expenseData);
      await fetchExpenses();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create expense:', error);
    }
  };

  const handleUpdateExpense = async (id, expenseData) => {
    try {
      await expensesAPI.updateExpense(id, expenseData);
      await fetchExpenses();
      setEditingExpense(null);
    } catch (error) {
      console.error('Failed to update expense:', error);
    }
  };

  const handleSubmitExpense = async (id) => {
    try {
      await expensesAPI.submitExpense(id);
      await fetchExpenses();
    } catch (error) {
      console.error('Failed to submit expense:', error);
    }
  };

  const handleDeleteExpense = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this expense? This action cannot be undone.'
    );
    
    if (!confirmDelete) return;
    
    try {
      await expensesAPI.deleteExpense(id);
      await fetchExpenses();
      alert('Expense deleted successfully!');
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingExpense(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const draftExpenses = expenses.filter(expense => expense.status === 'draft');
  const submittedExpenses = expenses.filter(expense => expense.status === 'submitted');
  const approvedExpenses = expenses.filter(expense => expense.status === 'approved');
  const rejectedExpenses = expenses.filter(expense => expense.status === 'rejected');

  // Calculate amounts for each status
  const toSubmitAmount = draftExpenses.reduce((sum, expense) => sum + (expense.amount_in_base_currency || expense.amount), 0);
  const waitingApprovalAmount = submittedExpenses.reduce((sum, expense) => sum + (expense.amount_in_base_currency || expense.amount), 0);
  const approvedAmount = approvedExpenses.reduce((sum, expense) => sum + (expense.amount_in_base_currency || expense.amount), 0);

  const statusCards = [
    {
      title: 'To Submit',
      amount: toSubmitAmount,
      count: draftExpenses.length,
      icon: DocumentTextIcon,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-gradient-to-r from-yellow-50 to-orange-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      description: 'Draft expenses ready for submission'
    },
    {
      title: 'Waiting Approval',
      amount: waitingApprovalAmount,
      count: submittedExpenses.length,
      icon: ClockIcon,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-gradient-to-r from-blue-50 to-indigo-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      description: 'Pending manager review'
    },
    {
      title: 'Approved',
      amount: approvedAmount,
      count: approvedExpenses.length,
      icon: CheckCircleIcon,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      description: 'Successfully approved expenses'
    },
    {
      title: 'Rejected',
      amount: 0,
      count: rejectedExpenses.length,
      icon: XCircleIcon,
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-gradient-to-r from-red-50 to-pink-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      description: 'Expenses requiring revision'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Dashboard</h2>
          <p className="text-gray-600 mt-1">Track and manage your expense submissions</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
            <PhotoIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Upload Receipt</span>
          </button>
          <button
            onClick={() => {
              setEditingExpense(null);
              setShowForm(true);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="font-medium">New Expense</span>
          </button>
        </div>
      </div>

      {/* OCR Feature Highlight */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">🔍</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Smart OCR Processing</h3>
            <p className="text-sm text-blue-700 mt-1">
              Upload receipts or take photos to automatically extract expense details using advanced OCR technology
            </p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card, index) => (
          <div key={index} className={`${card.bgColor} ${card.borderColor} border rounded-xl p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-lg flex items-center justify-center shadow-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${card.textColor}`}>{card.title}</p>
                <p className={`text-xs ${card.textColor} opacity-75`}>
                  {card.count} expenses
                </p>
              </div>
            </div>
            <p className={`text-2xl font-bold ${card.textColor} mb-2`}>
              {card.amount.toLocaleString()} {companyBaseCurrency}
            </p>
            <p className={`text-xs ${card.textColor} opacity-75`}>
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CurrencyDollarIcon className="h-8 w-8 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(toSubmitAmount + waitingApprovalAmount + approvedAmount).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Submitted</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <ChartBarIcon className="h-8 w-8 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {approvedExpenses.length > 0 ? Math.round((approvedExpenses.length / (approvedExpenses.length + rejectedExpenses.length)) * 100) : 0}%
            </p>
            <p className="text-sm text-gray-600">Approval Rate</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <DocumentTextIcon className="h-8 w-8 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
            <p className="text-sm text-gray-600">Total Expenses</p>
          </div>
        </div>
      </div>

      {/* Expense Form Modal */}
      {showForm && (
        <EmployeeExpenseForm
          expense={editingExpense}
          categories={categories}
          onSubmit={editingExpense ?
            (data) => handleUpdateExpense(editingExpense.id, data) :
            handleCreateExpense
          }
          onCancel={handleCancelForm}
        />
      )}

      {/* Expense Details Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Expense Details</h3>
          <p className="text-sm text-gray-600 mt-1">Manage and track all your expense submissions</p>
        </div>
        <div className="p-6">
          <ExpenseList
            expenses={expenses}
            onEdit={handleEditExpense}
            onSubmit={handleSubmitExpense}
            onDelete={handleDeleteExpense}
            companyBaseCurrency={companyBaseCurrency}
            showActions={true}
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
