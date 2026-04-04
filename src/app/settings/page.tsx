import { Button } from "@/components/ui/Button";
import { User, Mic2, Bell, Palette, Key } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#e5e5e5]">Settings</h1>
        <p className="mt-2 text-[#737373]">Manage your Nomi Brief preferences</p>
      </div>

      <div className="grid gap-3">
        <div className="bg-[#111111] border border-[#1c1c1c] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-[#525252]" />
            <h2 className="text-sm font-medium text-[#e5e5e5]">Profile</h2>
          </div>
          <div className="space-y-4 pl-8">
            <div><label className="text-sm text-[#525252]">Name</label><p className="text-[#e5e5e5]">Ryan</p></div>
            <div><label className="text-sm text-[#525252]">Email</label><p className="text-[#e5e5e5]">nomi@nomibrief.app</p></div>
            <div><label className="text-sm text-[#525252]">Avatar</label><p className="text-[#737373] text-sm">Using GitHub avatar</p></div>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#1c1c1c] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Mic2 className="w-5 h-5 text-[#525252]" />
            <h2 className="text-sm font-medium text-[#e5e5e5]">OpenClaw / Voice</h2>
          </div>
          <div className="space-y-4 pl-8">
            <div className="flex items-center justify-between">
              <div><p className="text-[#e5e5e5]">Voice Feature</p><p className="text-sm text-[#525252]">OpenClaw voice integration</p></div>
              <span className="px-3 py-1 text-xs font-medium bg-[#09090b] text-[#525252] rounded-full">Coming soon</span>
            </div>
            <div>
              <p className="text-sm text-[#525252] mb-2">Webhook URL</p>
              <code className="text-xs text-[#737373] bg-[#09090b] px-3 py-2 rounded-lg block">https://your-domain.com/api/webhook</code>
            </div>
            <p className="text-sm text-[#525252]">Voice sessions and &ldquo;Talk about this&rdquo; are planned for a future release. The webhook endpoint is active and receives articles from OpenClaw.</p>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#1c1c1c] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-[#525252]" />
            <h2 className="text-sm font-medium text-[#e5e5e5]">Appearance</h2>
          </div>
          <div className="space-y-4 pl-8">
            <div className="flex items-center justify-between">
              <div><p className="text-[#e5e5e5]">Theme</p><p className="text-sm text-[#525252]">Dark mode (default)</p></div>
              <Button variant="ghost" size="sm" disabled>Dark</Button>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#1c1c1c] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-[#525252]" />
            <h2 className="text-sm font-medium text-[#e5e5e5]">Notifications</h2>
          </div>
          <div className="space-y-4 pl-8">
            <div className="flex items-center justify-between">
              <div><p className="text-[#e5e5e5]">Daily Brief</p><p className="text-sm text-[#525252]">Receive daily article summaries</p></div>
              <Button variant="ghost" size="sm" disabled>Enabled</Button>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-[#e5e5e5]">Voice Summaries</p><p className="text-sm text-[#525252]">Get summaries after voice sessions</p></div>
              <Button variant="ghost" size="sm" disabled>Enabled</Button>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#1c1c1c] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-[#525252]" />
            <h2 className="text-sm font-medium text-[#e5e5e5]">API Configuration</h2>
          </div>
          <div className="space-y-4 pl-8">
            <div>
              <p className="text-sm text-[#525252] mb-2">API Secret</p>
              <code className="text-xs text-[#737373] bg-[#09090b] px-3 py-2 rounded-lg block">Set via API_SECRET environment variable</code>
            </div>
            <p className="text-sm text-[#525252]">Configure <code className="text-[#737373]">API_SECRET</code> in your environment to protect POST /api/articles endpoint.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
