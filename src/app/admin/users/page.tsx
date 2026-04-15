"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserProfile } from "@/types";
import { getUsers, updateUser } from "@/lib/pocketbase-db";

export default function UsersManagerPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<'all' | 'with-phone' | 'without-phone'>('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePremium = async (user: UserProfile) => {
        try {
            await updateUser(user.uid, {
                premiumStatus: !user.premiumStatus
            });
            setUsers(users.map(u => u.uid === user.uid ? { ...u, premiumStatus: !u.premiumStatus } : u));
        } catch (error) {
            console.error("Error updating premium status:", error);
            alert("Failed to update premium status.");
        }
    };

    const handleToggleBan = async (user: UserProfile) => {
        if (!confirm(`Are you sure you want to ${user.isBanned ? "unban" : "ban"} this user?`)) return;

        try {
            await updateUser(user.uid, {
                isBanned: !user.isBanned
            });
            setUsers(users.map(u => u.uid === user.uid ? { ...u, isBanned: !u.isBanned } : u));
        } catch (error) {
            console.error("Error updating ban status:", error);
            alert("Failed to update ban status.");
        }
    };

    const handleGrantTestAccess = async (user: UserProfile) => {
        if (!confirm(`Are you sure you want to grant "NCET Ready Test" access to ${user.email}?`)) return;

        try {
            const response = await fetch('/api/admin/grant-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: user.uid })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(data.message || `Successfully granted test access to ${user.email}`);
            } else {
                alert(`Failed to grant access: ${data.error || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Error granting test access:", error);
            alert("An error occurred while granting test access.");
        }
    };

    const filteredUsers = users
        .filter(user => {
            // Text search
            const matchesSearch =
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user.phoneNumber && user.phoneNumber.includes(searchTerm));
            
            // Phone filter
            if (filter === 'with-phone') return matchesSearch && !!user.phoneNumber;
            if (filter === 'without-phone') return matchesSearch && !user.phoneNumber;
            return matchesSearch;
        });

    const usersWithPhone = users.filter(u => !!u.phoneNumber).length;

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h1>User Management</h1>
                <div style={{ width: "300px" }}>
                    <Input
                        placeholder="Search by email / phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats & Filters */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Total: <strong style={{ color: "var(--text-primary)" }}>{users.length}</strong>
                </span>
                <span style={{ fontSize: "0.85rem", color: "#22c55e" }}>
                    📱 With Phone: <strong>{usersWithPhone}</strong>
                </span>
                <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
                    {(['all', 'with-phone', 'without-phone'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: "0.3rem 0.8rem",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: filter === f ? "bold" : "normal",
                                background: filter === f ? "var(--primary)" : "transparent",
                                color: filter === f ? "black" : "var(--text-secondary)",
                                border: filter === f ? "none" : "1px solid var(--border)",
                                cursor: "pointer"
                            }}
                        >
                            {f === 'all' ? 'All' : f === 'with-phone' ? '📱 Has Phone' : 'No Phone'}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: "grid", gap: "1rem" }}>
                {filteredUsers.map((user) => (
                    <Card key={user.uid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                <h3 style={{ fontSize: "1.1rem" }}>{user.email}</h3>
                                {user.role === 'admin' && <span style={{ backgroundColor: "var(--primary)", color: "black", padding: "0.1rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold" }}>ADMIN</span>}
                                {user.premiumStatus && <span style={{ backgroundColor: "#fbbf24", color: "black", padding: "0.1rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold" }}>PREMIUM</span>}
                                {user.isBanned && <span style={{ backgroundColor: "var(--error)", color: "white", padding: "0.1rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold" }}>BANNED</span>}
                            </div>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                UID: {user.uid}
                            </p>
                            {/* Phone number with WhatsApp link */}
                            {user.phoneNumber ? (
                                <a
                                    href={`https://wa.me/91${user.phoneNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.3rem",
                                        marginTop: "0.3rem",
                                        padding: "0.2rem 0.6rem",
                                        backgroundColor: "#25d36620",
                                        color: "#25d366",
                                        borderRadius: "6px",
                                        fontSize: "0.85rem",
                                        fontWeight: "600",
                                        textDecoration: "none"
                                    }}
                                >
                                    📱 +91 {user.phoneNumber}
                                    <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>→ WhatsApp</span>
                                </a>
                            ) : (
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "0.3rem", opacity: 0.5 }}>
                                    No phone number
                                </p>
                            )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <Button
                                variant="outline"
                                onClick={() => handleTogglePremium(user)}
                                style={{ borderColor: user.premiumStatus ? "var(--text-secondary)" : "#fbbf24", color: user.premiumStatus ? "var(--text-secondary)" : "#fbbf24" }}
                            >
                                {user.premiumStatus ? "Remove Premium" : "Give Premium"}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => handleGrantTestAccess(user)}
                                style={{ borderColor: "#10b981", color: "#10b981" }}
                                title="Manually unlock NCET Ready Test"
                            >
                                Grant NCET Test
                            </Button>

                            {user.role !== 'admin' && (
                                <Button
                                    variant="secondary"
                                    style={{ backgroundColor: user.isBanned ? "var(--success)" : "var(--error)" }}
                                    onClick={() => handleToggleBan(user)}
                                >
                                    {user.isBanned ? "Unban User" : "Ban User"}
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}

                {!loading && filteredUsers.length === 0 && (
                    <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                        No users found.
                    </div>
                )}
            </div>
        </div>
    );
}
