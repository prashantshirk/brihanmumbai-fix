import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Camera, 
  Brain, 
  MapPin, 
  Bell, 
  Shield, 
  BarChart3,
  Zap,
  Globe
} from "lucide-react";

const features = [
  {
    title: "AI-Powered Analysis",
    description: "Upload a photo and our AI instantly identifies the issue type, severity level, and appropriate department for resolution.",
    icon: Brain,
  },
  {
    title: "Smart Image Recognition",
    description: "Advanced computer vision detects potholes, garbage accumulation, broken streetlights, water leakage, and more.",
    icon: Camera,
  },
  {
    title: "Precise Location Mapping",
    description: "Automatic GPS tagging ensures your report reaches the exact ward and locality for targeted action.",
    icon: MapPin,
  },
  {
    title: "Real-time Notifications",
    description: "Track your complaint status from submission to resolution with instant updates at every stage.",
    icon: Bell,
  },
  {
    title: "Transparent Tracking",
    description: "Every report is assigned a unique ID. Monitor progress through our public dashboard.",
    icon: Shield,
  },
  {
    title: "Analytics Dashboard",
    description: "View ward-wise statistics, resolution rates, and trending issues to understand civic patterns.",
    icon: BarChart3,
  },
  {
    title: "Fast Processing",
    description: "Automated routing ensures complaints reach the right department within seconds, not days.",
    icon: Zap,
  },
  {
    title: "Community Feed",
    description: "See what issues others are reporting in your area. Support collective civic improvement.",
    icon: Globe,
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Everything You Need to Report and Track Issues
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            A complete platform that bridges the gap between citizens and municipal authorities through technology.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="group hover:shadow-lg transition-shadow duration-300 border-border/50">
              <CardHeader>
                <div className="size-12 rounded-xl bg-secondary flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                  <feature.icon className="size-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
