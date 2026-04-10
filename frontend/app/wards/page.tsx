import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const wardOffices = [
  { ward: "A-Ward", office: "Colaba Municipal Office" },
  { ward: "B-Ward", office: "Mohammed Ali Road Municipal Office" },
  { ward: "C-Ward", office: "Crawford Market Municipal Office" },
  { ward: "D-Ward", office: "Grant Road Municipal Office" },
  { ward: "E-Ward", office: "Byculla Municipal Office" },
  { ward: "F/N-Ward", office: "Matunga Municipal Office" },
  { ward: "F/S-Ward", office: "Parel Municipal Office" },
  { ward: "G/N-Ward", office: "Dadar Municipal Office" },
  { ward: "G/S-Ward", office: "Elphinstone Municipal Office" },
  { ward: "H/E-Ward", office: "Bandra East Municipal Office" },
  { ward: "H/W-Ward", office: "Bandra West Municipal Office" },
  { ward: "K/E-Ward", office: "Andheri East Municipal Office" },
  { ward: "K/W-Ward", office: "Andheri West Municipal Office" },
  { ward: "L-Ward", office: "Kurla Municipal Office" },
  { ward: "M/E-Ward", office: "Govandi Municipal Office" },
  { ward: "M/W-Ward", office: "Chembur Municipal Office" },
  { ward: "N-Ward", office: "Ghatkopar Municipal Office" },
  { ward: "P/N-Ward", office: "Goregaon Municipal Office" },
  { ward: "P/S-Ward", office: "Malad Municipal Office" },
  { ward: "R/C-Ward", office: "Borivali Municipal Office" },
  { ward: "R/N-Ward", office: "Dahisar Municipal Office" },
  { ward: "R/S-Ward", office: "Kandivali Municipal Office" },
  { ward: "S-Ward", office: "Mulund Municipal Office" },
  { ward: "T-Ward", office: "Mulund East Municipal Office" },
];

export default function WardsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">Ward Offices</CardTitle>
              <CardDescription>
                Reference list of Mumbai ward offices and their primary office names.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {wardOffices.map((item) => (
                <div key={item.ward} className="rounded-lg border p-3">
                  <p className="font-medium">{item.ward}</p>
                  <p className="text-sm text-muted-foreground">{item.office}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
