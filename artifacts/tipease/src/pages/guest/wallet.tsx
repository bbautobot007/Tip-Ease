import { useState } from "react";
import { 
  useGetWallet, 
  useGetWalletTransactions, 
  useAddFundsToWallet,
  useGetStripePublishableKey,
  getGetWalletQueryKey,
  getGetWalletTransactionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Wallet, CreditCard, ArrowDownToLine, ArrowUpFromLine, RefreshCw, Loader2 } from "lucide-react";
import { format } from "date-fns";

// Mock stripe promise loading - in reality this would use the real key
let stripePromise: Promise<any> | null = null;
const getStripe = (key: string) => {
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

function CheckoutForm({ amount, clientSecret, onSuccess }: { amount: number, clientSecret: string, onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/guest/wallet`,
        },
        redirect: "if_required", // We handle the redirect manually for SPA
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: error.message || "An unexpected error occurred.",
        });
      } else {
        toast({
          title: "Funds Added",
          description: `Successfully added $${amount.toFixed(2)} to your wallet.`,
        });
        onSuccess();
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
        data-testid="button-submit-payment"
      >
        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
        {isProcessing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </Button>
    </form>
  );
}

export default function WalletPage() {
  const { data: wallet, isLoading: loadingWallet } = useGetWallet();
  const { data: transactions, isLoading: loadingHistory } = useGetWalletTransactions();
  const { data: stripeKey } = useGetStripePublishableKey();
  
  const addFunds = useAddFundsToWallet();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [amountInput, setAmountInput] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [currentAmount, setCurrentAmount] = useState(0);

  const handleInitPayment = async () => {
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    try {
      const result = await addFunds.mutateAsync({
        data: { amount }
      });
      setClientSecret(result.clientSecret);
      setCurrentAmount(amount);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to initialize payment.",
      });
    }
  };

  const handlePaymentSuccess = () => {
    setClientSecret(null);
    setAmountInput("");
    queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetWalletTransactionsQueryKey() });
  };

  if (loadingWallet) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Wallet</h1>
          <p className="text-muted-foreground">Manage your balance and view transaction history</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="md:col-span-1 bg-card border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold tracking-tighter mb-4" data-testid="text-wallet-balance-large">
              ${wallet?.balance.toFixed(2)}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Daily Limit:</span>
                <span className="font-medium text-foreground">${wallet?.dailyLimit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Auto-reload:</span>
                <span className="font-medium text-foreground">{wallet?.autoReload ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <Card className="md:col-span-2">
          <Tabs defaultValue="add-funds" className="w-full">
            <CardHeader className="pb-0">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="add-funds" data-testid="tab-add-funds">Add Funds</TabsTrigger>
                <TabsTrigger value="history" data-testid="tab-history">Transaction History</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-6">
              
              <TabsContent value="add-funds" className="mt-0">
                {!clientSecret ? (
                  <div className="space-y-6">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="amount">Amount to Add ($)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            id="amount"
                            type="number"
                            min="5"
                            step="5"
                            placeholder="20.00"
                            value={amountInput}
                            onChange={(e) => setAmountInput(e.target.value)}
                            className="pl-8"
                            data-testid="input-fund-amount"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2">
                        {[10, 20, 50, 100].map(amt => (
                          <Button 
                            key={amt} 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setAmountInput(amt.toString())}
                          >
                            ${amt}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={handleInitPayment}
                      disabled={!amountInput || addFunds.isPending || !stripeKey?.publishableKey}
                      data-testid="button-init-payment"
                    >
                      {addFunds.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Continue to Payment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Complete Payment</h3>
                      <Button variant="ghost" size="sm" onClick={() => setClientSecret(null)}>
                        Cancel
                      </Button>
                    </div>
                    {stripeKey?.publishableKey && (
                      <Elements 
                        stripe={getStripe(stripeKey.publishableKey)} 
                        options={{ clientSecret, appearance: { theme: 'stripe' } }}
                      >
                        <CheckoutForm 
                          amount={currentAmount} 
                          clientSecret={clientSecret} 
                          onSuccess={handlePaymentSuccess} 
                        />
                      </Elements>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                {loadingHistory ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${
                            tx.type === 'deposit' ? 'bg-secondary/10 text-secondary' : 
                            tx.type === 'tip' ? 'bg-primary/10 text-primary' : 
                            'bg-muted text-muted-foreground'
                          }`}>
                            {tx.type === 'deposit' ? <ArrowDownToLine className="h-4 w-4" /> : 
                             tx.type === 'tip' ? <ArrowUpFromLine className="h-4 w-4" /> : 
                             <RefreshCw className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm capitalize">{tx.type}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, yyyy • h:mm a")}</p>
                          </div>
                        </div>
                        <div className={`font-bold ${tx.type === 'deposit' ? 'text-secondary' : 'text-foreground'}`}>
                          {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="mx-auto h-12 w-12 opacity-20 mb-4" />
                    <p>No transactions yet.</p>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
