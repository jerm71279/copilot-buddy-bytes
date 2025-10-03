import { Button } from "@/components/ui/button";
import { Shield, Menu } from "lucide-react";
import { useState } from "react";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">ComplianceOS</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium hover:text-accent transition-colors">
              Features
            </a>
            <a href="#frameworks" className="text-sm font-medium hover:text-accent transition-colors">
              Frameworks
            </a>
            <a href="#dashboard" className="text-sm font-medium hover:text-accent transition-colors">
              Dashboard
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-accent transition-colors">
              Pricing
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button variant="hero" size="sm">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-accent/10 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-3">
              <a href="#features" className="text-sm font-medium hover:text-accent transition-colors py-2">
                Features
              </a>
              <a href="#frameworks" className="text-sm font-medium hover:text-accent transition-colors py-2">
                Frameworks
              </a>
              <a href="#dashboard" className="text-sm font-medium hover:text-accent transition-colors py-2">
                Dashboard
              </a>
              <a href="#pricing" className="text-sm font-medium hover:text-accent transition-colors py-2">
                Pricing
              </a>
              <div className="flex flex-col gap-2 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" className="justify-start">
                  Sign In
                </Button>
                <Button variant="hero" size="sm">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
