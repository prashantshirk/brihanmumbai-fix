import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Camera, MapPin, CheckCircle2 } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/40 via-transparent to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="flex flex-col gap-6">
            <Badge variant="secondary" className="w-fit">
              Powered by AI Analysis
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
              Report Civic Issues.
              <span className="text-primary block mt-2">Fix Mumbai Together.</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Snap a photo of potholes, garbage, or broken infrastructure. Our AI analyzes the issue and routes it directly to the responsible department for faster resolution.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button size="lg" asChild className="gap-2">
                <Link href="/login">
                  Report an Issue
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/feed">View Community Reports</Link>
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <span>12,000+ Issues Resolved</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <span>24 Wards Covered</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <span>Real-time Tracking</span>
              </div>
            </div>
          </div>
          
          {/* Right Content - Visual */}
          <div className="relative">
            <div className="relative bg-card rounded-2xl border shadow-xl overflow-hidden">
              {/* Mock Phone Frame */}
              <div className="bg-muted rounded-xl aspect-[3/4] overflow-hidden relative">
                {/* Pothole Image Background */}
                <Image
                  src="/images/pothole-road-india.jpg"
                  alt="Pothole on Indian highway"
                  fill
                  className="object-cover"
                  priority
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-accent/10" />
                
                {/* Mock UI Elements */}
                <div className="absolute top-4 left-4 right-4">
                  <div className="bg-background/90 backdrop-blur rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Camera className="size-4 text-primary" />
                      <span>Capture Issue</span>
                    </div>
                  </div>
                </div>
                
                {/* Floating Cards */}
                <div className="absolute bottom-20 left-4 right-4">
                  <div className="bg-background/95 backdrop-blur rounded-lg p-4 shadow-lg border">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                        <MapPin className="size-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Pothole Detected</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Severity: High</p>
                        <Badge variant="secondary" className="mt-2 text-xs">Roads Department</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-primary text-primary-foreground rounded-lg p-3 text-center text-sm font-medium shadow-lg">
                    Submit Report
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 size-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 size-32 bg-accent/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
