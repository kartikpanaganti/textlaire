import { useState } from "react";
import { FaCheck, FaTrash, FaBell, FaEnvelope, FaCalendarAlt, FaFile, FaUserFriends } from "react-icons/fa";

function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      type: "message", 
      text: "New message received", 
      description: "You have a new message from John Doe",
      time: "2 min ago", 
      read: false,
      icon: <FaEnvelope className="text-blue-500" />
    },
    { 
      id: 2, 
      type: "document", 
      text: "Your document was shared", 
      description: "The presentation was shared with your team",
      time: "1 hour ago", 
      read: false,
      icon: <FaFile className="text-green-500" />
    },
    { 
      id: 3, 
      type: "reminder", 
      text: "Meeting reminder: Team standup", 
      description: "Your team standup starts in 15 minutes",
      time: "3 hours ago", 
      read: false,
      icon: <FaCalendarAlt className="text-red-500" />
    },
    { 
      id: 4, 
      type: "mention", 
      text: "You were mentioned in a comment", 
      description: "Sarah mentioned you in a document comment",
      time: "5 hours ago", 
      read: true,
      icon: <FaUserFriends className="text-purple-500" />
    },
    { 
      id: 5, 
      type: "system", 
      text: "System update completed", 
      description: "The system has been updated to the latest version",
      time: "1 day ago", 
      read: true,
      icon: <FaBell className="text-yellow-500" />
    }
  ]);

  const [filter, setFilter] = useState("all");

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };

  // Delete notification
  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Filter notifications
  const filteredNotifications = filter === "all" 
    ? notifications 
    : filter === "unread" 
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => n.read);

  // Get unread notification count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
            >
              <FaCheck size={12} /> Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              onClick={clearAll}
              className="px-4 py-2 text-sm border border-red-500 text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1"
            >
              <FaTrash size={12} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button 
          className={`pb-2 px-4 font-medium ${filter === 'all' 
            ? 'border-b-2 border-blue-500 text-blue-500' 
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`pb-2 px-4 font-medium ${filter === 'unread' 
            ? 'border-b-2 border-blue-500 text-blue-500' 
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          onClick={() => setFilter('unread')}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button 
          className={`pb-2 px-4 font-medium ${filter === 'read' 
            ? 'border-b-2 border-blue-500 text-blue-500' 
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          onClick={() => setFilter('read')}
        >
          Read
        </button>
      </div>

      {/* Notifications list */}
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-md">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <FaBell className="mx-auto text-4xl mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm">
              {filter === "all" 
                ? "You don't have any notifications at the moment." 
                : filter === "unread" 
                  ? "You don't have any unread notifications." 
                  : "You don't have any read notifications."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full mr-3">
                    {notification.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {notification.text}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {notification.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {notification.time}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <button 
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            aria-label="Mark as read"
                          >
                            <FaCheck className="text-xs" />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          aria-label="Delete notification"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage; 