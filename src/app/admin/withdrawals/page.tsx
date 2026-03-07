"use client";

import { useState, useEffect } from "react";
import { Copy, Navigation, CheckCircle, Clock } from "lucide-react";

interface Withdrawal {
    $id: string;
    userId: string;
    amount: number;
    upiId: string;
    status: string;
    createdAt: string;
}

export default function AdminWithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchWithdrawals = async () => {
        try {
            const res = await fetch('/api/admin/withdrawals');
            if (res.ok) {
                const data = await res.json();
                setWithdrawals(data);
            }
        } catch (error) {
            console.error("Failed to fetch withdrawals:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const handleMarkPaid = async (id: string, amount: number, upiId: string) => {
        if (!confirm(`Are you sure you want to mark ₹${amount} for ${upiId} as PAID? Make sure you have actually transferred the money via your UPI app first.`)) return;

        setProcessingId(id);
        try {
            const res = await fetch('/api/admin/withdrawals', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'completed' })
            });

            if (res.ok) {
                setWithdrawals(prev => prev.map(w => w.$id === id ? { ...w, status: 'completed' } : w));
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Failed to update:", error);
            alert("An error occurred");
        } finally {
            setProcessingId(null);
        }
    };

    const copyUpi = (upi: string) => {
        navigator.clipboard.writeText(upi);
        alert("UPI ID copied to clipboard!");
    };

    if (loading) {
        return <div className="text-white p-8">Loading withdrawals...</div>;
    }

    const pending = withdrawals.filter(w => w.status === 'pending');
    const completed = withdrawals.filter(w => w.status === 'completed');

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Affiliate Withdrawals</h1>
                <p className="text-slate-400 mt-2">Manage and pay out affiliate commissions from here.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1A1F2C] border border-[#2A3142] rounded-3xl p-6">
                    <div className="text-sm font-bold text-orange-500 uppercase tracking-wider mb-2">Pending Payouts</div>
                    <div className="text-4xl font-black text-white">
                        ₹ {pending.reduce((sum, w) => sum + w.amount, 0)}
                    </div>
                    <div className="text-slate-400 mt-1 text-sm">{pending.length} requests waiting</div>
                </div>
                <div className="bg-[#1A1F2C] border border-[#2A3142] rounded-3xl p-6">
                    <div className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-2">Total Paid Out</div>
                    <div className="text-4xl font-black text-white">
                        ₹ {completed.reduce((sum, w) => sum + w.amount, 0)}
                    </div>
                    <div className="text-slate-400 mt-1 text-sm">To {completed.length} affiliates</div>
                </div>
            </div>

            <div className="bg-[#1A1F2C] border border-[#2A3142] rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-[#2A3142] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Withdrawal Requests</h2>
                    <button onClick={fetchWithdrawals} className="text-sm bg-[#2A3142] hover:bg-[#363f54] text-white px-4 py-2 rounded-xl transition-colors">
                        Refresh
                    </button>
                </div>

                {withdrawals.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 font-medium">No withdrawal requests found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#0f1420] text-slate-400 text-sm">
                                    <th className="p-4 font-bold border-b border-[#2A3142]">Date</th>
                                    <th className="p-4 font-bold border-b border-[#2A3142]">User ID</th>
                                    <th className="p-4 font-bold border-b border-[#2A3142]">UPI ID</th>
                                    <th className="p-4 font-bold border-b border-[#2A3142]">Amount</th>
                                    <th className="p-4 font-bold border-b border-[#2A3142]">Status</th>
                                    <th className="p-4 font-bold border-b border-[#2A3142] text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2A3142]">
                                {withdrawals.map((w) => (
                                    <tr key={w.$id} className="hover:bg-[#202736] transition-colors text-slate-300">
                                        <td className="p-4">
                                            {new Date(parseInt(w.createdAt || '0') * 1000).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-xs font-mono">{w.userId}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-blue-400">{w.upiId}</span>
                                                <button onClick={() => copyUpi(w.upiId)} className="text-slate-500 hover:text-white transition-colors">
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-4 font-black text-white">₹{w.amount}</td>
                                        <td className="p-4">
                                            {w.status === 'pending' ? (
                                                <span className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                                    <Clock size={12} /> Pending
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                                    <CheckCircle size={12} /> Paid
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {w.status === 'pending' && (
                                                <button
                                                    onClick={() => handleMarkPaid(w.$id, w.amount, w.upiId)}
                                                    disabled={processingId === w.$id}
                                                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
                                                >
                                                    <Navigation size={16} className="-rotate-45" />
                                                    Mark Paid
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
