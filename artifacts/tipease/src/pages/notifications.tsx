import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Bell, CheckCircle2, Circle, Clock } from "lucide-react";

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const queryClient = useQueryClient();

  const handleMarkRead = async (id: number) => {
    try {
      await markRead.mutateAsync({ id });
      // Optimistically update cache or just invalidate
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    if (!notifications) return;
    const unread = notifications.filter(n => !n.read);
    
    // In a real app we'd have a markAllRead endpoint, 
    // here we'll just map over them (not ideal for many, but okay for prototype)
    for (const n of unread) {
      try {
        await markRead.mutateAsync({ id: n.id });
      } catch (e) {}
    }
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your activity.</p>
        </div>
        {notifications?.some(n => !n.read) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 sm:p-6 flex items-start gap-4 transition-colors ${!notification.read ? 'bg-primary/5' : 'hover:bg-muted/10'}`}
                >
                  <div className={`mt-1 flex-shrink-0 ${!notification.read ? 'text-primary' : 'text-muted-foreground'}`}>
                    <Bell className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm sm:text-base ${!notification.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                    </div>
                  </div>

                  {!notification.read && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleMarkRead(notification.id)}
                      className="text-primary hover:text-primary hover:bg-primary/10 flex-shrink-0"
                      title="Mark as read"
                    >
                      <Circle className="h-5 w-5" />
                    </Button>
                  )}
                  {notification.read && (
                    <div className="h-9 w-9 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground opacity-50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                You're all caught up! New alerts will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
