import { useGetVendorDashboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { DollarSign, Calendar, Star, Receipt, ArrowRight } from "lucide-react";

export default function VendorDashboard() {
  const { data: dashboard, isLoading } = useGetVendorDashboard();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Vendor Dashboard</h1>
          <p className="text-muted-foreground">Track your tips and upcoming events.</p>
        </div>
        {dashboard.pendingEvents > 0 && (
          <Button asChild variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90" data-testid="button-pending-events">
            <Link href="/vendor/events">
              {dashboard.pendingEvents} Pending Invite{dashboard.pendingEvents !== 1 ? 's' : ''}
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Today's Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary" data-testid="text-today-earnings">${dashboard.todayEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-earnings">${dashboard.totalEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-events">{dashboard.totalEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rating</CardTitle>
            <Star className="h-4 w-4 text-accent fill-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-rating">
              {dashboard.rating ? dashboard.rating.toFixed(1) : "New"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-secondary" />
              Live Tip Feed
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-sm" data-testid="link-view-earnings">
              <Link href="/vendor/earnings">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            {dashboard.recentTips.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                <Receipt className="h-12 w-12 opacity-20 mb-4" />
                <p>No tips yet today.</p>
                <p className="text-sm">They'll show up here instantly!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard.recentTips.map((tip) => (
                  <div key={tip.id} className="flex justify-between items-center p-3 rounded-lg border bg-card/50 hover:bg-muted transition-colors">
                    <div>
                      <p className="font-medium text-foreground">Guest</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{tip.eventName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-secondary text-lg">+${tip.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tip.createdAt), "h:mm a")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.pendingEvents === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <p>You're all caught up!</p>
                <p className="text-sm mt-1">No pending event invitations.</p>
              </div>
            ) : (
              <div className="text-center py-8 bg-accent/10 rounded-xl border border-accent/20">
                <h3 className="text-lg font-semibold mb-2 text-foreground">New Invitations!</h3>
                <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
                  You have {dashboard.pendingEvents} pending event invitation{dashboard.pendingEvents !== 1 ? 's' : ''} from hosts.
                </p>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/vendor/events">Review Invitations</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
