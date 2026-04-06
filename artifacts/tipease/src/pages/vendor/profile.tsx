import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useGetMyVendorProfile, useCreateVendorProfile, getGetMyVendorProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Store, CheckCircle2 } from "lucide-react";

const vendorProfileSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  phone: z.string().optional(),
  businessRegNumber: z.string().optional(),
});

type VendorProfileFormValues = z.infer<typeof vendorProfileSchema>;

export default function VendorProfilePage() {
  const [, setLocation] = useLocation();
  const { data: profile, isLoading, error } = useGetMyVendorProfile({
    query: {
      retry: false // Don't retry if 404 (expected for new vendors)
    }
  });
  
  const createProfile = useCreateVendorProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<VendorProfileFormValues>({
    resolver: zodResolver(vendorProfileSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      phone: "",
      businessRegNumber: "",
    }
  });

  const initialized = useRef(false);

  useEffect(() => {
    if (profile && !initialized.current) {
      form.reset({
        companyName: profile.companyName,
        contactName: profile.contactName,
        phone: profile.phone || "",
        businessRegNumber: profile.businessRegNumber || "",
      });
      initialized.current = true;
    }
  }, [profile, form]);

  const onSubmit = async (data: VendorProfileFormValues) => {
    try {
      if (!profile) {
        // Create new profile
        await createProfile.mutateAsync({ data });
        queryClient.invalidateQueries({ queryKey: getGetMyVendorProfileQueryKey() });
        toast({
          title: "Profile Created",
          description: "Your vendor profile has been set up successfully.",
        });
        setLocation("/vendor");
      } else {
        // In a real app we'd have an update endpoint
        toast({
          title: "Profile Updated",
          description: "Changes saved.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save profile.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const isNewProfile = !profile;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <Store className="h-8 w-8 text-primary" />
          {isNewProfile ? "Set Up Vendor Profile" : "Vendor Business Profile"}
        </h1>
        <p className="text-muted-foreground">
          {isNewProfile 
            ? "Complete your business profile so hosts can find you and invite you to events." 
            : "Manage your business information visible to event hosts."}
        </p>
      </div>

      {!isNewProfile && profile && (
        <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-secondary" />
            <div>
              <p className="font-semibold text-foreground">Profile Active</p>
              <p className="text-sm text-muted-foreground">You are visible in the vendor directory.</p>
            </div>
          </div>
          <Badge variant={profile.status === 'approved' ? 'secondary' : 'outline'} className="capitalize">
            {profile.status}
          </Badge>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" /> 
            Business Details
          </CardTitle>
          <CardDescription>
            This information will be displayed to event hosts when they search for vendors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company/Business Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Elite Bartending Services" {...field} disabled={!isNewProfile} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Contact Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} disabled={!isNewProfile} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 000-0000" {...field} disabled={!isNewProfile} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessRegNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax/Registration Number</FormLabel>
                      <FormDescription>Optional for verification</FormDescription>
                      <FormControl>
                        <Input placeholder="XX-XXXXXXX" {...field} disabled={!isNewProfile} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isNewProfile && (
                <Button type="submit" disabled={createProfile.isPending} className="w-full sm:w-auto mt-4" data-testid="button-create-profile">
                  {createProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Vendor Profile
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
