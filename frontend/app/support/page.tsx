import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Github, LifeBuoy } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                <LifeBuoy className="h-6 w-6 text-primary" />
                Support
              </CardTitle>
              <CardDescription>
                Need help with account access, complaint submission, or tracking?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link
                href="mailto:support@brihanmumbaifix.in"
                className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/40 transition-colors"
              >
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Email Support</p>
                  <p className="text-sm text-muted-foreground">support@brihanmumbaifix.in</p>
                </div>
              </Link>

              <Link
                href="https://github.com/prashantshirk/brihanmumbai-fix"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/40 transition-colors"
              >
                <Github className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">GitHub Repository</p>
                  <p className="text-sm text-muted-foreground">Report issues and track updates</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
