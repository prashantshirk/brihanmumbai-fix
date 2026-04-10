import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Camera } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 size-64 bg-white/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 size-48 bg-white/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
          
          <div className="relative px-8 py-16 sm:px-16 sm:py-20 text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-white/10 mb-6">
              <Camera className="size-8" />
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance max-w-3xl mx-auto">
              Ready to Make Mumbai Better?
            </h2>
            
            <p className="text-lg text-primary-foreground/80 mt-6 max-w-2xl mx-auto">
              Join thousands of citizens who are actively improving their neighborhoods. Report your first issue today and be part of the change.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Button size="lg" variant="secondary" asChild className="gap-2 text-primary">
                <Link href="/register">
                  Create Free Account
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            
            <p className="text-sm text-primary-foreground/60 mt-8">
              Create an account to start reporting issues and track all your submissions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
