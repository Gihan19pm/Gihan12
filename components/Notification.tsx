import React from 'react';
import { Heart, AlertCircle } from 'lucide-react';
import { NotificationState } from '../types';

interface NotificationProps {
  notification: NotificationState | null;
}

const Notification: React.FC<NotificationProps> = ({ notification }) => {
  if (!notification) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl transform transition-all duration-500 ease-in-out flex items-center gap-2 ${
      notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
    }`}>
      {notification.type === 'success' ? (
        <Heart size={18} className="animate-pulse" />
      ) : (
        <AlertCircle size={18} />
      )}
      {notification.message}
    </div>
  );
};

export default Notification;