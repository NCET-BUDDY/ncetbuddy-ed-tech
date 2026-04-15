import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { getNotifications, getDailyProgress, updateStreakAndDaily, setUserDailyGoal } from "@/lib/pocketbase-db";
import { Notification } from "@/types";
import { UserCircle, Flame, PartyPopper, Bell, BellOff, AlertTriangle, Info } from "lucide-react";

export default function Header() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [streakData, setStreakData] = useState({ streak: 0, dailyProgress: 0, dailyGoalTarget: 5 });
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Helper to get read IDs from local storage
    const getReadNotificationIds = (): string[] => {
        try {
            const stored = localStorage.getItem('read_notifications');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    };

    useEffect(() => {
        const fetchNotifications = async () => {
            const allNotifications = await getNotifications();
            const readIds = getReadNotificationIds();

            // Filter out read notifications locally since we don't have a backend 'read' status
            // per user on specific notification documents
            const unread = allNotifications.filter(n => n.id && !readIds.includes(n.id));

            setNotifications(unread);
            setUnreadCount(unread.length);
        };
        fetchNotifications();
    }, []);

    useEffect(() => {
        const fetchStreak = async () => {
            if (!user?.$id) return;
            try {
                await updateStreakAndDaily(user.$id);
                const data = await getDailyProgress(user.$id);
                if (data) {
                    setStreakData({
                        streak: data.streak,
                        dailyProgress: data.dailyProgress,
                        dailyGoalTarget: data.dailyGoalTarget
                    });
                }
            } catch (e) {
                console.error("Streak fetch error", e);
            }
        };
        if (user) fetchStreak();
    }, [user]);

    const handleMarkAllAsRead = () => {
        if (notifications.length === 0) return;

        const readIds = getReadNotificationIds();
        const newReadIds = notifications
            .map(n => n.id)
            .filter((id): id is string => !!id); // Ensure string IDs

        const updatedReadIds = [...readIds, ...newReadIds];

        localStorage.setItem('read_notifications', JSON.stringify(updatedReadIds));

        setNotifications([]); // Clear list
        setUnreadCount(0); // Reset count
        setIsNotificationsOpen(false); // Close dropdown
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleUpdateGoal = async (newTarget: number) => {
        if (!user?.$id) return;
        try {
            if (newTarget < 1) newTarget = 1;
            setStreakData(prev => ({ ...prev, dailyGoalTarget: newTarget })); // UI Optimistic Update
            await setUserDailyGoal(user.$id, newTarget, `Solve ${newTarget} Questions`);
            setIsEditingGoal(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex flex-row items-center justify-between gap-4 mb-6 md:mb-8 relative z-30">
            <div className="flex items-center gap-3 md:gap-4">
                <Link href="/dashboard/profile" className="relative group">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary p-[2px] shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                        <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center border border-white/20">
                            <UserCircle size={28} className="text-primary" />
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 border-2 border-card rounded-full shadow-sm"></div>
                </Link>
                <div>
                    <h2 className="text-base md:text-lg font-bold text-foreground leading-tight">
                        Welcome back, {user?.name?.split(' ')[0] || "Student"}!
                    </h2>
                    <p className="text-xs md:text-sm text-secondary font-medium hidden sm:block">Let's continue your learning journey.</p>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
                {/* Streak Widget */}
                <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white font-black transform hover:scale-105 transition-transform cursor-pointer group relative">
                    <Flame size={20} className="animate-pulse group-hover:scale-125 transition-transform" />
                    <span className="text-sm md:text-base">{streakData.streak}</span>

                    {/* Hover Tooltip for Daily Goal */}
                    <div className="absolute top-full right-0 mt-4 w-48 bg-white border-2 border-black rounded-xl p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50 invisible group-hover:visible translate-y-2 group-hover:translate-y-0 duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-left text-black">
                                Daily Goal
                            </h4>
                            {!isEditingGoal ? (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditingGoal(true);
                                    }}
                                    className="text-[10px] text-blue-500 hover:text-blue-700 font-bold uppercase transition-colors"
                                >
                                    Edit
                                </button>
                            ) : (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditingGoal(false);
                                    }}
                                    className="text-[10px] text-gray-400 hover:text-gray-600 font-bold uppercase transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                        {isEditingGoal ? (
                            <div className="mb-2">
                                <label className="text-[10px] font-bold text-gray-500 block mb-1">Target Questions:</label>
                                <input
                                    type="number"
                                    className="w-full border-2 border-black rounded px-2 py-1 text-xs font-bold text-black"
                                    defaultValue={streakData.dailyGoalTarget}
                                    onBlur={(e) => handleUpdateGoal(Number(e.target.value))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateGoal(Number(e.currentTarget.value))}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between text-xs font-bold mb-1 text-black">
                                    <span>Progress</span>
                                    <span>{streakData.dailyProgress}/{streakData.dailyGoalTarget}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden border border-black/10">
                                    <div
                                        className="h-full bg-orange-500 transition-all duration-500"
                                        style={{ width: `${Math.min(100, (streakData.dailyProgress / streakData.dailyGoalTarget) * 100)}%` }}
                                    ></div>
                                </div>
                                {streakData.dailyProgress >= streakData.dailyGoalTarget ? (
                                    <p className="text-[10px] font-bold text-green-600 mt-2 text-center uppercase animate-pulse flex items-center justify-center gap-1"><PartyPopper size={12} /> Goal Reached!</p>
                                ) : (
                                    <p className="text-[10px] font-bold text-gray-400 mt-2 text-center">Keep going!</p>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Notification Bell */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl bg-white border border-border hover:bg-black/5 hover:border-black transition-all relative group shadow-sm active:scale-95"
                    >
                        <Bell size={22} className="group-hover:scale-110 transition-transform" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[10px] md:text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotificationsOpen && (
                        <div className="absolute left-0 md:left-auto md:right-0 top-full mt-3 w-[85vw] sm:w-80 md:w-96 bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                            <div className="p-4 bg-primary border-b-4 border-black flex justify-between items-center">
                                <h3 className="font-black text-black uppercase tracking-wider italic text-sm md:text-base">Notifications</h3>
                                <span className="text-[10px] md:text-xs font-bold text-black bg-white/20 px-2 py-1 rounded-lg border-2 border-black/10">{unreadCount} New</span>
                            </div>
                            <div className="max-h-[60vh] md:max-h-[300px] overflow-y-auto p-2 space-y-2 bg-white scrollbar-thin scrollbar-thumb-black scrollbar-track-transparent">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 font-bold italic">
                                        No new notifications
                                        <div className="flex justify-center mt-2"><BellOff size={28} /></div>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className="p-3 md:p-4 rounded-xl border-2 border-black/5 hover:border-black hover:bg-primary/5 transition-all group cursor-pointer relative">
                                            <div className="flex gap-3">
                                                <div className={`
                                                    w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                                    ${notif.type === 'alert' ? 'bg-red-400' : notif.type === 'success' ? 'bg-green-400' : 'bg-blue-400'}
                                                `}>
                                                    {notif.type === 'alert' ? <AlertTriangle size={16} /> : notif.type === 'success' ? <PartyPopper size={16} /> : <Info size={16} />}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-sm text-black group-hover:text-primary-dark transition-colors">{notif.title}</h4>
                                                    <p className="text-xs text-black/60 font-medium mt-1 leading-snug">{notif.message}</p>
                                                    <span className="text-[10px] text-black/40 font-bold uppercase tracking-widest mt-2 block">
                                                        {new Date(notif.createdAt * 1000).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <div className="p-3 bg-gray-50 border-t-2 border-black text-center">
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs font-black uppercase tracking-widest text-black hover:text-primary transition-colors underline decoration-2 underline-offset-2"
                                    >
                                        Mark all as read
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <Link href="/dashboard/live-classes" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border hover:bg-black/5 transition-colors cursor-pointer group whitespace-nowrap shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-sm font-bold text-secondary group-hover:text-foreground">Live Classes</span>
                </Link>


            </div>
        </div>
    );
}
