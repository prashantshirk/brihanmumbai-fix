"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { hasUserSession, logout } from "@/lib/auth";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = hasUserSession();
  const isDashboardView = pathname.startsWith("/dashboard");

  function handleReportClick(e: React.MouseEvent) {
    e.preventDefault();
    router.push(isLoggedIn ? "/report" : "/login");
  }

  async function handleLogout() {
    await logout();
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">BM</span>
            </div>
            <span className="font-semibold text-lg">BrihanMumbai Fix</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {!isDashboardView && (
              <>
                <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
                <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </>
            )}
            <Link href="/feed" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Community
            </Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {isDashboardView ? (
              <Button variant="outline" onClick={handleLogout} className="inline-flex items-center gap-2">
                <LogOut className="size-4" />
                Logout
              </Button>
            ) : (
              <Button onClick={handleReportClick}>Report Issue</Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {!isDashboardView && (
                <>
                  <Link
                    href="#features"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    How It Works
                  </Link>
                </>
              )}
              <Link
                href="/feed"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Community
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {isDashboardView ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="size-4 mr-2" />
                    Logout
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      handleReportClick(e);
                      setMobileMenuOpen(false);
                    }}
                  >
                    Report Issue
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
