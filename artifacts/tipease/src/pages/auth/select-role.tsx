import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useGetMe, useSetUserRole } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, Building2, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function SelectRolePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading } = useGetMe();
  const setUserRole = useSetUserRole();
  const [selectedRole, setSelectedRole] = useState<"guest" | "host" | "vendor" | null>(null);

  // If user already has a role, redirect them
  if (!isLoading && userProfile?.role) {
    setLocation(`/${userProfile.role}`);
    return null;
  }

  const handleRoleSelect = async () => {
    if (!selectedRole) return;

    try {
      await setUserRole.mutateAsync({ data: { role: selectedRole } });
      queryClient.invalidateQueries(); // Invalidate everything to refresh user state
      
      toast({
        title: "Role Selected",
        description: `You are now set up as a ${selectedRole}.`,
      });
      
      setLocation(`/${selectedRole}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to set user role. Please try again.",
      });
    }
  };

  if (isLoading) {
    return <div className="flex h-[calc(100dvh-4rem)] items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">Welcome to TipEase</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            To customize your experience, please tell us how you plan to use the app. 
            You can't change this later, so choose carefully.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {/* Guest Role */}
          <Card 
            className={`cursor-pointer transition-all border-2 hover:border-primary/50 ${selectedRole === 'guest' ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border'}`}
            onClick={() => setSelectedRole('guest')}
            data-testid="card-role-guest"
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <UserCircle className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Guest</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground text-sm">
              I want to scan codes and send tips to staff at events.
            </CardContent>
          </Card>

          {/* Host Role */}
          <Card 
            className={`cursor-pointer transition-all border-2 hover:border-secondary/50 ${selectedRole === 'host' ? 'border-secondary ring-2 ring-secondary/20 bg-secondary/5' : 'border-border'}`}
            onClick={() => setSelectedRole('host')}
            data-testid="card-role-host"
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <CalendarDays className="w-8 h-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Host</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground text-sm">
              I organize events and want to set up tipping for the vendors I hire.
            </CardContent>
          </Card>

          {/* Vendor Role */}
          <Card 
            className={`cursor-pointer transition-all border-2 hover:border-accent/50 ${selectedRole === 'vendor' ? 'border-accent ring-2 ring-accent/20 bg-accent/5' : 'border-border'}`}
            onClick={() => setSelectedRole('vendor')}
            data-testid="card-role-vendor"
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-accent" />
              </div>
              <CardTitle className="text-2xl">Vendor</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground text-sm">
              I am a bartending company or service staff that receives tips at events.
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button 
            size="lg" 
            className="w-full md:w-1/2 h-14 text-lg"
            disabled={!selectedRole || setUserRole.isPending}
            onClick={handleRoleSelect}
            data-testid="button-confirm-role"
          >
            {setUserRole.isPending ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
