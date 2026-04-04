import { ExternalLink, Globe } from "lucide-react";

interface SourceLinkProps {
  sourceUrl?: string;
  source?: string;
}

export function SourceLink({ sourceUrl, source }: SourceLinkProps) {
  if (!sourceUrl && !source) return null;

  const displaySource = sourceUrl
    ? (() => {
        try {
          return new URL(sourceUrl).hostname.replace(/^www\./, "");
        } catch {
          return sourceUrl;
        }
      })()
    : source || "Unknown Source";

  return (
    <div className="not-prose mt-8 pt-6 border-t border-zinc-800">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
        <Globe className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Source</p>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#4ade80] hover:text-[#4ade80] transition-colors group"
            >
              <span className="font-medium truncate">{displaySource}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 flex-shrink-0" />
            </a>
          ) : (
            <p className="text-sm text-zinc-400">{displaySource}</p>
          )}
        </div>
      </div>
    </div>
  );
}
