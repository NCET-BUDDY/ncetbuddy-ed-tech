"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserProfile } from "@/types";
import { getUsers, updateUser } from "@/lib/appwrite-db";

export default function UsersManagerPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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
            // Update local state
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
            // Update local state
            setUsers(users.map(u => u.uid === user.uid ? { ...u, isBanned: !u.isBanned } : u));
        } catch (error) {
            console.error("Error updating ban status:", error);
            alert("Failed to update ban status.");
        }
    };

    const handleGrantTestAccess = async (user: UserProfile) => {
        if (!confirm(`Are you sure you want to grant "NCET Ready Test" access to ${user.email}?`)) return;

        try {
            // Import the new function dynamically or at the top.
            // Assuming it's exported from appwrite-db
            const { grantManualTestAccess } = await import("@/lib/appwrite-db");
            const success = await grantManualTestAccess(user.uid);
            if (success) {
                alert(`Successfully granted test access to ${user.email}`);
            } else {
                alert("Failed to grant access. They might already have it, or an error occurred.");
            }
        } catch (error) {
            console.error("Error granting test access:", error);
            alert("An error occurred while granting test access.");
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>User Management</h1>
                <div style={{ width: "300px" }}>
                    <Input
                        placeholder="Search by email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ display: "grid", gap: "1rem" }}>
                {filteredUsers.map((user) => (
                    <Card key={user.uid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <h3 style={{ fontSize: "1.1rem" }}>{user.email}</h3>
                                {user.role === 'admin' && <span style={{ backgroundColor: "var(--primary)", color: "black", padding: "0.1rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold" }}>ADMIN</span>}
                                {user.premiumStatus && <span style={{ backgroundColor: "#fbbf24", color: "black", padding: "0.1rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold" }}>PREMIUM</span>}
                                {user.isBanned && <span style={{ backgroundColor: "var(--error)", color: "white", padding: "0.1rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold" }}>BANNED</span>}
                            </div>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                UID: {user.uid}
                            </p>
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
