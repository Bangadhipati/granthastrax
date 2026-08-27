import { AppShell } from "@/components/layout/AppShell";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "./HeroSection";
import { FeatureCards } from "./FeatureCards";
import { ConceptSection } from "./ConceptSection";

export function HomeView() {
  return (
    <AppShell>
      <HeroSection />
      <FeatureCards />
      <ConceptSection />
      <Footer />
    </AppShell>
  );
}
