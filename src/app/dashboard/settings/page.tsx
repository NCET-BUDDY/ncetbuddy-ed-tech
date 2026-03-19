"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, updateUser } from '@/lib/appwrite-db';
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

type SettingSection = 'profile' | 'security' | 'notifications' | 'appearance';

export default function SettingsPage() {
    const { user } = useAuth();
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
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Account Settings</h1>
                <p className="text-slate-500 font-medium">Manage your profile, security, and personalize your experience.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Settings Sidebar */}
                <div className="lg:col-span-3">
                    <div className="bg-white border border-slate-100 rounded-3xl p-3 shadow-sm sticky top-28">
                        <nav className="space-y-1">
                            {sidebarItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id as SettingSection)}
                                    className={`
                                        w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300
                                        ${activeSection === item.id
                                            ? "bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20"
                                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                        }
                                    `}
                                >
                                    {item.icon}
                                    <span className="text-sm tracking-tight">{item.label}</span>
                                </button>
                            ))}
                        </nav>

                        <div className="mt-6 pt-6 border-t border-slate-50">
                            <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-600 hover:bg-rose-50 transition-all font-bold">
                                <LogOut size={20} />
                                <span className="text-sm tracking-tight">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-9">
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm min-h-[600px]">

                        {activeSection === 'profile' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-6">General Profile</h2>

                                    <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                                        <div className="relative group">
                                            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-xl group-hover:scale-105 transition-transform duration-500 relative">
                                                <Image src="/student.png" alt="Profile" fill className="object-cover" />
                                            </div>
                                            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white shadow-lg border border-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:text-rose-500 transition-colors">
                                                <Camera size={18} />
                                            </button>
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h3 className="text-xl font-bold text-slate-900 mb-1">{displayName || user?.name || "Student"}</h3>
                                            <p className="text-slate-500 text-sm mb-4">{stream} Stream • NCET Aspirant</p>
                                            <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                                                Change Avatar
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                            <input
                                                type="text"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-rose-500/20 transition-all outline-none font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                            <input
                                                type="email"
                                                defaultValue={user?.email || "arjun@example.com"}
                                                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-rose-500/20 transition-all outline-none font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Academic Stream</label>
                                            <select 
                                                value={stream}
                                                onChange={(e) => setStream(e.target.value)}
                                                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-rose-500/20 transition-all outline-none font-bold appearance-none"
                                            >
                                                <option value="Science">Science</option>
                                                <option value="Commerce">Commerce</option>
                                                <option value="Arts/Humanities">Arts/Humanities</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Target Exam Year</label>
                                            <select className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-rose-500/20 transition-all outline-none font-bold appearance-none">
                                                <option>2025</option>
                                                <option>2026</option>
                                                <option>2027</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-50 flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 flex items-center gap-3"
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
                                    <h2 className="text-2xl font-black text-slate-900 mb-2">Account Security</h2>
                                    <p className="text-slate-500 text-sm mb-8">Secure your account with a strong password and two-factor authentication.</p>

                                    <div className="space-y-6">
                                        <div className="p-6 bg-slate-50 rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-slate-100 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-rose-500 transition-colors shadow-sm">
                                                    <Shield size={22} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">Change Password</h4>
                                                    <p className="text-slate-500 text-xs">Update your account password regularly</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-300" size={20} />
                                        </div>

                                        <div className="p-6 bg-slate-50 rounded-3xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                                                    <Smartphone size={22} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">Two-Factor Authentication</h4>
                                                    <p className="text-slate-500 text-xs text-rose-500 font-bold">Recommended for better security</p>
                                                </div>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'notifications' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-2">Notification Preferences</h2>
                                    <p className="text-slate-500 text-sm mb-8">Control which notifications you receive and where.</p>

                                    <div className="space-y-4">
                                        {[
                                            { title: "Test Series Updates", desc: "Get notified when new mock tests are released" },
                                            { title: "Mentor Messages", desc: "Alerts for new messages from your personal mentor" },
                                            { title: "Forum Replies", desc: "Notifications for replies to your discussion posts" },
                                            { title: "Daily Reminders", desc: "Smart planner reminders to keep you on track" }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                                                    <p className="text-slate-500 text-xs">{item.desc}</p>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
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
                                    <h2 className="text-2xl font-black text-slate-900 mb-2">Display & Appearance</h2>
                                    <p className="text-slate-500 text-sm mb-8">Customize how NCETBuddy looks on your device.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="border-2 border-rose-500 bg-white p-4 rounded-3xl cursor-pointer">
                                            <div className="aspect-video bg-slate-50 rounded-xl mb-4 border border-slate-100" />
                                            <span className="font-bold text-sm block text-center">Light Mode</span>
                                        </div>
                                        <div className="border-2 border-slate-100 bg-slate-900 p-4 rounded-3xl cursor-pointer">
                                            <div className="aspect-video bg-slate-800 rounded-xl mb-4" />
                                            <span className="font-bold text-sm block text-center text-white">Dark Mode</span>
                                        </div>
                                        <div className="border-2 border-slate-100 bg-slate-100 p-4 rounded-3xl cursor-pointer">
                                            <div className="aspect-video bg-gradient-to-br from-slate-50 to-slate-200 rounded-xl mb-4" />
                                            <span className="font-bold text-sm block text-center">System Default</span>
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
