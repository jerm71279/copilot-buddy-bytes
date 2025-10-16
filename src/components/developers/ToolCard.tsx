interface ToolCardProps {
  title: string;
  items: string[];
}

export function ToolCard({ title, items }: ToolCardProps) {
  return (
    <div className="p-4 border rounded-lg">
      <h4 className="font-semibold mb-2">{title}</h4>
      <ul className="text-sm text-muted-foreground space-y-1">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
