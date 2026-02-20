import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Lock,
  User,
  Globe,
  Moon,
  Mail,
  Smartphone,
  Shield,
  Key,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserSettings {
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  dark_mode: boolean;
  privacy_level: string;
  language: string;
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>({
    notifications_enabled: true,
    email_notifications: true,
    push_notifications: true,
    dark_mode: true,
    privacy_level: 'public',
    language: 'en',
  });
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setSettings({
        notifications_enabled: data.notifications_enabled,
        email_notifications: data.email_notifications,
        push_notifications: data.push_notifications,
        dark_mode: data.dark_mode,
        privacy_level: data.privacy_level,
        language: data.language,
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      });

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been updated',
      });
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

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    toast({
      title: 'Account Deletion',
      description: 'Please contact support to delete your account.',
    });
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>

        {/* Notifications */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive all notifications</p>
              </div>
              <Switch
                checked={settings.notifications_enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications_enabled: checked }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, email_notifications: checked }))}
                disabled={!settings.notifications_enabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications</p>
                </div>
              </div>
              <Switch
                checked={settings.push_notifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, push_notifications: checked }))}
                disabled={!settings.notifications_enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Privacy
            </CardTitle>
            <CardDescription>Control your privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Profile Visibility</Label>
              <Select
                value={settings.privacy_level}
                onValueChange={(value) => setSettings(prev => ({ ...prev, privacy_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Anyone can see your profile</SelectItem>
                  <SelectItem value="followers">Followers Only - Only followers can see</SelectItem>
                  <SelectItem value="private">Private - Only you can see</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Moon className="w-5 h-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look of Herald</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Use dark theme</p>
              </div>
              <Switch
                checked={settings.dark_mode}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, dark_mode: checked }))}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                Language
              </Label>
              <Select
                value={settings.language}
                onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>Manage your password and security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button onClick={handleChangePassword} disabled={loading}>
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-card border-destructive">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button variant="gold" onClick={handleSaveSettings} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Save All Settings
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
