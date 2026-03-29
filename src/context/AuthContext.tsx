"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { account, databases, isAppwriteConfigured } from "@/lib/appwrite-student";
import { Models } from "appwrite";
import { useRouter } from "next/navigation";
import { clearAllCache } from "@/lib/appwrite-cache";

// Define User Type based on Appwrite Account + Custom Preferences/Document
interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
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
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [role, setRole] = useState<"user" | "admin" | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const checkSession = async () => {
        if (!isAppwriteConfigured()) {
            setLoading(false);
            return;
        }

        try {
            // Wait for Appwrite session to be ready (OAuth takes time to propagate)
            let session;
            let retries = 0;
            const maxRetries = 5;

            while (retries < maxRetries) {
                try {
                    session = await account.get();
                    break;
                } catch (err) {
                    retries++;
                    if (retries >= maxRetries) throw err;
                    // Exponential backoff: 500ms, 1s, 2s, 4s...
                    await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retries - 1)));
                }
            }

            if (!session) throw new Error("Session discovery failed");

            setUser(session);

            // Fetch User Role from Database (collection 'users')
            try {
                const userDoc = await databases.getDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c84948001622ba05f7',
                    'users',
                    session.$id
                );
                setRole(userDoc.role as "user" | "admin");
            } catch (error) {
                console.warn("User document not found. Attempting to heal (recreate)...");
                try {
                    await databases.createDocument(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c84948001622ba05f7',
                        'users',
                        session.$id,
                        {
                            userId: session.$id,
                            email: session.email,
                            displayName: session.name,
                            role: 'user',
                            premiumStatus: false,
                            createdAt: Math.floor(Date.now() / 1000)
                        }
                    );
                    console.log("User document healed successfully.");
                    setRole("user");
                } catch (healError) {
                    console.error("Failed to heal user document:", healError);
                    await account.deleteSession('current');
                    setUser(null);
                    setRole(null);
                    router.push("/login?error=account_sync_failed");
                    return;
                }
            }

        } catch (error) {
            // No session
            setUser(null);
            setRole(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkSession();
    }, []);

    const logout = async () => {
        try {
            await account.deleteSession('current');
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
