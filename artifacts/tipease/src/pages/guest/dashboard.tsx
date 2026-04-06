import { Link } from "wouter";
import { useGetGuestDashboard } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, Wallet, ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

export default function GuestDashboard() {
  const { data: dashboard, isLoading } = useGetGuestDashboard();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8 animate-pulse">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const limitPercentage = dashboard.dailyLimit > 0
    ? (dashboard.dailyUsed / dashboard.dailyLimit) * 100
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Guest Dashboard</h1>
          <p className="text-muted-foreground">Welcome back. Ready to tip?</p>
        </div>
        <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/20" data-testid="button-scan-qr">
          <Link href="/guest/scan">
            <QrCode className="mr-2 h-5 w-5" />
            Scan to Tip
          </Link>
        </Button>
      </div>

      {/* Main Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Wallet className="h-32 w-32" />
        </div>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Available Balance</p>
              <h2 className="text-5xl md:text-6xl font-bold text-foreground tracking-tighter" data-testid="text-wallet-balance">
                ${dashboard.walletBalance.toFixed(2)}
              </h2>
            </div>

            <div className="w-full md:w-1/3 bg-background/50 backdrop-blur rounded-xl p-4 border border-border/50">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Daily Limit</span>
                <span className="font-medium text-foreground">
                  ${dashboard.dailyUsed.toFixed(2)} / ${dashboard.dailyLimit.toFixed(2)}
                </span>
              </div>
              <Progress value={limitPercentage} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground text-right">
                ${dashboard.dailyRemaining.toFixed(2)} remaining today
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Button asChild variant="outline" className="bg-background/50 backdrop-blur" data-testid="button-add-funds">
              <Link href="/guest/wallet">Add Funds</Link>
            </Button>
            <Button asChild variant="ghost" data-testid="button-view-history">
              <Link href="/guest/history">View History</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
              Your Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-foreground mb-1">{dashboard.tipCount}</p>
                <p className="text-sm text-muted-foreground">Tips Sent</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-foreground mb-1">${dashboard.totalTipsSent.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Tipped</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Tips */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Clock className="mr-2 h-5 w-5 text-secondary" />
              Recent Activity
            </CardTitle>
            <Link
              href="/guest/history"
              className="text-sm text-primary hover:underline flex items-center"
              data-testid="link-all-activity"
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {dashboard.recentTips.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>No tips sent yet.</p>
                <p className="text-sm mt-1">Scan a QR code at your next event to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard.recentTips.map((tip) => (
                  <div key={tip.id} className="flex justify-between items-center p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-foreground">{tip.vendorName}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{tip.eventName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">${tip.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tip.createdAt), "MMM d, h:mm a")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
