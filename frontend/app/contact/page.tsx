import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Github, Linkedin, Instagram } from "lucide-react";

const contacts = [
  {
    label: "Email",
    value: "contact@brihanmumbaifix.in",
    href: "mailto:contact@brihanmumbaifix.in",
    icon: Mail,
  },
  {
    label: "GitHub",
    value: "github.com/prashantshirk/brihanmumbai-fix",
    href: "https://github.com/prashantshirk/brihanmumbai-fix",
    icon: Github,
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/company/brihanmumbaifix",
    href: "https://www.linkedin.com",
    icon: Linkedin,
  },
  {
    label: "Instagram",
    value: "@brihanmumbaifix",
    href: "https://www.instagram.com",
    icon: Instagram,
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">Contact</CardTitle>
              <CardDescription>
                Reach out for support, collaboration, or official communication.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {contacts.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="rounded-lg border p-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground break-all">{item.value}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
