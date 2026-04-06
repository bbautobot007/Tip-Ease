import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, QrCode, Shield, Zap, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Hero Section */}
      <section className="relative w-full py-24 md:py-32 lg:py-48 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.png" 
            alt="Intimate dark neon abstract background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
        
        <div className="container px-4 md:px-6 relative z-10 mx-auto flex flex-col items-center text-center space-y-8">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary-foreground backdrop-blur-sm">
            <Sparkles className="mr-2 h-4 w-4 text-accent" />
            <span className="font-medium text-primary-foreground">The new standard in nightlife tipping</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white max-w-4xl">
            Tipping made as easy as a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">high-five.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl font-light">
            Fast, frictionless, and human. Guests scan, confirm, and tip in under 15 seconds without touching cash. It's the app staff love and guests trust.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
            <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-105" data-testid="button-hero-cta">
              <Link href="/sign-up">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm" data-testid="button-hero-signin">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 md:py-32 bg-card border-y border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">How TipEase Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">No apps to download for your guests. Just scan and go.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-2 ring-1 ring-primary/20">
                <QrCode className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">1. Scan</h3>
              <p className="text-muted-foreground">Guest scans the unique QR code provided by the host or vendor at the event.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-secondary/10 flex items-center justify-center mb-2 ring-1 ring-secondary/20">
                <Zap className="h-10 w-10 text-secondary" />
              </div>
              <h3 className="text-2xl font-semibold">2. Select</h3>
              <p className="text-muted-foreground">Guest chooses a tip amount or enters a custom amount from their pre-loaded wallet.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mb-2 ring-1 ring-accent/20">
                <Shield className="h-10 w-10 text-accent" />
              </div>
              <h3 className="text-2xl font-semibold">3. Confirm</h3>
              <p className="text-muted-foreground">Guest enters their 4-digit secure PIN to authorize the transaction instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Built for Everyone</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Whether you're tipping, hosting, or serving, TipEase is tailored to your needs.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Guest */}
            <div className="group rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/50 hover:shadow-md">
              <h3 className="text-2xl font-bold mb-3 text-foreground">Guests</h3>
              <p className="text-muted-foreground mb-6">Leave the cash at home. Pre-load your wallet, set daily limits, and tip effortlessly with a quick scan and PIN.</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-card-foreground"><div className="h-1.5 w-1.5 rounded-full bg-primary mr-2" /> Pre-loaded wallet</li>
                <li className="flex items-center text-sm text-card-foreground"><div className="h-1.5 w-1.5 rounded-full bg-primary mr-2" /> Daily spending limits</li>
                <li className="flex items-center text-sm text-card-foreground"><div className="h-1.5 w-1.5 rounded-full bg-primary mr-2" /> Secure PIN authorization</li>
              </ul>
            </div>
            
            {/* Host */}
            <div className="group rounded-2xl border border-border bg-card p-8 transition-all hover:border-secondary/50 hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-2xl font-bold mb-3 text-foreground">Hosts</h3>
              <p className="text-muted-foreground mb-6">Manage events smoothly. Connect with vendors, generate dynamic QR codes, and monitor tipping activity in real-time.</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-card-foreground"><div className="h-1.5 w-1.5 rounded-full bg-secondary mr-2" /> Event management</li>
                <li className="flex items-center text-sm text-card-foreground"><div className="h-1.5 w-1.5 rounded-full bg-secondary mr-2" /> Vendor directory</li>
                <li className="flex items-center text-sm text-card-foreground"><div className="h-1.5 w-1.5 rounded-full bg-secondary mr-2" /> Dynamic QR generation</li>
              </ul>
            </div>
            
            {/* Vendor */}
            <div className="group rounded-2xl border border-border bg-card p-8 transition-all hover:border-accent/50 hover:shadow-md">
              <h3 className="text-2xl font-bold mb-3 text-foreground">Vendors</h3>
              <p className="text-muted-foreground mb-6">Boost your earnings. Receive tips directly, track performance across events, and get paid out automatically.</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-card-foreground"><div className="h-1.5 w-1.5 rounded-full bg-accent mr-2" /> Live tip feed</li>
                <li className="flex items-center text-sm text-card-foreground"><div className="h-1.5 w-1.5 rounded-full bg-accent mr-2" /> Earnings breakdown</li>
                <li className="flex items-center text-sm text-card-foreground"><div className="h-1.5 w-1.5 rounded-full bg-accent mr-2" /> Event confirmation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 z-0" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Ready to elevate the experience?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">Join thousands of guests, hosts, and vendors who trust TipEase for seamless, cashless tipping.</p>
          <Button asChild size="lg" className="h-14 px-10 text-lg rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold" data-testid="button-footer-cta">
            <Link href="/sign-up">Create an Account</Link>
          </Button>
        </div>
      </section>

      <footer className="bg-card py-10 border-t border-border">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="mb-4 md:mb-0 font-semibold text-foreground">
            TipEase &copy; {new Date().getFullYear()}
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
