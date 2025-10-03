import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Frameworks from "@/components/Frameworks";
import DashboardPreview from "@/components/DashboardPreview";
import UseCases from "@/components/UseCases";
import Integrations from "@/components/Integrations";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen scroll-smooth">
      <Navigation />
      <main>
        <Hero />
        <div id="features">
          <Features />
        </div>
        <div id="frameworks">
          <Frameworks />
        </div>
        <div id="dashboard">
          <DashboardPreview />
        </div>
        <UseCases />
        <Integrations />
        <Testimonials />
        <Pricing />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
