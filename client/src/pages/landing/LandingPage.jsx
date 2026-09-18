import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import Hero from '../../components/landing/Hero'
import TrustSection from '../../components/landing/TrustSection'
import AboutSection from '../../components/landing/AboutSection'
import FeaturesSection from '../../components/landing/FeaturesSection'
import HowItWorks from '../../components/landing/HowItWorks'
import PrivacySafety from '../../components/landing/PrivacySafety'
import CTASection from '../../components/landing/CTASection'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <main>
        <Hero />
        <TrustSection />
        <AboutSection />
        <FeaturesSection />
        <HowItWorks />
        <PrivacySafety />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
