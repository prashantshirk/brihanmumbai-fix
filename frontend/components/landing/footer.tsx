import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  platform: {
    title: "Platform",
    links: [
      { label: "Report Issue", href: "/report" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Community Feed", href: "/feed" },
      { label: "Track Complaint", href: "/track" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "FAQs", href: "/faq" },
      { label: "Support", href: "/support" },
      { label: "API Documentation", href: "/docs" },
    ],
  },
  organization: {
    title: "Organization",
    links: [
      { label: "About MCGM", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Ward Offices", href: "/wards" },
      { label: "Authority Portal", href: "/admin/login" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
};

const wards = [
  "A", "B", "C", "D", "E", "F/N", "F/S", "G/N", "G/S", 
  "H/E", "H/W", "K/E", "K/W", "L", "M/E", "M/W", 
  "N", "P/N", "P/S", "R/C", "R/N", "R/S", "S", "T"
];

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">BM</span>
                </div>
                <span className="font-semibold text-lg">BrihanMumbai Fix</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A citizen-government collaboration platform for reporting and resolving civic issues across Mumbai.
              </p>
            </div>

            {/* Links */}
            {Object.values(footerLinks).map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold mb-4">{section.title}</h3>
                <ul className="flex flex-col gap-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Wards Section */}
        <div className="py-8">
          <h3 className="text-sm font-semibold mb-4">Mumbai Wards Covered</h3>
          <div className="flex flex-wrap gap-2">
            {wards.map((ward) => (
              <span
                key={ward}
                className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground"
              >
                {ward}-Ward
              </span>
            ))}
          </div>
        </div>

        <Separator />

        {/* Bottom Bar */}
        <div className="py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} BrihanMumbai Municipal Corporation. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built for a cleaner, safer Mumbai
          </p>
        </div>
      </div>
    </footer>
  );
}
