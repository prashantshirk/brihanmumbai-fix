import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">Legal</CardTitle>
              <CardDescription>
                Privacy, terms, cookie policy, and accessibility commitments for BrihanMumbai Fix.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <section id="privacy-policy" className="scroll-mt-24 space-y-2">
                <h2 className="text-lg font-semibold">Privacy Policy</h2>
                <p className="text-muted-foreground">
                  We collect only data required to operate complaint reporting and tracking (profile data, complaint
                  content, location context, and status history). Authentication is cookie-based with secure httpOnly
                  tokens. We do not store auth tokens in browser-accessible storage.
                </p>
              </section>

              <Separator />

              <section id="terms-of-service" className="scroll-mt-24 space-y-2">
                <h2 className="text-lg font-semibold">Terms of Service</h2>
                <p className="text-muted-foreground">
                  By using this platform, you agree to submit accurate civic complaints, avoid abusive or illegal
                  content, and use the service only for legitimate municipal issue reporting.
                </p>
              </section>

              <Separator />

              <section id="cookie-policy" className="scroll-mt-24 space-y-2">
                <h2 className="text-lg font-semibold">Cookie Policy</h2>
                <p className="text-muted-foreground">
                  We use essential cookies for secure authentication and session handling. These cookies are required
                  for account login, route protection, and safe API access.
                </p>
              </section>

              <Separator />

              <section id="accessibility" className="scroll-mt-24 space-y-2">
                <h2 className="text-lg font-semibold">Accessibility</h2>
                <p className="text-muted-foreground">
                  We aim to provide an accessible experience using keyboard-friendly navigation, readable contrast, and
                  semantic UI patterns. If you face accessibility barriers, please contact support for assistance.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
