'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NotificationSettings {
  email: {
    enabled: boolean;
    frequency: 'realtime' | 'daily' | 'weekly';
    types: {
      security: boolean;
      updates: boolean;
      marketing: boolean;
      mentions: boolean;
      comments: boolean;
      activity: boolean;
    };
  };
  push: {
    enabled: boolean;
    types: {
      security: boolean;
      updates: boolean;
      mentions: boolean;
      comments: boolean;
      activity: boolean;
    };
  };
  inApp: {
    enabled: boolean;
    types: {
      security: boolean;
      updates: boolean;
      mentions: boolean;
      comments: boolean;
      activity: boolean;
    };
  };
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      enabled: true,
      frequency: 'realtime',
      types: {
        security: true,
        updates: true,
        marketing: false,
        mentions: true,
        comments: true,
        activity: true,
      },
    },
    push: {
      enabled: true,
      types: {
        security: true,
        updates: true,
        mentions: true,
        comments: true,
        activity: true,
      },
    },
    inApp: {
      enabled: true,
      types: {
        security: true,
        updates: true,
        mentions: true,
        comments: true,
        activity: true,
      },
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/notifications', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching notification settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Notification settings updated successfully',
        });
      } else {
        throw new Error('Failed to update notification settings');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notification settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <div>Loading notification settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Configure how you receive email notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                checked={settings.email.enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, email: { ...settings.email, enabled: checked } })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Email Frequency</Label>
              <Select
                value={settings.email.frequency}
                onValueChange={(value: 'realtime' | 'daily' | 'weekly') =>
                  setSettings({ ...settings, email: { ...settings.email, frequency: value } })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Digest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label>Notification Types</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="security-email">Security Alerts</Label>
                  <Switch
                    id="security-email"
                    checked={settings.email.types.security}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        email: {
                          ...settings.email,
                          types: { ...settings.email.types, security: checked },
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="updates-email">System Updates</Label>
                  <Switch
                    id="updates-email"
                    checked={settings.email.types.updates}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        email: {
                          ...settings.email,
                          types: { ...settings.email.types, updates: checked },
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="marketing-email">Marketing Emails</Label>
                  <Switch
                    id="marketing-email"
                    checked={settings.email.types.marketing}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        email: {
                          ...settings.email,
                          types: { ...settings.email.types, marketing: checked },
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mentions-email">Mentions</Label>
                  <Switch
                    id="mentions-email"
                    checked={settings.email.types.mentions}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        email: {
                          ...settings.email,
                          types: { ...settings.email.types, mentions: checked },
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="comments-email">Comments</Label>
                  <Switch
                    id="comments-email"
                    checked={settings.email.types.comments}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        email: {
                          ...settings.email,
                          types: { ...settings.email.types, comments: checked },
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="activity-email">Activity Updates</Label>
                  <Switch
                    id="activity-email"
                    checked={settings.email.types.activity}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        email: {
                          ...settings.email,
                          types: { ...settings.email.types, activity: checked },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Configure push notifications on your devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications on your devices
                </p>
              </div>
              <Switch
                checked={settings.push.enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, push: { ...settings.push, enabled: checked } })
                }
              />
            </div>

            <div className="space-y-4">
              <Label>Notification Types</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="security-push">Security Alerts</Label>
                  <Switch
                    id="security-push"
                    checked={settings.push.types.security}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        push: {
                          ...settings.push,
                          types: { ...settings.push.types, security: checked },
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="updates-push">System Updates</Label>
                  <Switch
                    id="updates-push"
                    checked={settings.push.types.updates}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        push: {
                          ...settings.push,
                          types: { ...settings.push.types, updates: checked },
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mentions-push">Mentions</Label>
                  <Switch
                    id="mentions-push"
                    checked={settings.push.types.mentions}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        push: {
                          ...settings.push,
                          types: { ...settings.push.types, mentions: checked },
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="comments-push">Comments</Label>
                  <Switch
                    id="comments-push"
                    checked={settings.push.types.comments}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        push: {
                          ...settings.push,
                          types: { ...settings.push.types, comments: checked },
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="activity-push">Activity Updates</Label>
                  <Switch
                    id="activity-push"
                    checked={settings.push.types.activity}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        push: {
                          ...settings.push,
                          types: { ...settings.push.types, activity: checked },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>
            Configure notifications within the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications within the application
                </p>
              </div>
              <Switch
                checked={settings.inApp.enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, inApp: { ...settings.inApp, enabled: checked } })
                }
              />
            </div>

            <div className="space-y-4">
              <Label>Notification Types</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="security-inapp">Security Alerts</Label>
                  <Switch
                    id="security-inapp"
                    checked={settings.inApp.types.security}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        inApp: {
                          ...settings.inApp,
                          types: { ...settings.inApp.types, security: checked },
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="updates-inapp">System Updates</Label>
                  <Switch
                    id="updates-inapp"
                    checked={settings.inApp.types.updates}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        inApp: {
                          ...settings.inApp,
                          types: { ...settings.inApp.types, updates: checked },
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mentions-inapp">Mentions</Label>
                  <Switch
                    id="mentions-inapp"
                    checked={settings.inApp.types.mentions}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        inApp: {
                          ...settings.inApp,
                          types: { ...settings.inApp.types, mentions: checked },
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="comments-inapp">Comments</Label>
                  <Switch
                    id="comments-inapp"
                    checked={settings.inApp.types.comments}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        inApp: {
                          ...settings.inApp,
                          types: { ...settings.inApp.types, comments: checked },
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="activity-inapp">Activity Updates</Label>
                  <Switch
                    id="activity-inapp"
                    checked={settings.inApp.types.activity}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        inApp: {
                          ...settings.inApp,
                          types: { ...settings.inApp.types, activity: checked },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
} 