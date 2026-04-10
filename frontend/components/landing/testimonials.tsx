import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    location: "Andheri West, H-Ward",
    content: "Reported a major pothole on Link Road. Got updates every step of the way and it was fixed in just 3 days! This platform actually works.",
    rating: 5,
    issueType: "Pothole",
  },
  {
    name: "Rajesh Mehta",
    location: "Dadar, G-Ward",
    content: "The AI analysis is impressive. It correctly identified the broken streetlight and even tagged the right department. Much better than the old complaint system.",
    rating: 5,
    issueType: "Street Light",
  },
  {
    name: "Anjali Desai",
    location: "Bandra, H-Ward",
    content: "Finally, a platform that shows real transparency. I can track exactly where my complaint is in the process. No more calling helplines repeatedly.",
    rating: 5,
    issueType: "Garbage",
  },
  {
    name: "Mohammed Khan",
    location: "Kurla, L-Ward",
    content: "Reported water logging issue during monsoon. The quick response from authorities prevented a much bigger problem. Great initiative for Mumbai.",
    rating: 5,
    issueType: "Water Issue",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 sm:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">Testimonials</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Trusted by Mumbai Citizens
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            See what residents are saying about their experience using BrihanMumbai Fix.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-border/50">
              <CardContent className="p-6">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-primary text-primary" />
                  ))}
                </div>
                
                {/* Quote */}
                <p className="text-foreground leading-relaxed mb-6">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                
                {/* Author */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                  <Badge variant="outline">{testimonial.issueType}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
