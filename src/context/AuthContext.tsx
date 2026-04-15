"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import pb from "@/lib/pocketbase";
import { isPocketBaseConfigured } from "@/lib/pocketbase";
import { useRouter } from "next/navigation";
import { clearAllCache } from "@/lib/pocketbase-cache";

// Define User Type based on PocketBase AuthModel
interface PBUser {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    [key: string]: any; // PocketBase records can have additional fields
}

interface AuthContextType {
    user: PBUser | null;
    role: "user" | "admin" | null;
    loading: boolean;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
    logout: async () => { },
    checkSession: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<PBUser | null>(null);
    const [role, setRole] = useState<"user" | "admin" | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const checkSession = useCallback(async () => {
        if (!isPocketBaseConfigured()) {
            setLoading(false);
            return;
        }

        try {
            // PocketBase persists auth state automatically in authStore
            if (!pb.authStore.isValid) {
                setUser(null);
                setRole(null);
                setLoading(false);
                return;
            }

            // Refresh the auth token to ensure validity
            try {
                await pb.collection('users').authRefresh();
            } catch (refreshError) {
                // Token is expired or invalid — clear and bail
                pb.authStore.clear();
                setUser(null);
                setRole(null);
                setLoading(false);
                return;
            }

            const model = pb.authStore.model;
            if (!model) {
                setUser(null);
                setRole(null);
                setLoading(false);
                return;
            }

            const pbUser: PBUser = {
                id: model.id,
                email: model.email || '',
                name: model.name || model.displayName || '',
                avatar: model.avatar || '',
                ...model,
            };

            setUser(pbUser);

            // Fetch User Role from the 'users' collection document
            try {
                const userDoc = await pb.collection('users').getOne(model.id);
                setRole(userDoc.role as "user" | "admin");
            } catch (error: any) {
                // If user document not found (404), attempt to heal (create it)
                if (error?.status === 404) {
                    console.warn("User document not found. Attempting to heal (recreate)...");
                    try {
                        await pb.collection('users').create({
                            id: model.id,
                            userId: model.id,
                            email: model.email,
                            displayName: model.name || '',
                            role: 'user',
                            premiumStatus: false,
                            createdAt: Math.floor(Date.now() / 1000)
                        });
                        console.log("User document healed successfully.");
                        setRole("user");
                    } catch (healError) {
                        console.error("Failed to heal user document:", healError);
                        pb.authStore.clear();
                        setUser(null);
                        setRole(null);
                        router.push("/login?error=account_sync_failed");
                        return;
                    }
                } else {
                    // Unknown error — log but don't destroy session
                    console.error("Unexpected error fetching user document:", error);
                    setRole("user");
                }
            }

        } catch (error) {
            // No session
            setUser(null);
            setRole(null);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        checkSession();

        // Listen for auth state changes (e.g., token refresh, logout from another tab)
        const unsubscribe = pb.authStore.onChange(() => {
            checkSession();
        });

        return () => {
            // PocketBase onChange returns void, but we call it for cleanup if needed
            // In newer SDK versions this may return an unsubscribe function
        };
    }, [checkSession]);

    const logout = async () => {
        try {
            pb.authStore.clear();
            clearAllCache();
            setUser(null);
            setRole(null);
            router.push("/login");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, logout, checkSession }}>
            {children}
        </AuthContext.Provider>
    );
};
