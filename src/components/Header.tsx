
import React from 'react';
import { User, Home, Calculator } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  user: {
    name: string;
    avatar?: string;
  };
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  const navigationItems = [
    { path: '/', label: 'Haupt-Chat', icon: Home },
    { path: '/pizzaofen', label: 'Pizzaofen-Rechner', icon: Calculator },
    { path: '/demo', label: 'Demo', icon: User }
  ];
  return (
    <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-lg mb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-orange-200 dark:bg-orange-700 flex items-center justify-center">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-orange-600 dark:text-orange-300" />
          )}
        </div>
        <div>
          <p className="text-orange-600 dark:text-orange-300 text-sm">{getGreeting()},</p>
          <h1 className="text-2xl font-bold text-orange-900 dark:text-orange-100">{user.name}</h1>
        </div>
        
        {/* Navigation */}
        <div className="ml-auto flex items-center gap-2">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-orange-200 dark:bg-orange-700 text-orange-900 dark:text-orange-100' 
                    : 'bg-white/50 dark:bg-gray-800/50 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-800/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:block">{item.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
        </div>
      </div>
    </div>
  );
};

export default Header;
