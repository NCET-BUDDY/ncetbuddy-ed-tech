"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Notification } from "@/types";
import { getNotifications, createNotification } from "@/lib/pocketbase-db";

export default function NotificationsManagerPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState<'info' | 'alert' | 'success'>('info');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!title || !message) {
            alert("Please fill in title and message.");
            return;
        }

        try {
            await createNotification({
                title,
                message,
                type,
                createdAt: Math.floor(Date.now() / 1000)
            });
            alert("Notification sent successfully!");
            setTitle("");
            setMessage("");
            fetchNotifications();
        } catch (error) {
            console.error("Error sending notification:", error);
            alert("Failed to send notification.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Notifications Manager</h1>
                <p className="text-gray-500 text-sm">Send official updates and alerts to all students.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Side */}
                <div className="space-y-6">
                    <Card className="p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 font-black text-6xl pointer-events-none -rotate-12">
                            📢
                        </div>
                        <h3 className="text-xl font-black uppercase italic mb-6 relative z-10">Compose Message</h3>

                        <div className="space-y-4 relative z-10">
                            <Input
                                label="Title"
                                placeholder="e.g. New Mock Test Live!"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="border-2 border-black/10 focus:border-black font-bold"
                            />

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest mb-2 opacity-60">Message Content</label>
                                <textarea
                                    className="w-full p-4 rounded-xl bg-gray-50 border-2 border-black/10 focus:border-black focus:outline-none font-medium min-h-[120px] resize-none transition-colors"
                                    placeholder="Enter notification message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest mb-2 opacity-60">Urgency Level</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['info', 'success', 'alert'] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 transition-all
                                                ${type === t
                                                    ? 'bg-black text-white border-black transform -translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]'
                                                    : 'bg-white text-black/40 border-black/10 hover:border-black hover:text-black'
                                                }
                                            `}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleSend}
                                className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all mt-4"
                            >
                                Broadcast Now 🚀
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* History Side */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-60 mb-4">Broadcast History</h3>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center p-12 border-4 border-dashed border-black/10 rounded-3xl">
                                <p className="text-gray-400 font-bold uppercase text-xs">No notifications sent yet.</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <Card
                                    key={notif.id}
                                    className={`p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                                        ${notif.type === 'alert' ? 'bg-red-50' : notif.type === 'success' ? 'bg-green-50' : 'bg-blue-50'}
                                    `}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h4 className="font-black text-lg leading-tight mb-1">{notif.title}</h4>
                                            <p className="text-gray-600 text-sm font-medium">{notif.message}</p>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-gray-400 whitespace-nowrap">
                                            {new Date(notif.createdAt * 1000).toLocaleDateString()}
                                        </span>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
