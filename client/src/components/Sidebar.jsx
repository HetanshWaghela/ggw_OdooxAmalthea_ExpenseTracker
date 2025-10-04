import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  CogIcon,
  ChartBarIcon,
  PlusIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

    const navigation = [
      { 
        name: 'Dashboard', 
        href: '/app/dashboard', 
        icon: HomeIcon, 
        roles: ['admin', 'manager', 'employee'],
        description: 'Overview & Analytics'
      },
      { 
        name: 'My Expenses', 
        href: '/app/employee/expenses', 
        icon: DocumentTextIcon, 
        roles: ['employee'], // Only for employees, not admin/manager
        description: 'Track & Submit Expenses'
      },
      { 
        name: 'Pending Approvals', 
        href: '/app/manager/approvals', 
        icon: CheckCircleIcon, 
        roles: ['manager', 'admin'],
        description: 'Review & Approve'
      },
      { 
        name: 'User Management', 
        href: '/app/admin/users', 
        icon: UserGroupIcon, 
        roles: ['admin'],
        description: 'Manage Team Members'
      },
      { 
        name: 'Approval Rules', 
        href: '/app/admin/rules', 
        icon: CogIcon, 
        roles: ['admin'],
        description: 'Configure Workflows'
      },
      { 
        name: 'Reports', 
        href: '/app/admin/reports', 
        icon: ChartBarIcon, 
        roles: ['admin'],
        description: 'Analytics & Insights'
      },
    ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'from-purple-500 to-purple-600';
      case 'manager': return 'from-blue-500 to-blue-600';
      case 'employee': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="sidebar flex flex-col h-full">
      {/* User Profile Section */}
      <div className={`p-6 bg-gradient-to-r ${getRoleColor(user?.role)} text-white`}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-bold text-xl">
              {user?.first_name?.charAt(0) || 'E'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-lg">{user?.first_name} {user?.last_name}</h3>
            <p className="text-white text-opacity-80 text-sm capitalize">{user?.role}</p>
            <p className="text-white text-opacity-60 text-xs">{user?.company?.name}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {user?.role === 'employee' && (
        <div className="p-4 border-b border-gray-100">
          <Link
            to="/employee/expenses"
            className="btn-primary flex items-center space-x-3 w-full justify-center"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="font-medium">New Expense</span>
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`nav-item group ${isActive ? 'active' : ''}`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <div className="flex-1">
                <span className="font-medium">{item.name}</span>
                <p className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {item.description}
                </p>
              </div>
              {isActive && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CurrencyDollarIcon className="h-4 w-4" />
            <span>Base Currency: {user?.company?.base_currency || 'USD'}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-2">
            <ClockIcon className="h-4 w-4" />
            <span>Last login: Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
