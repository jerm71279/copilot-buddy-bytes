import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Monitor, Network, AlertTriangle, Key } from "lucide-react";
import DashboardNavigation from "@/components/DashboardNavigation";
import TrustedDevicesManager from "@/components/saw/TrustedDevicesManager";
import IPAllowlistManager from "@/components/saw/IPAllowlistManager";
import DeviceSessionsMonitor from "@/components/saw/DeviceSessionsMonitor";
import BreakGlassAccess from "@/components/saw/BreakGlassAccess";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function SAWManagement() {
  const [activeTab, setActiveTab] = useState("devices");

  return (
    <DashboardLayout>
      <DashboardNavigation 
        title="Secure Access Workstations (SAW)"
        dashboards={[
          { name: "Admin", path: "/admin" },
          { name: "RBAC", path: "/rbac" },
          { name: "Privileged Access", path: "/audit/privileged-access" },
        ]}
      />
      
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">Secure Access Workstations</h1>
        </div>
        <p className="text-muted-foreground">
          Manage trusted devices, IP allowlists, session monitoring, and break-glass emergency access
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="devices" className="gap-2">
              <Monitor className="h-4 w-4" />
              Trusted Devices
            </TabsTrigger>
            <TabsTrigger value="ip-allowlist" className="gap-2">
              <Network className="h-4 w-4" />
              IP Allowlist
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Active Sessions
            </TabsTrigger>
            <TabsTrigger value="break-glass" className="gap-2">
              <Key className="h-4 w-4" />
              Break-Glass Access
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices">
            <TrustedDevicesManager />
          </TabsContent>

          <TabsContent value="ip-allowlist">
            <IPAllowlistManager />
          </TabsContent>

          <TabsContent value="sessions">
            <DeviceSessionsMonitor />
          </TabsContent>

          <TabsContent value="break-glass">
            <BreakGlassAccess />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}