"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getNotifications } from "@/lib/pocketbase-db";
import { Notification } from "@/types";
import { Bell, BellOff, AlertTriangle, Info, PartyPopper } from "lucide-react";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const getReadNotificationIds = (): string[] => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem('read_notifications');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    };

    const fetchNotifications = async () => {
        try {
            const allNotifications = await getNotifications();
            const readIds = getReadNotificationIds();

            // For now, we show all but mark them based on localStorage
            const unread = allNotifications.filter(n => n.id && !readIds.includes(n.id));

            setNotifications(allNotifications);
            setUnreadCount(unread.length);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Refresh notifications every 5 minutes
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAllAsRead = () => {
        const currentReadIds = getReadNotificationIds();
        const allIds = notifications
            .map(n => n.id)
            .filter((id): id is string => !!id);

        const updatedReadIds = Array.from(new Set([...currentReadIds, ...allIds]));
        localStorage.setItem('read_notifications', JSON.stringify(updatedReadIds));

        setUnreadCount(0);
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2.5 rounded-xl transition-all relative ${isOpen ? 'bg-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}
                aria-label="Notifications"
            >
                <Bell size={20} className={unreadCount > 0 ? "animate-swing" : ""} />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Announcements</h3>
                        {unreadCount > 0 && (
                            <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                                {unreadCount} New
                            </span>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-hide">
                        {loading ? (
                            <div className="p-12 text-center text-slate-400">
                                <div className="w-8 h-8 border-3 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-sm font-medium">Fetching updates...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <BellOff size={28} className="text-slate-200" />
                                </div>
                                <p className="text-sm font-medium">No active announcements</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {notifications.map((notif) => {
                                    const isRead = getReadNotificationIds().includes(notif.id || '');
                                    return (
                                        <div
                                            key={notif.id}
                                            className={`p-4 rounded-2xl transition-all group relative ${isRead ? 'opacity-60 grayscale-[0.5]' : 'bg-white hover:bg-slate-50'}`}
                                        >
                                            <div className="flex gap-4">
                                                <div className={`
                                                    w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm
                                                    ${notif.type === 'alert' ? 'bg-rose-50 text-rose-500' : notif.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}
                                                `}>
                                                    {notif.type === 'alert' ? <AlertTriangle size={18} /> : notif.type === 'success' ? <PartyPopper size={18} /> : <Info size={18} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm text-slate-900 leading-tight mb-1 truncate">{notif.title}</h4>
                                                    <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{notif.message}</p>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                            {new Date(notif.createdAt * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                        {!isRead && <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 transition-colors py-2 px-4"
                            >
                                Clear all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
