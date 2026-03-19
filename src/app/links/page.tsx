import { prisma } from "@/lib/prisma";
import { Link2, ExternalLink, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function LinksPage() {
  // In a full implementation, links would be stored in DB
  // For now, show the coming-soon state
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-display">Links</h1>
          <p className="text-zinc-400 mt-1">Coming soon — saved links and bookmarks</p>
        </div>
        <Button disabled title="Coming soon">
          <Plus className="w-4 h-4 mr-2" />
          Add Link
        </Button>
      </div>

      {/* Placeholder state */}
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
          <Link2 className="w-8 h-8 text-zinc-600" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-300 mb-2">Links Coming Soon</h2>
        <p className="text-zinc-500 max-w-md">
          The links management feature is under development. 
          Links saved from articles will appear here.
        </p>
      </div>
    </div>
  );
}
