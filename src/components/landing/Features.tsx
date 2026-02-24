import { CalendarDays, ClipboardList, MessageCircle, BarChart2 } from "lucide-react";

export const Features = () => {
    const features = [
        {
            title: "Full-Length Mock Tests",
            description: "Practice in the real NTA interface. Save 20+ hours of trial and error with our expert-curated mock series.",
            icon: (<ClipboardList size={28} />),
            color: "text-orange-500"
        },
        {
            title: "Topic-wise Notes",
            description: "Stop searching for quality material. Get concise, 90% syllabus-matching notes that cover every NCET topic.",
            icon: (<CalendarDays size={28} />),
            color: "text-orange-500"
        },
        {
            title: "Previous Year Questions",
            description: "Master the exam pattern. Solve authentic PYQs with detailed explanations to avoid surprises on exam day.",
            icon: (<MessageCircle size={28} />),
            color: "text-orange-500"
        },
        {
            title: "Performance Analytics",
            description: "Know exactly where you stand. Identify weak spots instantly and optimize your study schedule for a higher score.",
            icon: (<BarChart2 size={28} />),
            color: "text-orange-500"
        }
    ];

    return (
        <section id="features" className="py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase mb-6 italic">Why NCETBuddy?</h2>
                    <p className="text-zinc-500 font-medium text-lg max-w-2xl mx-auto uppercase tracking-widest text-sm">Tailored for your success in the ITEP entrance exam.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-white border border-zinc-100 rounded-[2rem] p-10 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group shadow-sm flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mb-8 text-primary group-hover:bg-primary group-hover:text-black transition-all duration-500 border border-zinc-100 shadow-sm">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-black text-black uppercase tracking-tight mb-4 leading-tight">{feature.title}</h3>
                            <p className="text-zinc-500 font-medium text-sm leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
