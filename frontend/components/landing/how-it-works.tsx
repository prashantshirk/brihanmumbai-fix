import { Badge } from "@/components/ui/badge";

const steps = [
  {
    step: "01",
    title: "Capture the Issue",
    description: "Take a clear photo of the civic problem you want to report - pothole, garbage, broken infrastructure, or any other issue.",
  },
  {
    step: "02",
    title: "AI Analysis",
    description: "Our advanced AI analyzes your image, identifies the issue type, assesses severity, and determines the responsible department.",
  },
  {
    step: "03",
    title: "Add Location Details",
    description: "Confirm the location, select your ward, and add any additional details to help authorities locate the problem quickly.",
  },
  {
    step: "04",
    title: "Submit & Track",
    description: "Submit your complaint and receive a unique tracking ID. Monitor progress in real-time until resolution.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">Simple Process</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Report Issues in 4 Easy Steps
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Our streamlined process makes civic reporting quick and effortless. From photo to resolution tracking in minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <div key={item.step} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-1/2 w-full h-px bg-border" />
              )}
              
              <div className="relative flex flex-col items-center text-center">
                {/* Step Number */}
                <div className="size-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-6 relative z-10">
                  {item.step}
                </div>
                
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
