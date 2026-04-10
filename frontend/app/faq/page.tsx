import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How do I report an issue?",
    a: "Go to Report Issue, upload an image, review AI-generated details, add location and ward, then submit.",
  },
  {
    q: "Do I need an account to report?",
    a: "Yes. You need to log in or create an account to submit and track complaints.",
  },
  {
    q: "How is issue severity decided?",
    a: "Severity is suggested by AI from the uploaded image and context. You can review before final submission.",
  },
  {
    q: "Can I track complaint status later?",
    a: "Yes. Use Dashboard for your reports or Track page with complaint ID for status updates.",
  },
  {
    q: "Who receives the complaint?",
    a: "The system routes complaints to the appropriate municipal department based on issue type and ward.",
  },
  {
    q: "What data is stored?",
    a: "Complaint details, location, timestamps, and status. Auth tokens are stored in secure httpOnly cookies.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">Frequently Asked Questions</CardTitle>
              <CardDescription>
                Quick answers about reporting, tracking, and platform behavior.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((item, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent>{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
