import { useState } from "react";
import { useListVendors } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, Star, Mail, Phone, CalendarPlus } from "lucide-react";
import { Link } from "wouter";

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: vendors, isLoading } = useListVendors({ query: { q: searchTerm } });

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Directory</h1>
          <p className="text-muted-foreground">Find and partner with service staff for your events.</p>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by company name, contact, or email..."
          className="pl-9 h-12 text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-vendors"
        />
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
        </div>
      ) : vendors && vendors.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <Card key={vendor.id} className="hover:shadow-md transition-shadow flex flex-col" data-testid={`card-vendor-${vendor.id}`}>
              <CardHeader className="pb-4 border-b">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg line-clamp-1">{vendor.companyName}</CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Star className="h-3 w-3 mr-1 fill-accent text-accent" />
                        <span className="font-medium text-foreground mr-1">{vendor.rating ? vendor.rating.toFixed(1) : 'New'}</span>
                        <span>({vendor.totalEvents} events)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-4 space-y-3 flex-1">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center">
                    <span className="font-medium text-foreground mr-2">Contact:</span> {vendor.contactName}
                  </p>
                  <p className="flex items-center">
                    <Mail className="h-3.5 w-3.5 mr-2" />
                    <a href={`mailto:${vendor.email}`} className="hover:underline text-foreground truncate">{vendor.email}</a>
                  </p>
                  {vendor.phone && (
                    <p className="flex items-center">
                      <Phone className="h-3.5 w-3.5 mr-2" />
                      <span className="text-foreground">{vendor.phone}</span>
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <Badge variant={vendor.status === 'approved' ? 'secondary' : 'outline'} className={vendor.status === 'approved' ? 'bg-secondary/20 text-secondary border-transparent' : ''}>
                    {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 pb-4 px-4">
                <Button asChild variant="outline" className="w-full" data-testid={`button-invite-vendor-${vendor.id}`}>
                  <Link href="/host/events/create">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Invite to Event
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No vendors found</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              {searchTerm ? "We couldn't find any vendors matching your search." : "There are currently no vendors registered on the platform."}
            </p>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>Clear Search</Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
