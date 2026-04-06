import { useState } from "react";
import { Link } from "wouter";
import { useGetVendorEvents } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Building2, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VendorEventsPage() {
  const { data: events, isLoading } = useGetVendorEvents();
  const [activeTab, setActiveTab] = useState("upcoming");

  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-12 w-full max-w-md rounded-lg mb-6" />
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Group events by status
  const pendingEvents = events?.filter(e => e.status === 'pending_vendor') || [];
  const upcomingEvents = events?.filter(e => ['confirmed', 'active'].includes(e.status)) || [];
  const pastEvents = events?.filter(e => ['ended', 'cancelled'].includes(e.status)) || [];

  const renderEventList = (eventList: typeof events, emptyMessage: string) => {
    if (!eventList || eventList.length === 0) {
      return (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4">
        {eventList.map(event => (
          <Link key={event.id} href={`/vendor/events/${event.id}`}>
            <Card className={`hover:border-primary/50 transition-colors cursor-pointer group ${event.status === 'pending_vendor' ? 'border-accent/50 bg-accent/5' : ''}`} data-testid={`card-event-${event.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold group-hover:text-primary transition-colors">{event.name}</h2>
                      {event.status === 'pending_vendor' && (
                        <Badge variant="default" className="bg-accent text-accent-foreground border-transparent animate-in fade-in zoom-in">
                          New Invite
                        </Badge>
                      )}
                      {event.status === 'active' && (
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground border-transparent">
                          Live Now
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary/70" />
                        <span className="font-medium text-foreground">{format(new Date(event.startTime), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary/70" />
                        <span>{format(new Date(event.startTime), "h:mm a")} - {format(new Date(event.endTime), "h:mm a")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary/70" />
                        <span className="truncate">{event.venueName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary/70" />
                        <span className="truncate">Host: {event.hostName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col justify-between items-end md:justify-center border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 md:min-w-[140px]">
                    {['ended', 'active'].includes(event.status) ? (
                      <div className="text-center w-full">
                        <div className="text-sm text-muted-foreground mb-1">Tips Received</div>
                        <div className="text-2xl font-bold text-foreground">${event.totalTips.toFixed(2)}</div>
                      </div>
                    ) : event.status === 'pending_vendor' ? (
                      <Button variant="default" className="w-full bg-foreground text-background hover:bg-foreground/90" size="sm">
                        Review Invite
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center w-full gap-2 text-sm font-medium text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                        Confirmed
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
        <p className="text-muted-foreground">Manage your event schedule and invitations.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="pending" className="relative" data-testid="tab-pending">
            Invitations
            {pendingEvents.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {pendingEvents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">Upcoming / Live</TabsTrigger>
          <TabsTrigger value="past" data-testid="tab-past">Past Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-0 focus-visible:outline-none">
          {renderEventList(pendingEvents, "No pending invitations at the moment.")}
        </TabsContent>
        
        <TabsContent value="upcoming" className="mt-0 focus-visible:outline-none">
          {renderEventList(upcomingEvents, "No upcoming events scheduled. Make sure your profile is complete to attract hosts!")}
        </TabsContent>
        
        <TabsContent value="past" className="mt-0 focus-visible:outline-none">
          {renderEventList(pastEvents, "No past events found.")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
