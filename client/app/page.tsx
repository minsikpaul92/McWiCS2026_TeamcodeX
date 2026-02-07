import Link from "next/link";
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { FeaturesSection } from "@/components/features-section"
import { CTASection } from "@/components/cta-section"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        {/* <AboutSection /> */}
        {/* <FeaturesSection /> */}
        <CTASection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
