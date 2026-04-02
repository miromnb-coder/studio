import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  User, 
  Bell, 
  Lock, 
  Shield, 
  Moon,
  Database,
  Globe
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12 animate-in fade-in duration-700">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold font-headline">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <aside className="space-y-1">
            <nav className="flex flex-col gap-1">
              <Button variant="ghost" className="justify-start gap-3 rounded-xl bg-white/5">
                <User className="w-4 h-4" />
                Profile
              </Button>
              <Button variant="ghost" className="justify-start gap-3 rounded-xl hover:bg-white/5">
                <Bell className="w-4 h-4" />
                Notifications
              </Button>
              <Button variant="ghost" className="justify-start gap-3 rounded-xl hover:bg-white/5">
                <Lock className="w-4 h-4" />
                Security
              </Button>
              <Button variant="ghost" className="justify-start gap-3 rounded-xl hover:bg-white/5">
                <Database className="w-4 h-4" />
                Data & Privacy
              </Button>
            </nav>
          </aside>

          <div className="md:col-span-2 space-y-8">
            <section className="space-y-4">
              <h2 className="text-xl font-bold font-headline">Profile Information</h2>
              <Card className="premium-card">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue="Jane" className="bg-white/5 border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue="Doe" className="bg-white/5 border-white/10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" defaultValue="jane@example.com" disabled className="bg-white/5 border-white/10 opacity-50" />
                  </div>
                  <Button className="rounded-full">Update profile</Button>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold font-headline">Preferences</h2>
              <Card className="premium-card">
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">Use the dark theme by default.</p>
                    </div>
                    <Switch checked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Alerts</Label>
                      <p className="text-sm text-muted-foreground">Receive weekly savings reports.</p>
                    </div>
                    <Switch checked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Urgent Notifications</Label>
                      <p className="text-sm text-muted-foreground">Notify when trials are ending soon.</p>
                    </div>
                    <Switch checked />
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold font-headline text-danger">Danger Zone</h2>
              <Card className="premium-card border-danger/20">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Delete Account</Label>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all data.</p>
                  </div>
                  <Button variant="destructive" className="rounded-full">Delete</Button>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
