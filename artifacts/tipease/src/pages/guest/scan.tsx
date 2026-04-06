import { useState } from "react";
import { useLocation } from "wouter";
import { useValidateQrCode, getValidateQrCodeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Camera, QrCode, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ScanPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [isScanning, setIsScanning] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleValidate = async (token: string) => {
    if (!token.trim()) return;
    
    setIsValidating(true);
    try {
      // In a real app we might use a mutation or fetch directly, 
      // but here we can pre-fetch the query to check validity before routing
      const result = await queryClient.fetchQuery({
        queryKey: getValidateQrCodeQueryKey(token),
        queryFn: () => fetch(`/api/qrcodes/validate/${token}`).then(r => r.json())
      });

      if (result.valid) {
        setLocation(`/guest/tip/${token}`);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid Code",
          description: result.message || "This QR code is invalid or has expired.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to validate code. Please try again.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleValidate(tokenInput);
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex flex-col bg-background">
      <div className="flex-1 container mx-auto px-4 py-8 max-w-md flex flex-col justify-center">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Scan to Tip</h1>
          <p className="text-muted-foreground">Scan the event's QR code or enter the code manually below.</p>
        </div>

        <Card className="border-2 shadow-xl mb-8 overflow-hidden relative">
          {/* Mock Camera Viewfinder */}
          {isScanning ? (
            <div className="aspect-[3/4] bg-black relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20"></div>
              
              {/* Scanning brackets */}
              <div className="relative w-64 h-64">
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
                
                {/* Animated scan line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_10px_2px_rgba(20,184,166,0.7)] animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>

              <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-white/80 text-sm font-medium bg-black/50 inline-block px-4 py-2 rounded-full backdrop-blur-sm">
                  Point camera at QR code
                </p>
              </div>
            </div>
          ) : (
            <div className="aspect-[3/4] bg-muted flex flex-col items-center justify-center p-6 text-center">
              <Camera className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium mb-4">Camera access disabled or unavailable.</p>
              <Button variant="outline" onClick={() => setIsScanning(true)}>
                Try Camera Again
              </Button>
            </div>
          )}
        </Card>

        {/* Manual Entry */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center">
              <QrCode className="mr-2 h-5 w-5" />
              Manual Entry
            </CardTitle>
            <CardDescription>Enter the code found below the QR code</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="flex gap-2">
              <Input 
                placeholder="e.g. EVT-12345" 
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                className="uppercase font-mono"
                data-testid="input-manual-token"
              />
              <Button 
                type="submit" 
                disabled={!tokenInput.trim() || isValidating}
                data-testid="button-submit-token"
              >
                {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
