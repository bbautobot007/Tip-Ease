import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateEvent, useListVendors, getListEventsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar as CalendarIcon, MapPin, Users, Building2, Search } from "lucide-react";

const eventSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  eventType: z.enum(["private_party", "wedding", "corporate", "restaurant", "public_event", "other"]),
  venueName: z.string().min(2, "Venue name is required"),
  venueAddress: z.string().min(5, "Venue address is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  expectedGuests: z.coerce.number().min(1, "Expected guests must be at least 1").optional(),
  perGuestCap: z.coerce.number().min(1, "Cap must be at least $1").optional(),
  vendorId: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function CreateEventPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createEvent = useCreateEvent();
  
  const [vendorSearch, setVendorSearch] = useState("");
  const { data: vendors, isLoading: loadingVendors } = useListVendors({ query: { q: vendorSearch } });

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      eventType: "private_party",
      venueName: "",
      venueAddress: "",
      startTime: "",
      endTime: "",
      expectedGuests: undefined,
      perGuestCap: undefined,
      vendorId: undefined,
    }
  });

  const onSubmit = async (data: EventFormValues) => {
    try {
      // Ensure times are properly formatted as ISO strings if they are datetime-local
      const startTime = new Date(data.startTime).toISOString();
      const endTime = new Date(data.endTime).toISOString();

      const event = await createEvent.mutateAsync({
        data: {
          ...data,
          startTime,
          endTime,
        }
      });

      queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
      
      toast({
        title: "Event Created",
        description: "Your event has been successfully created.",
      });

      setLocation(`/host/events/${event.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create event. Please try again.",
      });
    }
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
        <p className="text-muted-foreground">Set up a new tipping event and invite vendors.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Basic information about the event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Smith Wedding Reception" {...field} data-testid="input-event-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-event-type">
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="private_party">Private Party</SelectItem>
                          <SelectItem value="wedding">Wedding</SelectItem>
                          <SelectItem value="corporate">Corporate Event</SelectItem>
                          <SelectItem value="restaurant">Restaurant/Bar</SelectItem>
                          <SelectItem value="public_event">Public Event</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expectedGuests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Guests (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="150" {...field} value={field.value || ''} data-testid="input-expected-guests" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-start-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-end-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Where is this event taking place?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="venueName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="e.g. The Grand Hotel" {...field} data-testid="input-venue-name" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="venueAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, City, State" {...field} data-testid="input-venue-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipping Settings</CardTitle>
              <CardDescription>Configure how guests can tip at this event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="perGuestCap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Tip Per Guest (Optional)</FormLabel>
                    <FormDescription>Set a cap on how much a single guest can tip for the duration of the event.</FormDescription>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                        <Input type="number" className="pl-7" placeholder="50.00" {...field} value={field.value || ''} data-testid="input-per-guest-cap" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Assign Vendor (Optional)</FormLabel>
                    <FormDescription>Select the vendor or service staff that will receive tips. You can do this later.</FormDescription>
                    
                    <div className="border rounded-md p-4 space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search vendors by name..." 
                          className="pl-9"
                          value={vendorSearch}
                          onChange={(e) => setVendorSearch(e.target.value)}
                        />
                      </div>
                      
                      <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                        {loadingVendors ? (
                          <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                        ) : vendors && vendors.length > 0 ? (
                          vendors.map(vendor => (
                            <div 
                              key={vendor.id}
                              className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${field.value === vendor.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                              onClick={() => field.onChange(field.value === vendor.id ? undefined : vendor.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-full">
                                  <Building2 className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{vendor.companyName}</p>
                                  <p className="text-xs text-muted-foreground">{vendor.contactName}</p>
                                </div>
                              </div>
                              {field.value === vendor.id && (
                                <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">No vendors found.</p>
                        )}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-4 border-t p-6">
              <Button type="button" variant="ghost" onClick={() => setLocation("/host/events")}>
                Cancel
              </Button>
              <Button type="submit" disabled={createEvent.isPending} data-testid="button-submit-event">
                {createEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Event
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
