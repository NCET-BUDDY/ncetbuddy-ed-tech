"use client";

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { createUserSession, endUserSession, logUserEvent } from '@/lib/pocketbase-db';
import { UserEvent } from '@/types';

interface AnalyticsContextType {
    trackEvent: (eventType: UserEvent['eventType'], pageName?: string, metadata?: string) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const sessionIdRef = useRef<string | null>(null);
    const pageVisitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Session Management
    useEffect(() => {
        if (loading) return;

        // Start session if user is logged in
        if (user && !sessionIdRef.current) {
            const initSession = async () => {
                const sid = await createUserSession(user.$id, window.navigator.userAgent);
                if (sid) {
                    sessionIdRef.current = sid;
                }
            };
            initSession();
        }

        // Cleanup function handles session end
        return () => {
            if (sessionIdRef.current) {
                endUserSession(sessionIdRef.current);
                sessionIdRef.current = null;
            }
        };
    }, [user, loading]);

    // Handle window unload specifically for analytics
    useEffect(() => {
        const handleUnload = () => {
            if (sessionIdRef.current) {
                endUserSession(sessionIdRef.current);
            }
        };

        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, []);

    // Track Page Visits — debounced to reduce DB reads
    // Only logs if user stays on the page for >= 2 seconds
    useEffect(() => {
        if (!user || loading) return;

        // Clear any pending page visit from previous route
        if (pageVisitTimerRef.current) {
            clearTimeout(pageVisitTimerRef.current);
        }

        // Debounce: only log after 2 seconds on the same page
        pageVisitTimerRef.current = setTimeout(() => {
            logUserEvent({
                userId: user.$id,
                eventType: 'page_visit',
                pageName: pathname,
            });
        }, 2000);

        return () => {
            if (pageVisitTimerRef.current) {
                clearTimeout(pageVisitTimerRef.current);
            }
        };
    }, [pathname, user, loading]);

    const trackEvent = async (eventType: UserEvent['eventType'], pageName?: string, metadata?: string) => {
        if (!user) return;

        await logUserEvent({
            userId: user.$id,
            eventType,
            pageName: pageName || pathname,
            metadata
        });
    };

    return (
        <AnalyticsContext.Provider value={{ trackEvent }}>
            {children}
        </AnalyticsContext.Provider>
    );
}

export const useAnalytics = () => {
    const context = useContext(AnalyticsContext);
    if (context === undefined) {
        throw new Error("useAnalytics must be used within an AnalyticsProvider");
    }
    return context;
};

