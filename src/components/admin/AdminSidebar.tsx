"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminSidebar.module.css";

export const AdminSidebar = () => {
    const pathname = usePathname();

    const navItems = [
        { label: "Dashboard", href: "/admin" },
        { label: "User Analytics", href: "/admin/analytics" },
        { label: "Test Analytics", href: "/admin/test-analytics" },
        { label: "Student Performance", href: "/admin/student-performance" },
        { label: "Books / Notes", href: "/admin/books" },
        { label: "Banners", href: "/admin/banners" },
        { label: "Formula Cards", href: "/admin/formula-cards" },
        { label: "Video Classes", href: "/admin/videos" },
        { label: "Mock Tests (Interactive)", href: "/admin/tests" },
        { label: "PYQs (Interactive)", href: "/admin/pyqs" },
        { label: "Users", href: "/admin/users" },
        { label: "Withdrawals (Affiliate)", href: "/admin/withdrawals" },
        { label: "Notifications", href: "/admin/notifications" },
        { label: "Settings", href: "/admin/settings" },
    ];

    return (
        <div className={styles.sidebar}>
            <div className={styles.logo}>
                NCET Admin
            </div>
            <nav className={styles.nav}>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.navItem} ${pathname === item.href ? styles.active : ""}`}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
        </div>
    );
};
