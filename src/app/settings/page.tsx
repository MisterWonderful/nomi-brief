import { Button } from "@/components/ui/Button";
import { Settings, User, Mic2, Bell, Palette, Key } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white font-display">
          Settings
        </h1>
        <p className="mt-2 text-zinc-400">
          Manage your Nomi Brief preferences
        </p>
      </div>

      {/* Settings Sections */}
      <div className="grid gap-6">
        {/* Profile Section */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Profile</h2>
          </div>
          <div className="space-y-4 pl-8">
            <div>
              <label className="text-sm text-zinc-500">Name</label>
              <p className="text-white">Ryan</p>
            </div>
            <div>
              <label className="text-sm text-zinc-500">Email</label>
              <p className="text-white">nomi@nomibrief.app</p>
            </div>
            <div>
              <label className="text-sm text-zinc-500">Avatar</label>
              <p className="text-zinc-400 text-sm">Using GitHub avatar</p>
            </div>
          </div>
        </div>

        {/* OpenClaw Connection */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Mic2 className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">OpenClaw Connection</h2>
          </div>
          <div className="space-y-4 pl-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Connection Status</p>
                <p className="text-sm text-zinc-500">Voice integration with OpenClaw</p>
              </div>
              <span className="px-3 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                Ready
              </span>
            </div>
            <div>
              <p className="text-sm text-zinc-500 mb-2">Webhook URL</p>
              <code className="text-xs text-zinc-400 bg-zinc-800 px-3 py-2 rounded-lg block">
                https://your-domain.com/api/webhook
              </code>
            </div>
            <Button variant="secondary" size="sm" disabled>
              Configure OpenClaw
            </Button>
          </div>
        </div>

        {/* Appearance */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Appearance</h2>
          </div>
          <div className="space-y-4 pl-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Theme</p>
                <p className="text-sm text-zinc-500">Dark mode (default)</p>
              </div>
              <Button variant="ghost" size="sm" disabled>Dark</Button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>
          <div className="space-y-4 pl-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Daily Brief</p>
                <p className="text-sm text-zinc-500">Receive daily article summaries</p>
              </div>
              <Button variant="ghost" size="sm" disabled>Enabled</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Voice Summaries</p>
                <p className="text-sm text-zinc-500">Get summaries after voice sessions</p>
              </div>
              <Button variant="ghost" size="sm" disabled>Enabled</Button>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">API Configuration</h2>
          </div>
          <div className="space-y-4 pl-8">
            <div>
              <p className="text-sm text-zinc-500 mb-2">API Secret</p>
              <code className="text-xs text-zinc-400 bg-zinc-800 px-3 py-2 rounded-lg block">
                Set via API_SECRET environment variable
              </code>
            </div>
            <p className="text-sm text-zinc-500">
              Configure <code className="text-zinc-400">API_SECRET</code> in your environment 
              to protect POST /api/articles endpoint.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
