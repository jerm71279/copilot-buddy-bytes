import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Frameworks from "@/components/Frameworks";
import DashboardPreview from "@/components/DashboardPreview";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
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
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
