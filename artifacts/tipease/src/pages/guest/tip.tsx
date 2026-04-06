import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useValidateQrCode, 
  useSendTip, 
  useGetWallet,
  useGetDailyLimit,
  getGetWalletQueryKey,
  getGetDailyLimitQueryKey,
  getGetGuestDashboardQueryKey,
  getGetTipHistoryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, MapPin, Calendar, HeartHandshake, Loader2, Lock, ArrowLeft } from "lucide-react";

const PRESET_AMOUNTS = [1, 2, 3, 5, 10];

export default function TipConfirmationPage() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");

  const { data: validation, isLoading: validatingQr, error: qrError } = useValidateQrCode(token!);
  const { data: wallet, isLoading: loadingWallet } = useGetWallet();
  const { data: dailyLimit } = useGetDailyLimit();
  
  const sendTip = useSendTip();

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount("");
  };

  const handleCustomSelect = () => {
    setIsCustom(true);
    setSelectedAmount(null);
  };

  const getFinalAmount = () => {
    if (isCustom) {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) ? 0 : parsed;
    }
    return selectedAmount || 0;
  };

  const handleContinue = () => {
    const amount = getFinalAmount();
    if (amount <= 0) {
      toast({ title: "Please select an amount", variant: "destructive" });
      return;
    }

    if (wallet && amount > wallet.balance) {
      toast({ 
        title: "Insufficient funds", 
        description: "Please add funds to your wallet first.",
        variant: "destructive" 
      });
      return;
    }

    if (dailyLimit && amount > dailyLimit.remaining) {
      toast({ 
        title: "Daily limit exceeded", 
        description: `You only have $${dailyLimit.remaining.toFixed(2)} remaining today.`,
        variant: "destructive" 
      });
      return;
    }

    if (validation?.perGuestCap && amount > validation.perGuestCap) {
      toast({ 
        title: "Event limit exceeded", 
        description: `This event has a per-guest tip cap of $${validation.perGuestCap.toFixed(2)}.`,
        variant: "destructive" 
      });
      return;
    }

    setShowPin(true);
  };

  const handleConfirmPin = async () => {
    if (pin.length !== 4) return;
    
    // In a real app, we would securely validate the PIN.
    // For this prototype, we'll accept any 4-digit PIN.
    
    try {
      await sendTip.mutateAsync({
        data: {
          eventId: validation!.eventId,
          qrToken: token!,
          amount: getFinalAmount()
        }
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDailyLimitQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetGuestDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTipHistoryQueryKey() });

      toast({
        title: "Tip Sent!",
        description: `Successfully sent $${getFinalAmount().toFixed(2)} to ${validation!.vendorName}.`,
      });

      setLocation("/guest");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Tip Failed",
        description: error.message || "Failed to process tip. Please try again.",
      });
      setPin(""); // Reset PIN on failure
    }
  };

  if (validatingQr || loadingWallet) {
    return (
      <div className="container max-w-md mx-auto p-4 space-y-6 pt-12">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (qrError || !validation?.valid) {
    return (
      <div className="container max-w-md mx-auto p-4 pt-12 text-center">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Code</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              {validation?.message || "This QR code is invalid or has expired."}
            </p>
            <Button onClick={() => setLocation("/guest/scan")} variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scanner
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const finalAmount = getFinalAmount();
  const hasEnoughBalance = wallet && finalAmount <= wallet.balance;

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-muted/30 pb-12">
      {/* Event Header Banner */}
      <div className="bg-card border-b px-4 py-8 mb-6 shadow-sm">
        <div className="container max-w-md mx-auto text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
            <HeartHandshake className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{validation.vendorName}</h1>
          <p className="text-muted-foreground font-medium">at {validation.eventName}</p>
          
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-4 pt-4 border-t border-border/50">
            <span className="flex items-center"><Building2 className="h-3 w-3 mr-1" /> {validation.hostName}</span>
            <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {validation.venueName}</span>
          </div>
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4">
        {!showPin ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-center text-lg">Select Tip Amount</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  {PRESET_AMOUNTS.map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant={selectedAmount === amt ? "default" : "outline"}
                      className={`h-14 text-lg ${selectedAmount === amt ? 'shadow-md ring-2 ring-primary/20' : ''}`}
                      onClick={() => handleAmountSelect(amt)}
                      data-testid={`button-amount-${amt}`}
                    >
                      ${amt}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant={isCustom ? "default" : "outline"}
                    className={`h-14 text-lg ${isCustom ? 'shadow-md ring-2 ring-primary/20' : ''}`}
                    onClick={handleCustomSelect}
                    data-testid="button-amount-custom"
                  >
                    Custom
                  </Button>
                </div>

                {isCustom && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="custom-amount" className="mb-2 block text-center">Enter Custom Amount</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
                      <Input
                        id="custom-amount"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="0.00"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="pl-8 h-14 text-xl text-center font-medium"
                        autoFocus
                        data-testid="input-custom-amount"
                      />
                    </div>
                  </div>
                )}
                
                {/* Balance & Limits Check */}
                {finalAmount > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Wallet Balance:</span>
                      <span className={hasEnoughBalance ? "font-medium" : "text-destructive font-bold"}>
                        ${wallet?.balance.toFixed(2)}
                      </span>
                    </div>
                    {dailyLimit && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Daily Remaining:</span>
                        <span className={finalAmount <= dailyLimit.remaining ? "" : "text-destructive font-bold"}>
                          ${dailyLimit.remaining.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {validation.perGuestCap && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Event Cap:</span>
                        <span className={finalAmount <= validation.perGuestCap ? "" : "text-destructive font-bold"}>
                          ${validation.perGuestCap.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg rounded-full"
                  disabled={finalAmount <= 0 || !hasEnoughBalance}
                  onClick={handleContinue}
                  data-testid="button-continue-tip"
                >
                  Continue
                </Button>
                {!hasEnoughBalance && finalAmount > 0 && (
                  <Button variant="link" onClick={() => setLocation("/guest/wallet")} className="text-primary text-sm">
                    Add funds to wallet
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setLocation("/guest/scan")} className="w-full">
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <Card className="border-primary/20 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Confirm Tip</CardTitle>
                <p className="text-3xl font-bold text-foreground my-4">
                  ${finalAmount.toFixed(2)}
                </p>
                <p className="text-muted-foreground text-sm">
                  Enter your 4-digit PIN to securely authorize this tip to {validation.vendorName}.
                </p>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-6">
                <InputOTP 
                  maxLength={4} 
                  value={pin}
                  onChange={(val) => {
                    setPin(val);
                    if (val.length === 4) {
                      // Small delay to let the UI update before firing
                      setTimeout(() => handleConfirmPin(), 100);
                    }
                  }}
                  disabled={sendTip.isPending}
                  data-testid="input-pin"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="h-14 w-14 text-xl" />
                    <InputOTPSlot index={1} className="h-14 w-14 text-xl" />
                    <InputOTPSlot index={2} className="h-14 w-14 text-xl" />
                    <InputOTPSlot index={3} className="h-14 w-14 text-xl" />
                  </InputOTPGroup>
                </InputOTP>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg rounded-full"
                  disabled={pin.length !== 4 || sendTip.isPending}
                  onClick={handleConfirmPin}
                  data-testid="button-confirm-pin"
                >
                  {sendTip.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  {sendTip.isPending ? "Processing..." : "Authorize Tip"}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowPin(false);
                    setPin("");
                  }} 
                  className="w-full"
                  disabled={sendTip.isPending}
                >
                  Back
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
