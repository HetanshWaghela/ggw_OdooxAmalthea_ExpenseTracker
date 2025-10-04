import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const ApprovalRules = () => {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    description: '',
    managerId: '',
    isManagerApprover: false,
    approversSequence: false,
    minimumApprovalPercentage: 100,
    approvers: [],
  });

  useEffect(() => {
    fetchUsers();
    fetchManagers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await usersAPI.getManagers();
      setManagers(response.data.managers);
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleAddApprover = () => {
    setFormData({
      ...formData,
      approvers: [...formData.approvers, { userId: '', required: false, sequenceOrder: formData.approvers.length + 1 }],
    });
  };

  const handleRemoveApprover = (index) => {
    setFormData({
      ...formData,
      approvers: formData.approvers.filter((_, i) => i !== index),
    });
  };

  const handleApproverChange = (index, field, value) => {
    const newApprovers = [...formData.approvers];
    newApprovers[index] = { ...newApprovers[index], [field]: value };
    setFormData({
      ...formData,
      approvers: newApprovers,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Here you would typically call an API to create/update approval rules
      console.log('Approval rule data:', formData);
      
      setShowForm(false);
      setFormData({
        userId: '',
        description: '',
        managerId: '',
        isManagerApprover: false,
        approversSequence: false,
        minimumApprovalPercentage: 100,
        approvers: [],
      });
    } catch (error) {
      console.error('Failed to save approval rule:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      userId: '',
      description: '',
      managerId: '',
      isManagerApprover: false,
      approversSequence: false,
      minimumApprovalPercentage: 100,
      approvers: [],
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Admin View (Approval Rules)</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          Create Approval Rule
        </button>
      </div>

      {/* Approval Rule Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Admin View (Approval Rules)
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Panel */}
                  <div className="space-y-6">
                    <div>
                      <label className="form-label">User</label>
                      <select
                        name="userId"
                        required
                        className="form-input"
                        value={formData.userId}
                        onChange={handleChange}
                      >
                        <option value="">Select User</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Description about rules</label>
                      <textarea
                        name="description"
                        rows={3}
                        className="form-input"
                        placeholder="Approval rule for miscellaneous expenses"
                        value={formData.description}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label className="form-label">Manager</label>
                      <select
                        name="managerId"
                        className="form-input"
                        value={formData.managerId}
                        onChange={handleChange}
                      >
                        <option value="">Select Manager</option>
                        {managers.map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {manager.first_name} {manager.last_name}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Dynamic dropdown. Initially the manager set on user record should be set, admin can change manager for approval if required.
                      </p>
                    </div>
                  </div>

                  {/* Right Panel */}
                  <div className="space-y-6">
                    {/* Manager as Approver */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isManagerApprover"
                          checked={formData.isManagerApprover}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm font-medium text-gray-900">
                          Is manager an approver?
                        </label>
                      </div>
                      <p className="mt-2 text-xs text-red-600">
                        If this field is checked then by default the approve request would go to his/her manager first, before going to other approvers.
                      </p>
                    </div>

                    {/* Approvers List */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Approvers</h4>
                      <div className="space-y-3">
                        {formData.approvers.map((approver, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                            <span className="text-sm font-medium text-gray-700 w-8">
                              {index + 1}.
                            </span>
                            <select
                              className="form-input flex-1"
                              value={approver.userId}
                              onChange={(e) => handleApproverChange(index, 'userId', e.target.value)}
                            >
                              <option value="">Select Approver</option>
                              {users.filter(user => user.role === 'manager' || user.role === 'admin').map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.first_name} {user.last_name}
                                </option>
                              ))}
                            </select>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={approver.required}
                                onChange={(e) => handleApproverChange(index, 'required', e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                              <label className="ml-2 text-sm text-gray-700">Required</label>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveApprover(index)}
                              className="text-danger-600 hover:text-danger-900"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={handleAddApprover}
                          className="text-primary-600 hover:text-primary-900 text-sm"
                        >
                          + Add Approver
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        If this field is ticked, then anyhow approval of this approver is required in any approval combination scenarios.
                      </p>
                    </div>

                    {/* Approvers Sequence */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="approversSequence"
                          checked={formData.approversSequence}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm font-medium text-gray-900">
                          Approvers Sequence
                        </label>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        If this field is ticked true then the above mentioned sequence of approvers matters, that is first the request goes to John, if he approves/rejects then only request goes to Mitchell and so on. If the required approver rejects the request, then expense request is auto-rejected. If not ticked then send approver request to all approvers at the same time.
                      </p>
                    </div>

                    {/* Minimum Approval Percentage */}
                    <div>
                      <label className="form-label">Minimum Approval percentage</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          name="minimumApprovalPercentage"
                          min="1"
                          max="100"
                          className="form-input w-20"
                          value={formData.minimumApprovalPercentage}
                          onChange={handleChange}
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Specify the number of percentage approvers required in order to get the request approved.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Create Rule
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Approval Rules</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No approval rules created yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first approval rule to get started</p>
        </div>
      </div>
    </div>
  );
};

export default ApprovalRules;
