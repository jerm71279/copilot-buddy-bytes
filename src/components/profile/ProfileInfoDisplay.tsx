interface ProfileInfoDisplayProps {
  fullName?: string;
  currentCustomerName?: string;
}

export function ProfileInfoDisplay({ fullName, currentCustomerName }: ProfileInfoDisplayProps) {
  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Full Name</label>
        <div className="text-sm text-muted-foreground">{fullName || "Not set"}</div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Current Customer</label>
        <div className="text-sm text-muted-foreground">
          {currentCustomerName || "Not assigned"}
        </div>
      </div>
    </>
  );
}
