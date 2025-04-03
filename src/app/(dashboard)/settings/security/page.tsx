'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Shield, Key, Smartphone, Lock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod: 'authenticator' | 'sms' | 'email';
  passwordLastChanged: string;
  activeSessions: {
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }[];
  loginHistory: {
    id: string;
    timestamp: string;
    device: string;
    location: string;
    status: 'success' | 'failed';
    ipAddress: string;
  }[];
}

export default function SecuritySettings() {
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    twoFactorMethod: 'authenticator',
    passwordLastChanged: '',
    activeSessions: [],
    loginHistory: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/security', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching security settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleEnableTwoFactor = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/settings/security/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          method: settings.twoFactorMethod,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setShowTwoFactorSetup(true);
        toast({
          title: 'Success',
          description: 'Two-factor authentication setup initiated',
        });
      } else {
        throw new Error('Failed to setup two-factor authentication');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to setup two-factor authentication',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyTwoFactor = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/settings/security/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          code: twoFactorCode,
        }),
      });
      
      if (response.ok) {
        setSettings({ ...settings, twoFactorEnabled: true });
        setShowTwoFactorSetup(false);
        toast({
          title: 'Success',
          description: 'Two-factor authentication enabled successfully',
        });
      } else {
        throw new Error('Failed to verify two-factor authentication');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify two-factor authentication',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const response = await fetch('/api/settings/security/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      
      if (response.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast({
          title: 'Success',
          description: 'Password changed successfully',
        });
      } else {
        throw new Error('Failed to change password');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/settings/security/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        setSettings({
          ...settings,
          activeSessions: settings.activeSessions.filter(session => session.id !== sessionId),
        });
        toast({
          title: 'Success',
          description: 'Session revoked successfully',
        });
      } else {
        throw new Error('Failed to revoke session');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke session',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <div>Loading security settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Security Recommendation</AlertTitle>
              <AlertDescription>
                We strongly recommend enabling two-factor authentication to protect your account from unauthorized access.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  {settings.twoFactorEnabled
                    ? 'Two-factor authentication is enabled'
                    : 'Two-factor authentication is disabled'}
                </p>
              </div>
              {!settings.twoFactorEnabled && (
                <Button onClick={handleEnableTwoFactor} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Enable 2FA'
                  )}
                </Button>
              )}
            </div>

            {settings.twoFactorEnabled && (
              <div className="space-y-2">
                <Label>Authentication Method</Label>
                <Select
                  value={settings.twoFactorMethod}
                  onValueChange={(value: 'authenticator' | 'sms' | 'email') =>
                    setSettings({ ...settings, twoFactorMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="authenticator">Authenticator App</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your active sessions across devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{session.device}</span>
                    {session.current && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {session.location} • Last active {session.lastActive}
                  </p>
                </div>
                {!session.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login History</CardTitle>
          <CardDescription>
            View your recent login activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.loginHistory.map((login) => (
              <div
                key={login.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {login.status === 'success' ? (
                      <Lock className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">{login.device}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {login.location} • {login.ipAddress} • {login.timestamp}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    login.status === 'success'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {login.status === 'success' ? 'Success' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showTwoFactorSetup} onOpenChange={setShowTwoFactorSetup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {settings.twoFactorMethod === 'authenticator'
                ? 'Scan the QR code with your authenticator app or enter the setup key manually.'
                : settings.twoFactorMethod === 'sms'
                ? 'Enter the verification code sent to your phone.'
                : 'Enter the verification code sent to your email.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="twoFactorCode">Verification Code</Label>
              <Input
                id="twoFactorCode"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="Enter verification code"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTwoFactorSetup(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyTwoFactor} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 