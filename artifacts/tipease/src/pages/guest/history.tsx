import { useGetTipHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Receipt, Search, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function HistoryPage() {
  const { data: tips, isLoading } = useGetTipHistory();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTips = tips?.filter(tip => 
    tip.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tip.eventName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tip History</h1>
          <p className="text-muted-foreground">Review your past tips and support.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendor or event..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg flex items-center">
            <Receipt className="mr-2 h-5 w-5" />
            All Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : filteredTips && filteredTips.length > 0 ? (
            <div className="divide-y">
              {filteredTips.map((tip) => (
                <div key={tip.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full hidden sm:block">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{tip.vendorName}</h3>
                      <p className="text-sm text-muted-foreground mb-1">{tip.eventName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-block px-2 py-0.5 bg-muted rounded-full">
                          {format(new Date(tip.createdAt), "MMM d, yyyy • h:mm a")}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded-full capitalize ${
                          tip.status === 'completed' ? 'bg-secondary/10 text-secondary' : 
                          tip.status === 'refunded' ? 'bg-destructive/10 text-destructive' : 
                          'bg-accent/10 text-accent-foreground'
                        }`}>
                          {tip.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="sm:text-right flex sm:block justify-between items-center w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-0 pt-3 sm:pt-0">
                    <span className="text-sm text-muted-foreground sm:hidden">Amount</span>
                    <span className="text-2xl font-bold text-foreground">
                      ${tip.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No tips found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {searchTerm 
                  ? "We couldn't find any tips matching your search." 
                  : "You haven't sent any tips yet. Scan a QR code at your next event to get started."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
