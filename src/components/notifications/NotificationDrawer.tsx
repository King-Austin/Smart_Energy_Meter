import React from 'react';
import { useMeter } from '../../context/MeterContext';
import {
  X,
  ZapOff,
  Zap,
  AlertTriangle,
  Share2,
  WifiOff,
  CheckCircle2,
  CheckCheck,
  Trash2
} from 'lucide-react';
import { NotificationItem } from '../../types/meter';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markAllNotificationsRead, dismissNotification } = useMeter();

  if (!isOpen) return null;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'outage':
        return <ZapOff className="w-4 h-4 text-amber-400" />;
      case 'restored':
        return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'sharing':
        return <Share2 className="w-4 h-4 text-cyan-400" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-[440px] h-full bg-neutral-900 dark:bg-neutral-950 text-neutral-100 border-l border-neutral-800 shadow-2xl flex flex-col animate-slide-up">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Notification Center</h2>
            <p className="text-xs text-neutral-400">
              {notifications.length} alerts and system updates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsRead}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
              <CheckCircle2 className="w-10 h-10 mb-2 opacity-40 text-emerald-400" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-neutral-500 mt-1">No notifications at the moment.</p>
            </div>
          ) : (
            notifications.map(item => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  item.is_read
                    ? 'bg-neutral-900/40 border-neutral-800/60 opacity-75'
                    : 'bg-neutral-800/80 border-emerald-500/30 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-neutral-800 border border-neutral-700/50 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-neutral-200 truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissNotification(item.id)}
                    className="text-neutral-500 hover:text-neutral-300 p-1"
                    title="Dismiss"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/60">
          <button
            onClick={onClose}
            className="btn-secondary w-full text-xs py-2.5"
          >
            Close Notifications
          </button>
        </div>

      </div>
    </div>
  );
};
