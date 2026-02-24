import React from 'react';
import { XCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const ProblemSolution = () => {
    const points = [
        {
            problem: "Scattered Study Material",
            problemDesc: "Wasting hours searching for the right notes across multiple websites and telegram groups.",
            solution: "Everything in One Place",
            solutionDesc: "Expert-curated, syllabus-aligned notes and PYQs accessible in a single dashboard.",
            color: "#EF4444"
        },
        {
            problem: "Outdated Mock Tests",
            problemDesc: "Practicing on old patterns that don't match the current difficulty or NTA interface.",
            solution: "Real NTA Simulation",
            solutionDesc: "A mirror-image of the NTA exam interface with 90% syllabus match to kill exam anxiety.",
            color: "#F59E0B"
        },
        {
            problem: "Zero Performance Tracking",
            problemDesc: "Not knowing your weak areas until it's too late on the actual exam day.",
            solution: "AI-Powered Strategy",
            solutionDesc: "Deep analytics that identify your weak spots and tell you exactly what to solve today.",
            color: "#3B82F6"
        }
    ];

    // Transform points into problems and solutions
    const problems = points.map(item => ({
        title: item.problem,
        desc: item.problemDesc
    }));

    const solutions = points.map(item => ({
        title: item.solution,
        desc: item.solutionDesc
    }));

    return (
        <section className="py-24 bg-zinc-50 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 transform translate-x-1/2" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-6xl font-black text-black tracking-tighter uppercase mb-6 italic leading-[0.9]">
                        Stop struggling. <br />
                        <span className="text-primary">Start succeeding.</span>
                    </h2>
                    <p className="text-zinc-500 font-medium text-lg max-w-xl mx-auto uppercase tracking-widest text-sm">
                        NCET is hard, but your preparation doesn't have to be.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Problems Side */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-black uppercase tracking-widest text-zinc-400 mb-8 border-l-4 border-zinc-200 pl-4">The struggle is real</h3>
                        <div className="space-y-4">
                            {problems.map((p, i) => (
                                <div key={i} className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm transition-all hover:shadow-md group">
                                    <div className="mt-1 bg-zinc-100 p-2 rounded-lg group-hover:bg-rose-50 group-hover:text-[#E11D48] transition-colors">
                                        <XCircle className="w-5 h-5 text-zinc-400 group-hover:text-[#E11D48]" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-black uppercase tracking-tight text-lg mb-1 group-hover:text-[#E11D48] transition-colors">{p.title}</h4>
                                        <p className="text-zinc-500 font-medium leading-relaxed">{p.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Solution Side */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-black uppercase tracking-widest text-primary mb-8 border-l-4 border-primary pl-4">The NCETBuddy Way</h3>
                        <div className="space-y-4">
                            {solutions.map((s, i) => (
                                <div key={i} className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-primary/20 shadow-xl shadow-primary/5 transition-all hover:scale-[1.02] group">
                                    <div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-black uppercase tracking-tight text-lg mb-1">{s.title}</h4>
                                        <p className="text-zinc-600 font-medium leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
