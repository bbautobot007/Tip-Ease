import { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetEvent, 
  useUpdateEvent, 
  useGenerateQrCode,
  useGetEventQrCode,
  useRevokeEventQrCode,
  useGetEventTips,
  getGetEventQueryKey,
  getGetEventQrCodeQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, Building2, QrCode as QrCodeIcon, DollarSign, Download, Ban, Clock, CheckCircle2 } from "lucide-react";

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: event, isLoading: loadingEvent } = useGetEvent(eventId!);
  const { data: qrCode, isLoading: loadingQr } = useGetEventQrCode(eventId!);
  const { data: tips, isLoading: loadingTips } = useGetEventTips(eventId!);
  
  const updateEvent = useUpdateEvent();
  const generateQr = useGenerateQrCode();
  const revokeQr = useRevokeEventQrCode();

  const handleGenerateQr = async () => {
    try {
      await generateQr.mutateAsync({ data: { eventId: eventId! } });
      queryClient.invalidateQueries({ queryKey: getGetEventQrCodeQueryKey(eventId!) });
      toast({ title: "QR Code Generated", description: "The QR code is now ready to be displayed or printed." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to generate QR code." });
    }
  };

  const handleRevokeQr = async () => {
    try {
      if (qrCode) {
        await revokeQr.mutateAsync({ id: qrCode.id });
        queryClient.invalidateQueries({ queryKey: getGetEventQrCodeQueryKey(eventId!) });
        toast({ title: "QR Code Revoked", description: "The QR code has been disabled." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to revoke QR code." });
    }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      await updateEvent.mutateAsync({
        id: eventId!,
        data: { status: status as any }
      });
      queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(eventId!) });
      toast({ title: "Status Updated", description: `Event status changed to ${status.replace('_', ' ')}.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update status." });
    }
  };

  if (loadingEvent) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full rounded-xl md:col-span-2" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!event) return <div className="p-8 text-center">Event not found</div>;

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
      <div className="flex items-center gap-2 mb-2">
        <Link href="/host/events" className="text-sm text-muted-foreground hover:text-foreground">
          Events
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{event.name}</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{event.name}</h1>
            <Badge variant="outline" className={`capitalize ${getStatusColor(event.status)} border-transparent`}>
              {event.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center"><Calendar className="mr-1 h-4 w-4" /> {format(new Date(event.startTime), "MMM d, yyyy")}</span>
            <span className="flex items-center"><MapPin className="mr-1 h-4 w-4" /> {event.venueName}</span>
            {event.expectedGuests && (
              <span className="flex items-center"><Users className="mr-1 h-4 w-4" /> {event.expectedGuests} guests</span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {event.status === 'confirmed' && (
            <Button onClick={() => handleStatusUpdate('active')} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground" data-testid="button-start-event">
              Start Event
            </Button>
          )}
          {event.status === 'active' && (
            <Button onClick={() => handleStatusUpdate('ended')} variant="outline" data-testid="button-end-event">
              End Event
            </Button>
          )}
          {(event.status === 'draft' || event.status === 'pending_vendor') && (
            <Button onClick={() => handleStatusUpdate('cancelled')} variant="destructive" size="sm" data-testid="button-cancel-event">
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Schedule</p>
                  <p className="text-sm">{format(new Date(event.startTime), "MMM d, yyyy • h:mm a")} -<br/>{format(new Date(event.endTime), "h:mm a")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
                  <p className="text-sm">{event.venueName}<br/>{event.venueAddress}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Tipping Cap</p>
                  <p className="text-sm">{event.perGuestCap ? `$${event.perGuestCap.toFixed(2)} per guest` : 'No limit'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Vendor Status</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {event.vendorName ? (
                      <span className="text-sm font-medium">
                        {event.vendorName} 
                        {event.vendorConfirmed ? (
                          <Badge variant="secondary" className="ml-2 bg-secondary/20 text-secondary hover:bg-secondary/20">Confirmed</Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2">Pending</Badge>
                        )}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">No vendor assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Live Tips</CardTitle>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Raised</p>
                <p className="text-2xl font-bold text-primary">${event.totalTips.toFixed(2)}</p>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTips ? (
                <div className="space-y-2">
                  {[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : tips && tips.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {tips.map(tip => (
                    <div key={tip.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Guest Tip</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(tip.createdAt), "h:mm a")}</p>
                        </div>
                      </div>
                      <div className="font-bold text-foreground">
                        +${tip.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tips received yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCodeIcon className="h-5 w-5 text-primary" />
                Tipping QR Code
              </CardTitle>
              <CardDescription>
                Guests scan this code to tip the vendor.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center">
              {loadingQr ? (
                <Skeleton className="h-48 w-48 rounded-xl" />
              ) : qrCode && qrCode.status === 'active' ? (
                <div className="space-y-4 w-full">
                  <div className="bg-white p-4 rounded-xl border-2 border-border shadow-sm inline-block w-full">
                    <img src={qrCode.qrCodeUrl} alt="Event QR Code" className="w-full h-auto mx-auto" />
                  </div>
                  <div className="bg-muted p-2 rounded text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Manual Entry Code</p>
                    <p className="font-mono text-lg font-bold tracking-widest">{qrCode.token}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button className="w-full" variant="outline" data-testid="button-download-qr">
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive" data-testid="button-revoke-qr">
                          <Ban className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Revoke QR Code?</DialogTitle>
                          <DialogDescription>
                            This will immediately disable the current QR code. Guests will no longer be able to scan it to tip.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="destructive" onClick={handleRevokeQr}>Revoke</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ) : (
                <div className="py-8 space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <QrCodeIcon className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {!event.vendorId 
                      ? "Assign a vendor first to generate a QR code." 
                      : !event.vendorConfirmed 
                        ? "Waiting for vendor to confirm before generating QR code."
                        : "Generate a unique QR code for this event."}
                  </p>
                  <Button 
                    onClick={handleGenerateQr} 
                    disabled={!event.vendorId || !event.vendorConfirmed || generateQr.isPending}
                    className="w-full"
                    data-testid="button-generate-qr"
                  >
                    Generate QR Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
