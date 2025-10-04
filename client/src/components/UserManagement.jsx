import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { generateRandomPassword } from '../utils/passwordUtils';
import LoadingSpinner from '../components/LoadingSpinner';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'employee',
    managerId: '',
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const generatePassword = () => {
    const newPassword = generateRandomPassword();
    setGeneratedPassword(newPassword);
    setFormData(prev => ({
      ...prev,
      password: newPassword
    }));
    setShowGeneratedPassword(true);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    alert('Password copied to clipboard!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        await usersAPI.updateUser(editingUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          managerId: formData.managerId || null,
        });
      } else {
        await usersAPI.createUser(formData);
      }
      
      await fetchUsers();
      setShowForm(false);
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'employee',
        managerId: '',
      });
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      password: '',
      role: user.role,
      managerId: user.manager_id || '',
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setShowGeneratedPassword(false);
    setGeneratedPassword('');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'employee',
      managerId: '',
    });
  };

  const handleSendPassword = async (userId, email) => {
    if (window.confirm(`Send a randomly generated password to ${email}?`)) {
      try {
        await usersAPI.sendPassword(userId);
        alert('Password sent successfully to user\'s email');
      } catch (error) {
        console.error('Failed to send password:', error);
        alert('Failed to send password. Please try again.');
      }
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
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
        <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          Add New User
        </button>
      </div>

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      className="form-input"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      className="form-input"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="form-input"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!!editingUser}
                  />
                </div>

                {!editingUser && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="form-label">Password</label>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        Generate Password
                      </button>
                    </div>
                    <input
                      type="password"
                      name="password"
                      required
                      className="form-input"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password or generate one"
                    />
                    
                    {/* Show generated password */}
                    {showGeneratedPassword && generatedPassword && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-800">
                            Generated Password: <strong>{generatedPassword}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={copyPassword}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          This password will be sent to the user's email automatically.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="form-label">Role</label>
                  <select
                    name="role"
                    required
                    className="form-input"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    {editingUser && <option value="admin">Admin</option>}
                  </select>
                </div>

                {formData.role === 'employee' && (
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
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
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
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Name</th>
                <th className="table-header-cell">Email</th>
                <th className="table-header-cell">Role</th>
                <th className="table-header-cell">Manager</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="table-cell">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="table-cell">{user.email}</td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="table-cell">
                    {user.managers ? `${user.managers.first_name} ${user.managers.last_name}` : 'N/A'}
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-primary-600 hover:text-primary-900 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleSendPassword(user.id, user.email)}
                        className="text-success-600 hover:text-success-900 text-sm"
                      >
                        Send Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
