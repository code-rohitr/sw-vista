'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Database, Server, HardDrive, Network, Shield, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SystemSettings {
  maintenance: {
    enabled: boolean;
    message: string;
  };
  backup: {
    autoBackup: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number;
    location: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    retention: number;
    console: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    cacheDuration: number;
    compressionEnabled: boolean;
  };
  security: {
    rateLimiting: boolean;
    maxRequests: number;
    sessionTimeout: number;
    ipWhitelist: string[];
  };
}

const SystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenance: {
      enabled: false,
      message: 'System is under maintenance. Please try again later.',
    },
    backup: {
      autoBackup: true,
      frequency: 'daily',
      retention: 30,
      location: 'local',
    },
    logging: {
      level: 'info',
      retention: 90,
      console: true,
    },
    performance: {
      cacheEnabled: true,
      cacheDuration: 3600,
      compressionEnabled: true,
    },
    security: {
      rateLimiting: true,
      maxRequests: 100,
      sessionTimeout: 30,
      ipWhitelist: [],
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('maintenance');
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/system', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching system settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/settings/system', {
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
          description: 'System settings updated successfully',
        });
      } else {
        throw new Error('Failed to update system settings');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update system settings',
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
          <div>Loading system settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Maintenance</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Backup</span>
          </TabsTrigger>
          <TabsTrigger value="logging" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span>Logging</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Mode</CardTitle>
              <CardDescription>
                Enable maintenance mode to temporarily disable access to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable to put the system in maintenance mode
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenance.enabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        maintenance: { ...settings.maintenance, enabled: checked },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Maintenance Message</Label>
                  <Input
                    value={settings.maintenance.message}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maintenance: { ...settings.maintenance, message: e.target.value },
                      })
                    }
                    placeholder="Enter maintenance message"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup Settings</CardTitle>
              <CardDescription>
                Configure automatic backup settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Backup</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable automatic system backups
                    </p>
                  </div>
                  <Switch
                    checked={settings.backup.autoBackup}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        backup: { ...settings.backup, autoBackup: checked },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <Select
                    value={settings.backup.frequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                      setSettings({
                        ...settings,
                        backup: { ...settings.backup, frequency: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Retention Period (days)</Label>
                  <Input
                    type="number"
                    value={settings.backup.retention}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        backup: { ...settings.backup, retention: parseInt(e.target.value) },
                      })
                    }
                    min={1}
                    max={365}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Backup Location</Label>
                  <Select
                    value={settings.backup.location}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        backup: { ...settings.backup, location: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local Storage</SelectItem>
                      <SelectItem value="s3">Amazon S3</SelectItem>
                      <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                      <SelectItem value="azure">Azure Blob Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logging">
          <Card>
            <CardHeader>
              <CardTitle>Logging Settings</CardTitle>
              <CardDescription>
                Configure system logging preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Log Level</Label>
                  <Select
                    value={settings.logging.level}
                    onValueChange={(value: 'debug' | 'info' | 'warn' | 'error') =>
                      setSettings({
                        ...settings,
                        logging: { ...settings.logging, level: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Log Retention (days)</Label>
                  <Input
                    type="number"
                    value={settings.logging.retention}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        logging: { ...settings.logging, retention: parseInt(e.target.value) },
                      })
                    }
                    min={1}
                    max={365}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Console Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable logging to console
                    </p>
                  </div>
                  <Switch
                    checked={settings.logging.console}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        logging: { ...settings.logging, console: checked },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Settings</CardTitle>
              <CardDescription>
                Configure system performance options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Caching</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable system-wide caching
                    </p>
                  </div>
                  <Switch
                    checked={settings.performance.cacheEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        performance: { ...settings.performance, cacheEnabled: checked },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cache Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={settings.performance.cacheDuration}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        performance: { ...settings.performance, cacheDuration: parseInt(e.target.value) },
                      })
                    }
                    min={60}
                    max={86400}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Compression</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable response compression
                    </p>
                  </div>
                  <Switch
                    checked={settings.performance.compressionEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        performance: { ...settings.performance, compressionEnabled: checked },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure system security options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rate Limiting</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable API rate limiting
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.rateLimiting}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, rateLimiting: checked },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Requests per Minute</Label>
                  <Input
                    type="number"
                    value={settings.security.maxRequests}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, maxRequests: parseInt(e.target.value) },
                      })
                    }
                    min={10}
                    max={1000}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, sessionTimeout: parseInt(e.target.value) },
                      })
                    }
                    min={5}
                    max={120}
                  />
                </div>

                <div className="space-y-2">
                  <Label>IP Whitelist</Label>
                  <Input
                    value={settings.security.ipWhitelist.join(', ')}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, ipWhitelist: e.target.value.split(',').map(ip => ip.trim()) },
                      })
                    }
                    placeholder="Enter IP addresses separated by commas"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
};

export default SystemSettings; 