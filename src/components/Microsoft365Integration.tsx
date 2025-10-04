import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Mail, User, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  displayName: string;
  mail: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
}

interface CalendarEvent {
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  organizer: { emailAddress: { name: string; address: string } };
}

interface Email {
  subject: string;
  from: { emailAddress: { name: string; address: string } };
  receivedDateTime: string;
  bodyPreview: string;
  isRead: boolean;
}

export const Microsoft365Integration = () => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMicrosoftData();
  }, []);

  const callGraphAPI = async (endpoint: string) => {
    const { data, error } = await supabase.functions.invoke('graph-api', {
      body: { endpoint }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);
    return data;
  };

  const loadMicrosoftData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user profile
      const profile = await callGraphAPI('/me');
      setUserProfile(profile);

      // Load calendar events (next 5 events)
      const today = new Date().toISOString();
      const events = await callGraphAPI(
        `/me/calendar/calendarView?startDateTime=${today}&$top=5&$orderby=start/dateTime`
      );
      setCalendarEvents(events.value || []);

      // Load recent emails (top 10)
      const messages = await callGraphAPI('/me/messages?$top=10&$orderby=receivedDateTime DESC');
      setEmails(messages.value || []);

    } catch (err: any) {
      console.error('Error loading Microsoft data:', err);
      if (err.message?.includes('No Microsoft access token') || err.message?.includes('TOKEN_EXPIRED')) {
        setError('Please sign in with Microsoft 365 to access this data.');
      } else {
        setError(err.message || 'Failed to load Microsoft 365 data');
        toast.error('Failed to load Microsoft 365 data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (error && error.includes('sign in with Microsoft')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Microsoft 365 Integration</CardTitle>
          <CardDescription>
            Sign in with Microsoft 365 to access your calendar, emails, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Microsoft 365 Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userProfile && (
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Name:</span> {userProfile.displayName}
              </div>
              <div>
                <span className="font-semibold">Email:</span> {userProfile.mail}
              </div>
              {userProfile.jobTitle && (
                <div>
                  <span className="font-semibold">Title:</span> {userProfile.jobTitle}
                </div>
              )}
              {userProfile.department && (
                <div>
                  <span className="font-semibold">Department:</span> {userProfile.department}
                </div>
              )}
              {userProfile.officeLocation && (
                <div>
                  <span className="font-semibold">Office:</span> {userProfile.officeLocation}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your next calendar events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {calendarEvents.length === 0 ? (
                <p className="text-muted-foreground">No upcoming events</p>
              ) : (
                calendarEvents.map((event, idx) => (
                  <div key={idx} className="border-l-4 border-primary pl-4 py-2">
                    <div className="font-semibold">{event.subject}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(event.start.dateTime).toLocaleString()}
                    </div>
                    {event.location?.displayName && (
                      <div className="text-sm text-muted-foreground">
                        📍 {event.location.displayName}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      Organizer: {event.organizer.emailAddress.name}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Emails</CardTitle>
              <CardDescription>Your latest messages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emails.length === 0 ? (
                <p className="text-muted-foreground">No recent emails</p>
              ) : (
                emails.map((email, idx) => (
                  <div key={idx} className="border-b pb-4 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold flex-1">{email.subject}</div>
                      {!email.isRead && (
                        <Badge variant="default">New</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      From: {email.from.emailAddress.name} ({email.from.emailAddress.address})
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(email.receivedDateTime).toLocaleString()}
                    </div>
                    <div className="text-sm mt-2 line-clamp-2">
                      {email.bodyPreview}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
