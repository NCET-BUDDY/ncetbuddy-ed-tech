"use client";

import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { PYQSubject } from "@/types";
import { PenLine, BookOpen, Microscope, Briefcase, Target } from "lucide-react";

const PYQ_SUBJECTS: { id: PYQSubject; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'languages', label: 'Languages', icon: <PenLine size={36} />, description: 'English, Hindi & Regional' },
    { id: 'humanities', label: 'Humanities', icon: <BookOpen size={36} />, description: 'History, Geography & More' },
    { id: 'science', label: 'Science', icon: <Microscope size={36} />, description: 'Physics, Chemistry, Biology, Maths' },
    { id: 'commerce', label: 'Commerce', icon: <Briefcase size={36} />, description: 'Economics, Accounts & Business' },
    { id: 'non-domain', label: 'Non-Domain', icon: <Target size={36} />, description: 'General Knowledge & Aptitude' }
];

export default function PYQsPage() {
    return (
        <div className="space-y-12">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">PYQs (Previous Year Questions)</h1>
                <p className="text-foreground mt-1 font-medium">Free practice based on previous year questions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PYQ_SUBJECTS.map((subject) => (
                    <Link key={subject.id} href={`/dashboard/tests/pyq/${subject.id}`}>
                        <Card className="group hover:border-primary/50 transition-all duration-300 shadow-lg cursor-pointer h-full">
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-primary">{subject.icon}</span>
                                    <span className="px-3 py-1 text-xs font-bold text-black bg-primary rounded-full">
                                        FREE
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                    {subject.label}
                                </h3>

                                <p className="text-foreground/70 text-sm font-medium mb-4">
                                    {subject.description}
                                </p>

                                <div className="mt-auto pt-4 border-t border-border">
                                    <span className="text-sm text-foreground font-bold group-hover:text-primary transition-colors">
                                        View Tests →
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
