"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCircle, Clock, MessageSquare, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { 
  getUserNotifications, 
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from "@/lib/services/notifications";
import { Notification, NotificationType, User } from "@/lib/types";
import { useRouter } from "next/navigation";

interface NotificationsPageProps {
  user: User;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'post_approved':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'post_rejected':
      return <X className="h-5 w-5 text-red-500" />;
    case 'correction_approved':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'correction_rejected':
      return <X className="h-5 w-5 text-red-500" />;
    case 'correction_submitted':
      return <Clock className="h-5 w-5 text-blue-500" />;
    case 'comment_on_post':
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case 'upvote_received':
      return <CheckCircle className="h-5 w-5 text-purple-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'post_approved':
    case 'correction_approved':
      return 'border-l-green-500';
    case 'post_rejected':
    case 'correction_rejected':
      return 'border-l-red-500';
    case 'correction_submitted':
    case 'comment_on_post':
      return 'border-l-blue-500';
    case 'upvote_received':
      return 'border-l-purple-500';
    default:
      return 'border-l-gray-500';
  }
};

export function NotificationsPage({ user }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
  }, [user.id]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getUserNotifications(user.id, 50);
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast.error("Erreur lors du chargement des notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.id, user.id);
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Navigate to related post if available
    if (notification.post_id) {
      router.push(`/forum/post/${notification.post_id}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      toast.success("Toutes les notifications ont été marquées comme lues");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId, user.id);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success("Notification supprimée");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : "Aucune nouvelle notification"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Aucune notification</h3>
            <p className="text-muted-foreground">
              Vous recevrez des notifications ici quand il y aura de l'activité sur vos posts ou corrections.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`
                cursor-pointer transition-all hover:shadow-md border-l-4
                ${getNotificationColor(notification.type)}
                ${!notification.is_read ? 'bg-blue-50/50' : 'bg-background'}
              `}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h3>
                        
                        {notification.content && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.content}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                          
                          {!notification.is_read && (
                            <Badge variant="secondary" className="text-xs">
                              Nouveau
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}