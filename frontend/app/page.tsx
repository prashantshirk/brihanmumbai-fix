import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Stats } from "@/components/landing/stats";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { IssueCategories } from "@/components/landing/issue-categories";
import FeedPreview from "@/components/landing/FeedPreview";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <IssueCategories />
        <FeedPreview />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
