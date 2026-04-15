"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SiteSettings } from "@/types";
import { getSettings, saveSettings } from "@/lib/pocketbase-db";

export default function SettingsPage() {
    const [settings, setSettings] = useState<SiteSettings>({
        bannerText: "Welcome to NCET Buddy!",
        primaryColor: "#fbbf24",
        contactEmail: "ncetbuddy@gmail.com",
        showBanner: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSettings();
                if (data) {
                    setSettings(data);
                } else {
                    // Create default settings if not exists
                    await saveSettings(settings);
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveSettings(settings);
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ color: "white", padding: "2rem" }}>Loading settings...</div>;

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h1 style={{ marginBottom: "2rem" }}>Website Settings</h1>

            <Card style={{ marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1.5rem" }}>General Settings</h3>

                <div style={{ marginBottom: "1.5rem" }}>
                    <Input
                        label="Home Banner Text"
                        value={settings.bannerText}
                        onChange={(e) => setSettings({ ...settings, bannerText: e.target.value })}
                    />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                    <Input
                        label="Contact Email"
                        value={settings.contactEmail}
                        onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Primary Color</label>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        {["#fbbf24", "#60a5fa", "#f472b6", "#34d399", "#a78bfa"].map((color) => (
                            <div
                                key={color}
                                onClick={() => setSettings({ ...settings, primaryColor: color })}
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    backgroundColor: color,
                                    cursor: "pointer",
                                    border: settings.primaryColor === color ? "3px solid white" : "none"
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: "2rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "white", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={settings.showBanner}
                            onChange={(e) => setSettings({ ...settings, showBanner: e.target.checked })}
                            style={{ width: "20px", height: "20px" }}
                        />
                        Show Welcome Banner on Home Page
                    </label>
                </div>

                <Button onClick={handleSave} isLoading={saving} style={{ width: "100%" }}>
                    Save Changes
                </Button>
            </Card>
        </div>
    );
}
