import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ApprovalRules from '../components/ApprovalRules';

const ApprovalRulesPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Approval Rules</h1>
      </div>
      
      <ApprovalRules />
    </div>
  );
};

export default ApprovalRulesPage;
