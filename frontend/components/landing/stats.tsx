import { Card } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, Users } from "lucide-react";

const stats = [
  {
    label: "Reports Submitted",
    value: "45,230",
    icon: FileText,
    description: "Total civic issues reported",
  },
  {
    label: "Avg Resolution Time",
    value: "4.2 days",
    icon: Clock,
    description: "Faster than traditional methods",
  },
  {
    label: "Issues Resolved",
    value: "38,150",
    icon: CheckCircle,
    description: "84% resolution rate",
  },
  {
    label: "Active Citizens",
    value: "28,500",
    icon: Users,
    description: "Growing community",
  },
];

export function Stats() {
  return (
    <section className="py-16 sm:py-20 bg-muted/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6 text-center border-0 shadow-none bg-transparent">
              <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary mb-4">
                <stat.icon className="size-6" />
              </div>
              <p className="text-3xl sm:text-4xl font-bold tracking-tight">{stat.value}</p>
              <p className="font-medium mt-1">{stat.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
