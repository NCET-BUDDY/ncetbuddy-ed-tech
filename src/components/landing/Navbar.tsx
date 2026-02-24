import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const Navbar = () => {
    return (
        <nav className="fixed top-12 left-0 right-0 z-[90] bg-white/80 backdrop-blur-md border-b border-zinc-100 py-4">
            <div className="container mx-auto px-4 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-200">
                        <img src="/LOGO.png" alt="NCETBuddy" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xl font-bold tracking-tighter text-black flex items-center">
                        NCET<span className="text-[#E11D48]">Buddy</span>
                    </span>
                </Link>

                {/* Nav Links */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="/dashboard/tests" className="text-sm font-semibold text-zinc-600 hover:text-[#E11D48] transition-colors">Mock Tests</Link>
                    <Link href="/dashboard/tests/pyq" className="text-sm font-semibold text-zinc-600 hover:text-[#E11D48] transition-colors">PYQs</Link>
                    <Link href="/dashboard/notes" className="text-sm font-semibold text-zinc-600 hover:text-[#E11D48] transition-colors">Notes</Link>
                    <Link href="/success-stories" className="text-sm font-semibold text-zinc-600 hover:text-[#E11D48] transition-colors">Success Stories</Link>
                </div>

                {/* CTAs */}
                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sm font-semibold text-zinc-600 hover:text-black">Login</Link>
                    <Link href="/login">
                        <Button className="bg-[#E11D48] hover:bg-[#BE123C] text-white px-6 rounded-lg font-bold">
                            Get Started
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
};
