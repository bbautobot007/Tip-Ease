import { Link } from "wouter";
import { useGetHostDashboard } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Plus, DollarSign, Building2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function HostDashboard() {
  const { data: dashboard, isLoading } = useGetHostDashboard();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Host Dashboard</h1>
          <p className="text-muted-foreground">Manage your events and track performance.</p>
        </div>
        <Button asChild size="lg" className="rounded-full" data-testid="button-create-event">
          <Link href="/host/events/create">
            <Plus className="mr-2 h-5 w-5" />
            Create Event
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-events">{dashboard.totalEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Events</CardTitle>
            <div className="h-4 w-4 rounded-full bg-secondary/20 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-active-events">{dashboard.activeEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tips Generated</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-tips">${dashboard.totalTipsGenerated.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Vendors</CardTitle>
            <Building2 className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-pending-vendors">{dashboard.pendingVendorConfirmations}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Recent Events</CardTitle>
          <Button asChild variant="outline" size="sm" data-testid="button-view-all-events">
            <Link href="/host/events">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {dashboard.recentEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="mx-auto h-12 w-12 opacity-20 mb-4" />
              <p>No events yet.</p>
              <Button asChild variant="link" className="text-primary mt-2">
                <Link href="/host/events/create">Create your first event</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboard.recentEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/host/events/${event.id}`}
                  className="block p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  data-testid={`link-event-${event.id}`}
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{event.name}</h3>
                      <p className="text-sm text-muted-foreground">{event.venueName} • {format(new Date(event.startTime), "MMM d, yyyy")}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">${event.totalTips.toFixed(2)} raised</p>
                        <p className="text-xs text-muted-foreground">{event.tipCount} tips</p>
                      </div>
                      <Badge variant={
                        event.status === 'active' ? 'default' :
                        event.status === 'draft' ? 'secondary' :
                        'outline'
                      }>
                        {event.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
