import { useState } from "react";
import { Link } from "wouter";
import { useListEvents } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Calendar, MapPin, Building2 } from "lucide-react";
import { format } from "date-fns";

export default function HostEventsPage() {
  const { data: events, isLoading } = useListEvents();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents = events?.filter(event => 
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.vendorName && event.vendorName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-secondary text-secondary-foreground';
      case 'confirmed': return 'bg-primary text-primary-foreground';
      case 'pending_vendor': return 'bg-accent text-accent-foreground';
      case 'ended': return 'bg-muted text-muted-foreground';
      case 'draft': return 'bg-secondary/50 text-secondary-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Manage your tipping events.</p>
        </div>
        <Button asChild data-testid="button-create-event">
          <Link href="/host/events/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search events, venues, or vendors..." 
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : filteredEvents && filteredEvents.length > 0 ? (
        <div className="grid gap-4">
          {filteredEvents.map(event => (
            <Link key={event.id} href={`/host/events/${event.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group" data-testid={`card-event-${event.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold group-hover:text-primary transition-colors">{event.name}</h2>
                        <Badge variant="outline" className={`capitalize ${getStatusColor(event.status)} border-transparent`}>
                          {event.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(event.startTime), "MMM d, yyyy • h:mm a")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{event.venueName}</span>
                        </div>
                        {event.vendorName && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>{event.vendorName} {event.vendorConfirmed ? '(Confirmed)' : '(Pending)'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col justify-between items-end md:justify-center border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Tips Raised</div>
                        <div className="text-2xl font-bold text-foreground">${event.totalTips.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {searchTerm ? "Try adjusting your search query." : "Create your first event to start accepting cashless tips."}
            </p>
            {!searchTerm && (
              <Button asChild variant="outline">
                <Link href="/host/events/create">Create Event</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
