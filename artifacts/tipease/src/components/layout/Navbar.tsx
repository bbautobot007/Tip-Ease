import { Link, useLocation } from "wouter";
import { Show, useClerk } from "@clerk/react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Menu, X, Bell, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  const { data: userProfile } = useGetMe();

  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
    setLocation("/");
  };

  const navLinks = [
    { label: "Dashboard", href: userProfile?.role ? `/${userProfile.role}` : "/", show: "signed-in" },
    { label: "Wallet", href: "/guest/wallet", show: "signed-in", role: "guest" },
    { label: "History", href: "/guest/history", show: "signed-in", role: "guest" },
    { label: "Events", href: "/host/events", show: "signed-in", role: "host" },
    { label: "Vendors", href: "/host/vendors", show: "signed-in", role: "host" },
    { label: "Events", href: "/vendor/events", show: "signed-in", role: "vendor" },
    { label: "Earnings", href: "/vendor/earnings", show: "signed-in", role: "vendor" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2"
          data-testid="link-home-logo"
        >
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            TipEase
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Show when="signed-in">
            {navLinks
              .filter((link) => !link.role || link.role === userProfile?.role)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === link.href ? "text-primary" : "text-muted-foreground"
                  }`}
                  data-testid={`link-nav-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </Link>
              ))}

            <div className="flex items-center gap-4 ml-4 pl-4 border-l">
              <Link
                href="/notifications"
                className="text-muted-foreground hover:text-foreground transition-colors relative"
                data-testid="link-nav-notifications"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <Link
                href="/profile"
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-nav-profile"
              >
                <UserIcon className="h-5 w-5" />
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} data-testid="button-nav-signout">
                Sign Out
              </Button>
            </div>
          </Show>
          <Show when="signed-out">
            <div className="flex items-center gap-4">
              <Link
                href="/sign-in"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-nav-signin"
              >
                Sign In
              </Link>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-nav-signup">
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </Show>
        </div>

        {/* Mobile Navigation Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <Show when="signed-in">
            <Link
              href="/notifications"
              className="text-muted-foreground"
              data-testid="link-mobile-notifications"
            >
              <Bell className="h-5 w-5" />
            </Link>
          </Show>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-foreground p-2"
            data-testid="button-mobile-menu-toggle"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b shadow-lg animate-in slide-in-from-top-2">
          <div className="flex flex-col p-4 gap-4">
            <Show when="signed-in">
              {navLinks
                .filter((link) => !link.role || link.role === userProfile?.role)
                .map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-base font-medium py-2 ${
                      location === link.href ? "text-primary" : "text-muted-foreground"
                    }`}
                    onClick={() => setIsOpen(false)}
                    data-testid={`link-mobile-nav-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </Link>
                ))}
              <div className="h-px bg-border my-2" />
              <Link
                href="/profile"
                className="text-base font-medium py-2 text-muted-foreground"
                onClick={() => setIsOpen(false)}
                data-testid="link-mobile-profile"
              >
                Profile Settings
              </Link>
              <button
                className="text-left text-base font-medium py-2 text-destructive"
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
                data-testid="button-mobile-signout"
              >
                Sign Out
              </button>
            </Show>
            <Show when="signed-out">
              <Link
                href="/sign-in"
                className="text-base font-medium py-2 text-muted-foreground"
                onClick={() => setIsOpen(false)}
                data-testid="link-mobile-signin"
              >
                Sign In
              </Link>
              <Button asChild className="w-full mt-2" data-testid="button-mobile-signup">
                <Link href="/sign-up" onClick={() => setIsOpen(false)}>
                  Get Started
                </Link>
              </Button>
            </Show>
          </div>
        </div>
      )}
    </nav>
  );
}
