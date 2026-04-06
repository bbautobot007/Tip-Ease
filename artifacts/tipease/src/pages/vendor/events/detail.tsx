import { useParams, Link } from "wouter";
import { 
  useGetEvent, 
  useConfirmEventVendor,
  useGetEventTips,
  getGetEventQueryKey,
  getGetVendorEventsQueryKey,
  getGetVendorDashboardQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Building2, DollarSign, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VendorEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: event, isLoading: loadingEvent } = useGetEvent(eventId!);
  const { data: tips, isLoading: loadingTips } = useGetEventTips(eventId!);
  
  const confirmVendor = useConfirmEventVendor();

  const handleConfirmation = async (confirmed: boolean) => {
    try {
      await confirmVendor.mutateAsync({
        id: eventId!,
        data: { confirmed }
      });
      
      queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(eventId!) });
      queryClient.invalidateQueries({ queryKey: getGetVendorEventsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetVendorDashboardQueryKey() });
      
      toast({ 
        title: confirmed ? "Event Confirmed" : "Event Declined", 
        description: confirmed ? "You have successfully accepted the invitation." : "You have declined the invitation." 
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to process response." });
    }
  };

  if (loadingEvent) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!event) return <div className="p-8 text-center">Event not found</div>;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/vendor/events" className="text-sm text-muted-foreground hover:text-foreground">
          Events
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{event.name}</span>
      </div>

      <Card className="overflow-hidden border-t-4 border-t-primary shadow-sm">
        <div className="bg-muted/30 p-6 md:p-8 border-b">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{event.name}</h1>
                {event.status === 'pending_vendor' && <Badge className="bg-accent text-accent-foreground border-transparent">Invitation</Badge>}
                {event.status === 'confirmed' && <Badge className="bg-primary text-primary-foreground border-transparent">Confirmed</Badge>}
                {event.status === 'active' && <Badge className="bg-secondary text-secondary-foreground border-transparent animate-pulse">Live Now</Badge>}
              </div>
              <p className="text-muted-foreground flex items-center mt-4">
                <Building2 className="mr-2 h-5 w-5 text-primary" /> Hosted by {event.hostName}
              </p>
            </div>
            
            {['active', 'ended'].includes(event.status) && (
              <div className="bg-card border rounded-xl p-4 text-center min-w-[150px] shadow-sm">
                <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Tips</p>
                <p className="text-3xl font-bold text-primary">${event.totalTips.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Event Details</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Calendar className="mr-3 h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">{format(new Date(event.startTime), "EEEE, MMMM d, yyyy")}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.startTime), "h:mm a")} to {format(new Date(event.endTime), "h:mm a")}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <MapPin className="mr-3 h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">{event.venueName}</p>
                      <p className="text-sm text-muted-foreground">{event.venueAddress}</p>
                    </div>
                  </li>
                </ul>
              </div>

              {event.status === 'pending_vendor' && (
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 mt-8 animate-in fade-in zoom-in duration-300">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-accent" /> Action Required
                  </h4>
                  <p className="text-sm text-muted-foreground mb-6">
                    You've been invited to provide services for this event. Please confirm or decline this invitation.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      className="flex-1 bg-foreground text-background hover:bg-foreground/90" 
                      onClick={() => handleConfirmation(true)}
                      disabled={confirmVendor.isPending}
                      data-testid="button-accept-invite"
                    >
                      {confirmVendor.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Accept Invite
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => handleConfirmation(false)}
                      disabled={confirmVendor.isPending}
                      data-testid="button-decline-invite"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-muted/20 rounded-xl border p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-secondary" />
                Live Tip Feed
              </h3>
              
              <div className="flex-1">
                {['draft', 'pending_vendor', 'confirmed'].includes(event.status) ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                    <Clock className="h-10 w-10 opacity-20 mb-3" />
                    <p className="font-medium">Not started yet</p>
                    <p className="text-sm mt-1 max-w-[200px]">Tips will appear here once the event goes live.</p>
                  </div>
                ) : loadingTips ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : tips && tips.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {tips.map(tip => (
                      <div key={tip.id} className="flex justify-between items-center p-3 bg-card rounded-lg border shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Guest Tip</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(tip.createdAt), "h:mm a")}</p>
                          </div>
                        </div>
                        <div className="font-bold text-secondary text-lg">
                          +${tip.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                    <DollarSign className="h-10 w-10 opacity-20 mb-3" />
                    <p className="font-medium">No tips yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
