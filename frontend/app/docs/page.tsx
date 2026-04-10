import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">API Documentation</CardTitle>
              <CardDescription>
                BrihanMumbai Fix API overview and request/response behavior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <div className="space-y-2">
                <h3 className="font-semibold">Base URL</h3>
                <code className="inline-block rounded bg-muted px-2 py-1">
                  {process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}
                </code>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold">Authentication Model</h3>
                <p className="text-muted-foreground">
                  Login and register endpoints set secure httpOnly cookies on the backend. Frontend requests use
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5">credentials: &apos;include&apos;</code>
                  so cookies are sent automatically.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Key Endpoints</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>POST /api/auth/register, POST /api/auth/login, GET /api/auth/me</li>
                  <li>POST /api/complaints, GET /api/complaints, GET /api/complaints/&lt;id&gt;</li>
                  <li>GET /api/feed/preview (public), GET /api/feed (protected)</li>
                  <li>POST /api/admin/login, GET /api/admin/complaints, PATCH /api/admin/complaints/&lt;id&gt;/status</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Response Shape</h3>
                <p className="text-muted-foreground">
                  Most endpoints return JSON with success/error patterns consumed by frontend API helpers in
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5">lib/api.ts</code>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
