import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Link2, GitBranch } from "lucide-react";

export const ChangeRequestLinkingInfo = () => {
  return (
    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-blue-900 dark:text-blue-100">
        Change Request Linking
      </AlertTitle>
      <AlertDescription className="text-blue-800 dark:text-blue-200 space-y-2">
        <div className="flex items-start gap-2">
          <Link2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Automatic Linking:</strong> When Azure Event Grid detects a change, it automatically searches for related planned change requests and links them together.
          </div>
        </div>
        <div className="flex items-start gap-2">
          <GitBranch className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>How it works:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
              <li>Create a planned change request (gets approval)</li>
              <li>Make the actual change in Azure Portal</li>
              <li>Event Grid auto-logs the change AND links it to your planned CR</li>
              <li>Both changes show the relationship for complete audit trail</li>
            </ul>
          </div>
        </div>
        <div className="text-sm mt-2">
          <strong>Matching criteria:</strong> Resource name, resource type, or changes scheduled within 24 hours of execution
        </div>
      </AlertDescription>
    </Alert>
  );
};