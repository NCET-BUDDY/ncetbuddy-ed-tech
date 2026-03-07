"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Copy, IndianRupee, TrendingUp, Users, AlertCircle, CheckCircle2, Link as LinkIcon } from "lucide-react";
import { databases, isAppwriteConfigured } from "@/lib/appwrite-student";
import { Query, ID } from "appwrite";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'ncet-buddy-db';

interface Earning {
    $id: string;
    amount: number;
    status: string;
    purchaseId: string;
    createdAt: string;
}

interface Withdrawal {
    $id: string;
    amount: number;
    upiId: string;
    status: string;
    createdAt: string;
}

export default function AffiliateDashboard() {
    const { user, loading } = useAuth();
    const [copied, setCopied] = useState(false);
    const [earnings, setEarnings] = useState<Earning[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [withdrawalUpi, setWithdrawalUpi] = useState("");
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawalMessage, setWithdrawalMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        if (!user || !isAppwriteConfigured()) return;

        const fetchData = async () => {
            try {
                // Fetch earnings
                const earningsRes = await databases.listDocuments(DB_ID, 'affiliate_earnings', [
                    Query.equal('affiliateId', user.$id),
                    Query.orderDesc('createdAt')
                ]);

                // Fetch withdrawals
                const withdrawalRes = await databases.listDocuments(DB_ID, 'withdrawal_requests', [
                    Query.equal('userId', user.$id),
                    Query.orderDesc('createdAt')
                ]);

                setEarnings(earningsRes.documents as unknown as Earning[]);
                setWithdrawals(withdrawalRes.documents as unknown as Withdrawal[]);
            } catch (error) {
                console.error("Error fetching affiliate data:", error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading || isLoadingData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500"></div>
            </div>
        );
    }

    if (!user) return null;

    const affiliateLink = typeof window !== "undefined" ? `${window.location.origin}/?ref=${user.$id}` : "";

    const totalEarned = earnings.reduce((sum, item) => sum + item.amount, 0);
    const totalPending = earnings.filter(e => e.status === 'pending').reduce((sum, item) => sum + item.amount, 0);
    const totalWithdrawn = withdrawals.filter(w => w.status === 'completed').reduce((sum, item) => sum + item.amount, 0);
    const pendingWithdrawalValue = withdrawals.filter(w => w.status === 'pending').reduce((sum, item) => sum + item.amount, 0);

    const availableBalance = totalEarned - totalWithdrawn - pendingWithdrawalValue;

    const handleCopy = () => {
        navigator.clipboard.writeText(affiliateLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();

        if (availableBalance < 100) {
            setWithdrawalMessage({ type: "error", text: "Minimum withdrawal amount is ₹100" });
            return;
        }

        if (!withdrawalUpi.includes('@')) {
            setWithdrawalMessage({ type: "error", text: "Please enter a valid UPI ID" });
            return;
        }

        setIsWithdrawing(true);
        setWithdrawalMessage({ type: "", text: "" });

        try {
            const newWithdrawal = await databases.createDocument(DB_ID, 'withdrawal_requests', ID.unique(), {
                userId: user.$id,
                amount: availableBalance,
                upiId: withdrawalUpi,
                status: 'pending',
                createdAt: Math.floor(Date.now() / 1000)
            });

            setWithdrawals([newWithdrawal as unknown as Withdrawal, ...withdrawals]);
            setWithdrawalMessage({ type: "success", text: "Withdrawal request submitted successfully!" });
            setWithdrawalUpi("");
        } catch (error) {
            console.error("Withdrawal error:", error);
            setWithdrawalMessage({ type: "error", text: "Failed to submit withdrawal request." });
        } finally {
            setIsWithdrawing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Refer & Earn</h1>
                <p className="text-slate-500 mt-2">Share your link and earn 25% commission on every test sale!</p>
            </div>

            {/* Link Generation Section */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-rose-500/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-100/40 to-orange-100/40 blur-3xl rounded-full -mr-20 -mt-20 z-0 transition-transform duration-700 group-hover:scale-110"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 w-full space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <LinkIcon className="text-rose-500" size={20} />
                            Your Unique Referral Link
                        </h3>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 pl-4 w-full group/input hover:border-rose-200 transition-colors">
                            <input
                                type="text"
                                readOnly
                                value={affiliateLink}
                                className="w-full bg-transparent outline-none text-slate-600 font-medium text-sm sm:text-base truncate"
                            />
                            <button
                                onClick={handleCopy}
                                className={`shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${copied ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20 hover:shadow-lg'}`}
                            >
                                {copied ? <><CheckCircle2 size={18} /> Copied!</> : <><Copy size={18} /> Copy Link</>}
                            </button>
                        </div>
                    </div>

                    <div className="hidden md:block w-px h-24 bg-slate-100"></div>

                    <div className="w-full md:w-auto bg-rose-50 rounded-2xl p-6 text-center border border-rose-100 shrink-0">
                        <div className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-1">Commission</div>
                        <div className="text-4xl font-black text-rose-900 flex items-center justify-center gap-1">
                            25%
                        </div>
                        <div className="text-xs text-rose-500/80 font-medium mt-1">per successful sale</div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Earned", value: totalEarned, icon: <TrendingUp className="text-emerald-500" size={24} />, bg: "bg-emerald-50", border: "border-emerald-100" },
                    { label: "Available Balance", value: availableBalance, icon: <IndianRupee className="text-blue-500" size={24} />, bg: "bg-blue-50", border: "border-blue-100" },
                    { label: "Total Referrals", value: earnings.length, icon: <Users className="text-purple-500" size={24} />, bg: "bg-purple-50", border: "border-purple-100", prefix: false }
                ].map((stat, i) => (
                    <div key={i} className={`bg-white rounded-3xl p-6 border shadow-sm ${stat.border}`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg}`}>{stat.icon}</div>
                            <h4 className="font-bold text-slate-600">{stat.label}</h4>
                        </div>
                        <div className="text-4xl font-black text-slate-900 flex items-baseline gap-1">
                            {stat.prefix !== false && <IndianRupee size={24} className="text-slate-400" />}
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Withdraw Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm lg:col-span-1">
                    <h3 className="text-xl font-bold mb-6">Request Withdrawal</h3>

                    <form onSubmit={handleWithdraw} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Amount Available</label>
                            <div className="text-2xl font-black text-slate-900 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-2">
                                <IndianRupee size={24} className="text-rose-500" />
                                {availableBalance}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">UPI ID</label>
                            <input
                                type="text"
                                placeholder="example@upi"
                                required
                                value={withdrawalUpi}
                                onChange={(e) => setWithdrawalUpi(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                            />
                        </div>

                        {withdrawalMessage.text && (
                            <div className={`p-4 rounded-xl flex items-center gap-2 text-sm font-medium ${withdrawalMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {withdrawalMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                                {withdrawalMessage.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isWithdrawing || availableBalance < 100}
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl p-4 font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                        >
                            {isWithdrawing ? "Processing..." : "Withdraw Funds"}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm lg:col-span-2">
                    <h3 className="text-xl font-bold mb-6">Recent Activity</h3>

                    {earnings.length === 0 && withdrawals.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Users size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="font-medium">No affiliate activity yet.</p>
                            <p className="text-sm mt-1">Share your link to start earning!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {[...earnings, ...withdrawals]
                                .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
                                .slice(0, 5)
                                .map((item, i) => {
                                    const isWithdrawal = 'upiId' in item;

                                    return (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isWithdrawal ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                    {isWithdrawal ? <TrendingUp size={20} /> : <Users size={20} />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">
                                                        {isWithdrawal ? 'Withdrawal Request' : 'Referral Sale'}
                                                    </div>
                                                    <div className="text-sm text-slate-500">
                                                        {new Date(parseInt((item.createdAt || '0').toString()) * 1000 || Date.now()).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-black flex items-center justify-end gap-1 ${isWithdrawal ? 'text-slate-900' : 'text-emerald-500'}`}>
                                                    <IndianRupee size={16} />
                                                    {item.amount}
                                                </div>
                                                <div className={`text-xs font-bold uppercase tracking-wider mt-1 px-2 py-1 rounded inline-block ${item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    item.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {item.status}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
