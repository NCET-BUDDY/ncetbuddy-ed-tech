import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { StatsBar } from "@/components/landing/StatsBar";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { TestimonialsGrid } from "@/components/landing/TestimonialsGrid";
import { UniversityLogos } from "@/components/landing/UniversityLogos";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-foreground selection:bg-primary/30">
      <Navbar />
      <Hero />
      <StatsBar />
      <FeaturesGrid />
      <TestimonialsGrid />
      <UniversityLogos />
      <FinalCTA />
      <Footer />
    </main>
  );
}
