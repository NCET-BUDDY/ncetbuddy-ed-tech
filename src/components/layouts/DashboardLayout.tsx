"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Home, PlayCircle, Radio, PenLine, CalendarDays, BarChart2,
    Trophy, MessageCircle, UserCircle, Menu, X, Search, Bell, Settings, LogOut, BookOpen, MessageSquare
} from "lucide-react";
import Image from "next/image";
import NotificationBell from "@/components/dashboard/NotificationBell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-background text-foreground">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-secondary animate-pulse">Loading experience...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: <Home size={20} /> },
        { href: "/dashboard/pyqs", label: "PYQs", icon: <PenLine size={20} /> },
        { href: "/dashboard/tests", label: "Mock Tests", icon: <PlayCircle size={20} /> },
        { href: "/dashboard/notes", label: "Resources", icon: <BookOpen size={20} /> },
        { href: "/dashboard/forum", label: "Forum", icon: <MessageSquare size={20} /> },
    ];

    const bottomItems = [
        { href: "/dashboard/settings", label: "Settings", icon: <Settings size={20} /> },
        { href: "/logout", label: "Logout", icon: <LogOut size={20} /> },
    ];

    const isAttemptPage = pathname === "/dashboard/tests/attempt";

    if (isAttemptPage) {
        return <div className="min-h-screen bg-background">{children}</div>;
    }

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex w-64 flex-col bg-[#0F172A] text-white h-screen sticky top-0 z-40">
                <div className="p-8">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                            <Image src="/logo.png" alt="Logo" width={40} height={40} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-2xl font-black tracking-tighter text-white">
                            NCET<span className="text-rose-500">Buddy</span>
                        </div>
                    </Link>
                    <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-2 ml-1">Student Portal</div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group
                                    ${isActive
                                        ? "bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                    }
                                `}
                            >
                                <span className={`${isActive ? "text-white" : "text-slate-500 group-hover:text-white-400"} transition-colors`}>
                                    {item.icon}
                                </span>
                                <span className="text-sm tracking-tight">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/5 space-y-2">
                    {bottomItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            {item.icon}
                            <span className="text-sm">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Desktop Top Header */}
                <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-20 flex items-center px-4 md:px-8 justify-between shrink-0">
                    <div className="flex-1 max-w-2xl hidden md:block">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search tests, resources, or topics..."
                                className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-rose-500/20 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Mobile Logo (Visible on mobile only) */}
                    <div className="md:hidden flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-rose-500 flex items-center justify-center">
                            <Image src="/logo.png" alt="Logo" width={32} height={32} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        <NotificationBell />

                        <div className="h-10 w-[1px] bg-slate-200 hidden md:block" />

                        <div className="flex items-center gap-3 pl-4 cursor-pointer group">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-black text-slate-900 group-hover:text-rose-500 transition-colors">{user.name || "Arjun Mehta"}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Science Stream</div>
                            </div>
                            <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-white shadow-md ring-1 ring-slate-100 group-hover:scale-105 transition-transform">
                                <Image src="/student.png" alt="User" width={44} height={44} className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="md:hidden sticky bottom-0 z-50 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 transition-colors ${isActive ? "text-rose-500" : "text-slate-400"}`}
                            >
                                {item.icon}
                                <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
