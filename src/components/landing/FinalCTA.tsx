import React from 'react';
import { Users, Calendar, MessageSquare } from 'lucide-react';

export const FinalCTA = () => {
    const coreFeatures = [
        {
            title: "1-1 Personalized Mentorship",
            description: "Connect directly with industry experts and topper alumni to get tailored guidance, strategy planning, and career advice that accelerates your NCET preparation.",
            icon: <Users className="w-8 h-8 text-[#E11D48]" />
        },
        {
            title: "AI-Powered Study Planner",
            description: "Our smart engine creates a custom schedule based on your strengths and weaknesses. Track your progress in real-time and stay ahead of your preparation goals.",
            icon: <Calendar className="w-8 h-8 text-[#E11D48]" />
        },
        {
            title: "Interactive Discussion Forum",
            description: "Engage in peer-to-peer learning with a community of serious aspirants. Get your doubts solved instantly by subject matter experts and verified mentors.",
            icon: <MessageSquare className="w-8 h-8 text-[#E11D48]" />
        }
    ];

    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-[#0F172A] mb-4">Everything You Need to Crack NCET</h2>
                    <p className="text-zinc-500 text-lg">Premium tools and guidance engineered for your academic success.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {coreFeatures.map((feature, index) => (
                        <div key={index} className="p-10 rounded-[2.5rem] bg-white border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-10">
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-[#0F172A] mb-6 leading-tight">{feature.title}</h3>
                            <p className="text-zinc-500 leading-relaxed text-lg">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
