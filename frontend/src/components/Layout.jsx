import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaUserShield } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import ThemeToggleButton from './ThemeToggleButton';
import Notifications from './Notifications';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleFeedClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
      <nav className="bg-white shadow-md dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            <Link to="/dashboard">BragBoard</Link>
          </h1>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.department}</p>
            </div>
            <Link to="/profile">
              {user?.profile_picture_url ? (
                <img
                  src={`http://localhost:8000${user.profile_picture_url}`}
                  alt="Profile"
                  className="rounded-full w-10 h-10 object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0)}
                </div>
              )}
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                title="Admin Dashboard"
              >
                <FaUserShield size={24} />
              </Link>
            )}
            <ThemeToggleButton />
            <Notifications />
            <button
              onClick={logout}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              title="Logout"
            >
              <FaSignOutAlt size={20} />
            </button>
          </div>
        </div>
      </nav>
      <main>
        <div className="max-w-6xl mx-auto px-4 py-4">
          {location.pathname !== '/dashboard' && ( // Changed condition here
            <div className="mb-4">
              <button
                onClick={handleFeedClick}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                Feed
              </button>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
