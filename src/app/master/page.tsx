import Link from "next/link";
import { HeroSection } from "./components/HeroSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { TestimonialsSection } from "./components/TestimonialsSection";

// ✅ Server Component (Static by default in App Router)
export default function MasterPage() {
    return (
        <div className="min-h-screen bg-card text-card-foreground">
            {/* Hero Section - Client Side Animation */}
            <HeroSection />

            {/* Features Section - Scroll Reveal */}
            <FeaturesSection />

            {/* How It Works - Scroll Reveal */}
            <HowItWorksSection />

            {/* Testimonials - Scroll Reveal */}
            <TestimonialsSection />

            {/* Footer - Static */}
            <footer className="py-8 border-t">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                        <div className="font-semibold text-slate-900">ChaoWeb</div>
                        <div className="text-slate-500">© 2024 ChaoWeb. All rights reserved.</div>
                        <div className="flex gap-6 text-slate-500">
                            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
                            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

