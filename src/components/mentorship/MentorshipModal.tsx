"use client";

import React, { useState } from 'react';
import { updateUser } from '@/lib/pocketbase-db';
import { UserProfile } from '@/types';

interface MentorshipModalProps {
    userProfile: UserProfile;
    onClose: () => void;
    onUpdate: (updatedProfile: UserProfile) => void;
}

export default function MentorshipModal({ userProfile, onClose, onUpdate }: MentorshipModalProps) {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation for 10-digit Indian phone number
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            setError('Please enter a valid 10-digit WhatsApp number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // First, try to ensure the phoneNumber attribute exists in the schema
            try {
                await fetch('/api/admin/setup-phone-attribute', { method: 'POST' });
            } catch (setupErr) {
                // Ignore setup errors, we'll handle the main save below
            }

            // Wait a moment for the attribute to be processed
            await new Promise(resolve => setTimeout(resolve, 2000));

            const result = await updateUser(userProfile.uid, { phoneNumber: cleanPhone });
            if (result.success) {
                onUpdate({ ...userProfile, phoneNumber: cleanPhone });
                onClose();
            } else {
                console.warn("DB save failed, saving locally:", result.error);
                // Fallback: save to localStorage so modal doesn't keep showing
                localStorage.setItem(`mentorship_phone_${userProfile.uid}`, cleanPhone);
                onUpdate({ ...userProfile, phoneNumber: cleanPhone });
                onClose();
            }
        } catch (err: any) {
            console.error("Failed to update phone number:", err);
            // Still save locally as fallback
            localStorage.setItem(`mentorship_phone_${userProfile.uid}`, cleanPhone);
            onUpdate({ ...userProfile, phoneNumber: cleanPhone });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-500">
                {/* Decoration */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 blur-3xl rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 blur-3xl rounded-full" />

                <div className="relative p-8 md:p-10 text-center">
                    {/* VIP Badge */}
                    <div className="inline-flex items-center px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider text-amber-200 uppercase bg-amber-500/20 border border-amber-500/30 rounded-full">
                        ✨ VIP Mentorship Access
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-4">
                        Want to get into your <span className="text-amber-400">Dream College?</span>
                    </h2>
                    
                    <p className="text-white/70 mb-8 text-sm leading-relaxed">
                        Lacking in guidance? Confused about what to study or skip? Join our VIP mentorship for a structured path to your goal.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4 text-left">
                        <div>
                            <label htmlFor="phone" className="block text-xs font-medium text-white/50 mb-2 ml-4">
                                WhatsApp Number
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-medium">
                                    +91
                                </span>
                                <input
                                    id="phone"
                                    type="tel"
                                    required
                                    placeholder="Enter 10 digit number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                                    maxLength={10}
                                />
                            </div>
                            {error && (
                                <p className="text-red-400 text-xs mt-2 ml-4 animate-pulse">
                                    {error}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-400 group-hover:scale-105 transition-transform duration-500 rounded-2xl" />
                            <div className="relative flex items-center justify-center py-4 text-white font-bold tracking-wide">
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "YES, I WANT MENTORSHIP"
                                )}
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-3 text-white/40 text-xs font-medium hover:text-white/60 transition-colors"
                        >
                            I'll do this later
                        </button>
                    </form>

                    <div className="mt-8 flex items-center justify-center gap-6 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                        <span>Direct Guidance</span>
                        <div className="w-1 h-1 bg-white/10 rounded-full" />
                        <span>VIP Group</span>
                        <div className="w-1 h-1 bg-white/10 rounded-full" />
                        <span>Daily Tips</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
