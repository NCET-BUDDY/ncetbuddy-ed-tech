"use client";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "admin" | "educator" | "verified" | "outline";
    className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
    const variants = {
        default: "bg-gray-100 text-gray-800 border-gray-200",
        admin: "bg-blue-100 text-blue-800 border-blue-200 font-black",
        educator: "bg-purple-100 text-purple-800 border-purple-200 font-black",
        verified: "bg-green-100 text-green-800 border-green-200 font-black",
        outline: "bg-transparent text-gray-800 border-gray-800",
    };

    return (
        <span className={`
            inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border
            ${variants[variant]}
            ${className || ""}
        `}>
            {children}
        </span>
    );
}
