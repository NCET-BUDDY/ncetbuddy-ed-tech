"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, updateUser } from '@/lib/pocketbase-db';
import { UserProfile } from '@/types';
import {
    User,
    Lock,
    Bell,
    Palette,
    Shield,
    Smartphone,
    LogOut,
    Camera,
    ChevronRight,
    Check
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";

type SettingSection = 'profile' | 'security' | 'notifications' | 'appearance';

export default function SettingsPage() {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const [activeSection, setActiveSection] = useState<SettingSection>('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [displayName, setDisplayName] = useState("");
    const [stream, setStream] = useState("Science");

    useEffect(() => {
        const fetchProfile = async () => {
            if (user?.$id) {
                const data = await getUserProfile(user.$id);
                if (data) {
                    setProfile(data);
                    setDisplayName(data.displayName || user.name || "");
                    setStream(data.stream || "Science");
                } else if (user.name) {
                    setDisplayName(user.name);
                }
            }
        };
        fetchProfile();
    }, [user]);

    const sidebarItems = [
        { id: 'profile', label: 'My Profile', icon: <User size={20} /> },
        { id: 'security', label: 'Security', icon: <Lock size={20} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
        { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
    ];

    const handleSave = async () => {
        if (!user?.$id) return;
        setIsSaving(true);
        try {
            const result = await updateUser(user.$id, {
                displayName: displayName,
                stream: stream
            });
            if (result.success) {
                alert("Profile updated successfully!");
                // Refresh profile data
                const updated = await getUserProfile(user.$id);
                if (updated) setProfile(updated);
            } else {
                throw new Error(result.error || "Update unsuccessful");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-10">
                <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">Account Settings</h1>
                <p className="text-secondary font-medium">Manage your profile, security, and personalize your experience.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Settings Sidebar */}
                <div className="lg:col-span-3">
                    <div className="bg-card border border-border rounded-3xl p-3 shadow-sm sticky top-28">
                        <nav className="space-y-1">
                            {sidebarItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id as SettingSection)}
                                    className={`
                                        w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300
                                        ${activeSection === item.id
                                            ? "bg-primary text-white font-bold shadow-lg shadow-primary/20"
                                            : "text-secondary hover:text-foreground hover:bg-background"
                                        }
                                    `}
                                >
                                    {item.icon}
                                    <span className="text-sm tracking-tight">{item.label}</span>
                                </button>
                            ))}
                        </nav>

                        <div className="mt-6 pt-6 border-t border-border">
                            <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-primary/80 hover:bg-primary/10 transition-all font-bold">
                                <LogOut size={20} />
                                <span className="text-sm tracking-tight">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-9">
                    <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-sm min-h-[600px]">

                        {activeSection === 'profile' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-black text-foreground mb-6">General Profile</h2>

                                    <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                                        <div className="relative group">
                                            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-border shadow-xl group-hover:scale-105 transition-transform duration-500 relative">
                                                <Image src="/student.png" alt="Profile" fill className="object-cover" />
                                            </div>
                                            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white shadow-lg border border-border rounded-full flex items-center justify-center text-slate-600 hover:text-primary transition-colors">
                                                <Camera size={18} />
                                            </button>
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h3 className="text-xl font-bold text-foreground mb-1">{displayName || user?.name || "Student"}</h3>
                                            <p className="text-secondary text-sm mb-4">{stream} Stream • NCET Aspirant</p>
                                            <button className="px-5 py-2.5 bg-foreground text-background rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-black/10">
                                                Change Avatar
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-secondary/40 uppercase tracking-widest ml-1">Full Name</label>
                                            <input
                                                type="text"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                className="w-full bg-background border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-secondary/40 uppercase tracking-widest ml-1">Email Address</label>
                                            <input
                                                type="email"
                                                defaultValue={user?.email || "arjun@example.com"}
                                                className="w-full bg-background border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-secondary/40 uppercase tracking-widest ml-1">Academic Stream</label>
                                            <select 
                                                value={stream}
                                                onChange={(e) => setStream(e.target.value)}
                                                className="w-full bg-background border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold appearance-none"
                                            >
                                                <option value="Science">Science</option>
                                                <option value="Commerce">Commerce</option>
                                                <option value="Arts/Humanities">Arts/Humanities</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-secondary/40 uppercase tracking-widest ml-1">Target Exam Year</label>
                                            <select className="w-full bg-background border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold appearance-none">
                                                <option>2025</option>
                                                <option>2026</option>
                                                <option>2027</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-xl shadow-rose-500/20 flex items-center gap-3"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check size={18} />
                                                <span>Save Changes</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeSection === 'security' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-black text-foreground mb-2">Account Security</h2>
                                    <p className="text-secondary text-sm mb-8">Secure your account with a strong password and two-factor authentication.</p>

                                    <div className="space-y-6">
                                        <div className="p-6 bg-background rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-background/50 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-secondary/40 group-hover:text-primary transition-colors shadow-sm">
                                                    <Shield size={22} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-foreground">Change Password</h4>
                                                    <p className="text-secondary text-xs">Update your account password regularly</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-300" size={20} />
                                        </div>

                                        <div className="p-6 bg-background rounded-3xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-secondary/40 shadow-sm">
                                                    <Smartphone size={22} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-foreground">Two-Factor Authentication</h4>
                                                    <p className="text-secondary text-xs text-primary font-bold">Recommended for better security</p>
                                                </div>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'notifications' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-black text-foreground mb-2">Notification Preferences</h2>
                                    <p className="text-secondary text-sm mb-8">Control which notifications you receive and where.</p>

                                    <div className="space-y-4">
                                        {[
                                            { title: "Test Series Updates", desc: "Get notified when new mock tests are released" },
                                            { title: "Mentor Messages", desc: "Alerts for new messages from your personal mentor" },
                                            { title: "Forum Replies", desc: "Notifications for replies to your discussion posts" },
                                            { title: "Daily Reminders", desc: "Smart planner reminders to keep you on track" }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between py-4 border-b border-border last:border-0">
                                                <div>
                                                    <h4 className="font-bold text-foreground">{item.title}</h4>
                                                    <p className="text-secondary text-xs">{item.desc}</p>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'appearance' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-black text-foreground mb-2">Display & Appearance</h2>
                                    <p className="text-secondary text-sm mb-8">Customize how NCETBuddy looks on your device.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div 
                                            onClick={() => setTheme('light')}
                                            className={`border-2 p-4 rounded-3xl cursor-pointer transition-all ${theme === 'light' ? 'border-primary shadow-lg shadow-primary/10' : 'border-border bg-white hover:border-slate-300'}`}
                                        >
                                            <div className="aspect-video bg-background rounded-xl mb-4 border border-border" />
                                            <span className={`font-bold text-sm block text-center ${theme === 'light' ? 'text-primary' : 'text-slate-600'}`}>Light Mode</span>
                                        </div>
                                        <div 
                                            onClick={() => setTheme('dark')}
                                            className={`border-2 p-4 rounded-3xl cursor-pointer transition-all ${theme === 'dark' ? 'border-primary bg-slate-900 shadow-lg shadow-primary/10' : 'border-border bg-slate-900 hover:border-slate-700'}`}
                                        >
                                            <div className="aspect-video bg-slate-800 rounded-xl mb-4" />
                                            <span className={`font-bold text-sm block text-center ${theme === 'dark' ? 'text-primary' : 'text-white'}`}>Dark Mode</span>
                                        </div>
                                        <div 
                                            onClick={() => setTheme('system')}
                                            className={`border-2 p-4 rounded-3xl cursor-pointer transition-all ${theme === 'system' ? 'border-primary shadow-lg shadow-primary/10' : 'border-border bg-background/50 hover:border-slate-300'}`}
                                        >
                                            <div className="aspect-video bg-gradient-to-br from-slate-50 to-slate-200 rounded-xl mb-4" />
                                            <span className={`font-bold text-sm block text-center ${theme === 'system' ? 'text-primary' : 'text-slate-600'}`}>System Default</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
