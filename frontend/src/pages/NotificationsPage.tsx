import React, { useEffect, useState } from 'react';
import { AppHeader } from '../components/layout/AppHeader';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { notificationApi } from '../services/api/notification.api';
import { useAuthStore } from '../store/useAuthStore';
import { Bell, CheckCheck } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications();
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    await notificationApi.markAllRead();
    await loadNotifications();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24 md:pb-0">
      <AppHeader />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Bell size={22} className="text-amber-600" />
              <span>Notifications & Alerts</span>
            </h2>

            {unreadCount > 0 && (
              <Button size="sm" variant="outline" onClick={handleMarkAllRead} icon={<CheckCheck size={16} />}>
                Mark All Read
              </Button>
            )}
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-slate-200">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Bell size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-700">You're all caught up!</p>
                  <p className="text-xs text-slate-500 mt-1">No notifications at this time.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`p-4 transition-colors ${
                      n.read ? 'bg-white' : 'bg-amber-50/70 border-l-4 border-l-amber-600 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 text-sm">{n.title}</h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </main>
      </div>

      {user?.role === 'FARMER' && <BottomNavigation />}
    </div>
  );
};
