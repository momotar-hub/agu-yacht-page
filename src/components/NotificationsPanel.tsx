import React, { useState, useEffect, useRef } from "react";
import { Notification } from "../types";
import { Bell, Check, CheckSquare, MessageSquare, Flame, ShieldAlert, X } from "lucide-react";

interface NotificationsPanelProps {
  currentUserToken: string;
  onNotificationClicked: (reflectionId: string) => void;
  // Triggered when any new real-time notification is received to trigger audio play or UI toast
  onNewNotificationArrived?: (message: string) => void;
}

export default function NotificationsPanel({
  currentUserToken,
  onNotificationClicked,
  onNewNotificationArrived
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${currentUserToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen to real-time events via Server-Sent Events (SSE)
    const sseUrl = `/api/events?token=${currentUserToken}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      if (event.data === "connected") return;
      try {
        const eventData = JSON.parse(event.data);
        // It's a notification packet from the server!
        if (eventData.id && eventData.user_id === currentUserToken) {
          // Add to beginning of local state
          setNotifications(prev => {
            if (prev.some(n => n.id === eventData.id)) return prev;
            return [eventData, ...prev];
          });
          
          // Trigger audio chime or parent toast
          if (onNewNotificationArrived) {
            onNewNotificationArrived(eventData.message);
          }
        }
      } catch (err) {
        // Ignored
      }
    };

    // Click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      eventSource.close();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [currentUserToken]);

  // Mark notification as read
  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // don't trigger click on container
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${currentUserToken}` }
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${currentUserToken}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative z-50" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-red-500 text-white font-black font-mono text-[9px] h-4 w-4 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-wave">
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-sky-500" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">通知センター</h3>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] text-sky-600 hover:text-sky-800 font-bold flex items-center gap-0.5 hover:underline"
              >
                <CheckSquare className="w-3.5 h-3.5" /> すべて既読
              </button>
            )}
          </div>

          {/* List content */}
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                新しい通知はありません。
              </div>
            ) : (
              notifications.map(notif => {
                const iconMap = {
                  practice_reminder: { icon: Flame, color: "text-rose-500 bg-rose-50" },
                  comment: { icon: MessageSquare, color: "text-sky-600 bg-sky-50" },
                  reply: { icon: MessageSquare, color: "text-indigo-600 bg-indigo-50" }
                };
                const { icon: NotifIcon, color: iconColor } = iconMap[notif.type] || { icon: ShieldAlert, color: "text-slate-500 bg-slate-150" };

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (notif.linked_reflection_id) {
                        onNotificationClicked(notif.linked_reflection_id);
                        setIsOpen(false);
                      }
                      // auto mark read
                      if (!notif.is_read) {
                        const fakeEvent = { stopPropagation: () => {} } as any;
                        handleMarkAsRead(notif.id, fakeEvent);
                      }
                    }}
                    className={`p-3.5 flex gap-3 cursor-pointer transition-colors relative ${
                      notif.is_read ? "bg-white hover:bg-slate-50/50" : "bg-sky-50/20 hover:bg-sky-50/40"
                    }`}
                  >
                    {/* Icon indicator */}
                    <div className={`p-2 rounded-xl h-8 w-8 flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                      <NotifIcon className="w-4 h-4" />
                    </div>

                    {/* Text block */}
                    <div className="min-w-0 flex-grow pr-4">
                      <p className={`text-xs leading-normal text-slate-700 ${!notif.is_read ? "font-bold" : ""}`}>
                        {notif.message}
                      </p>
                      <span className="text-[9px] text-slate-400 font-mono block mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>

                    {/* Check Action */}
                    {!notif.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white hover:bg-slate-100 rounded-full border border-slate-100 text-sky-600 transition-colors"
                        title="既読にする"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
