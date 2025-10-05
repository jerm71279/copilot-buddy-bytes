import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import EvidenceUpload from "@/components/EvidenceUpload";

export default function ComplianceEvidenceUpload() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button 
            onClick={() => navigate('/portal')} 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboards
          </Button>
        </div>

        <EvidenceUpload onUploadComplete={() => navigate('/compliance')} />
      </main>
    </div>
  );
}
