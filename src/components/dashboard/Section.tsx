import Link from "next/link";

interface SectionProps {
    title: string;
    children: React.ReactNode;
    viewAllHref?: string;
}

export default function Section({ title, children, viewAllHref }: SectionProps) {
    return (
        <section className="mb-12">
            <div className="px-6 mb-6 flex justify-between items-end">
                <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="text-sm font-bold text-primary hover:text-black transition-colors flex items-center gap-1 group/link"
                    >
                        See All
                        <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                    </Link>
                )}
            </div>

            <div className="flex overflow-x-auto px-6 pb-6 gap-6 scrollbar-hide snap-x">
                {children}
            </div>
        </section>
    );
}
