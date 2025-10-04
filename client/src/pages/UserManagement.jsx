import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import UserManagement from '../components/UserManagement';

const UserManagementPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
      </div>
      
      <UserManagement />
    </div>
  );
};

export default UserManagementPage;
