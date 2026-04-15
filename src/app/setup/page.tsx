"use client";

import { useAuth } from "@/context/AuthContext";
import { updateUser } from "@/lib/pocketbase-db";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useRouter } from "next/navigation";

export default function SetupPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const makeMeAdmin = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await updateUser(user.$id, {
                role: "admin",
                email: user.email
            });
            alert("Success! You are now an admin.");
            window.location.href = "/admin"; // Force reload to update context
        } catch (error) {
            console.error("Error updating role:", error);
            alert("Failed to update role.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <Card>
                    <h2>Please Login First</h2>
                    <p>You need to be logged in to run the setup.</p>
                    <Button onClick={() => router.push("/login")}>Go to Login</Button>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
            <Card style={{ textAlign: "center", maxWidth: "400px" }}>
                <h1 style={{ marginBottom: "1rem" }}>Admin Setup</h1>
                <p style={{ marginBottom: "2rem", color: "var(--text-secondary)" }}>
                    Click the button below to promote your current account <strong>({user.email})</strong> to Admin status.
                </p>
                <Button onClick={makeMeAdmin} isLoading={loading} style={{ width: "100%" }}>
                    Make Me Admin
                </Button>
            </Card>
        </div>
    );
}
