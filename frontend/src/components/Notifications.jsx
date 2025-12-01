import { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import { notificationsAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const formatNotificationTitle = (notification) => {
  switch (notification.type) {
    case "tag":
      return "You were recognized in a shout-out";
    case "comment":
      return "New comment on your shout-out";
    case "reaction":
      return "New reaction on your shout-out";
    case "report":
      return "New report submitted";
    default:
      return "Notification";
  }
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      const data = response.data;
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await notificationsAPI.markNotificationRead(notification.id);
        setNotifications(notifications.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
        setUnreadCount(prev => prev - 1);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    if (notification.type === "report" && user?.role === "admin") {
      navigate("/admin");
    } else if (notification.shoutout_id) {
      navigate('/dashboard', {
        state: {
          highlightShoutoutId: notification.shoutout_id || null,
          highlightCommentId: notification.comment_id || null,
        },
      });
    }
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 relative"
        aria-label="Notifications"
      >
        <FaBell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center transform translate-x-1/2 -translate-y-1/2">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-20">
          <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <ul>
                {notifications.map(notification => (
                  <li
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b dark:border-gray-700 cursor-pointer ${
                      !notification.is_read ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    } hover:bg-gray-100 dark:hover:bg-gray-700`}
                  >
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {formatNotificationTitle(notification)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {notification.message}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
