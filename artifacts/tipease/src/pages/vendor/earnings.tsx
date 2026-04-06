import { useGetVendorDashboard, useGetTipHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { DollarSign, ArrowUpRight, Receipt, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EarningsPage() {
  const { data: dashboard, isLoading: loadingDash } = useGetVendorDashboard();
  const { data: tipHistory, isLoading: loadingHistory } = useGetTipHistory();

  if (loadingDash || loadingHistory) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Earnings & Payouts</h1>
          <p className="text-muted-foreground">Track your revenue and withdrawal history.</p>
        </div>
        <Button className="bg-foreground text-background hover:bg-foreground/90" data-testid="button-withdraw">
          <ArrowUpRight className="mr-2 h-4 w-4" />
          Withdraw Funds
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Available to Withdraw</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary mb-1">${dashboard?.pendingPayouts.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Funds clear automatically every 48 hours.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lifetime Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${dashboard?.totalEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">${dashboard?.todayEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-xl flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            Detailed Tip History
          </CardTitle>
          <CardDescription>All tips received across your events.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {tipHistory && tipHistory.length > 0 ? (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {tipHistory.map((tip) => (
                <div key={tip.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-secondary/10 rounded-full hidden sm:block">
                      <DollarSign className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">Guest Tip</h3>
                      <div className="flex items-center text-sm text-muted-foreground mb-1">
                        <Calendar className="mr-1.5 h-3.5 w-3.5" />
                        {tip.eventName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(tip.createdAt), "MMM d, yyyy • h:mm a")}
                      </div>
                    </div>
                  </div>
                  
                  <div className="sm:text-right flex sm:block justify-between items-center w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-0 pt-3 sm:pt-0">
                    <span className="text-sm text-muted-foreground sm:hidden">Amount</span>
                    <span className="text-2xl font-bold text-foreground">
                      +${tip.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No earnings yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Tips you receive at events will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
