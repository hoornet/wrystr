import { useState } from "react";
import { useUserStore } from "../../stores/user";
import { useLightningStore } from "../../stores/lightning";
import { isValidNwcUri } from "../../lib/lightning/nwc";
import { getNDK, getStoredRelayUrls, addRelay, removeRelay } from "../../lib/nostr";

function RelayRow({ url, onRemove }: { url: string; onRemove: () => void }) {
  const ndk = getNDK();
  const relay = ndk.pool?.relays.get(url);
  const connected = relay?.connected ?? false;

  return (
    <div className="flex items-center gap-3 px-3 py-2 border border-border text-[12px] group">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${connected ? "bg-success" : "bg-text-dim"}`} />
      <span className="text-text truncate flex-1 font-mono">{url}</span>
      <button
        onClick={onRemove}
        className="text-text-dim hover:text-danger text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        remove
      </button>
    </div>
  );
}

function RelaySection() {
  const [relays, setRelays] = useState<string[]>(() => getStoredRelayUrls());
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const url = input.trim();
    if (!url) return;
    if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
      setError("URL must start with ws:// or wss://");
      return;
    }
    if (relays.includes(url)) {
      setError("Already in list");
      return;
    }
    addRelay(url);
    setRelays(getStoredRelayUrls());
    setInput("");
    setError(null);
  };

  const handleRemove = (url: string) => {
    removeRelay(url);
    setRelays(getStoredRelayUrls());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") setInput("");
  };

  return (
    <section>
      <h2 className="text-text text-[11px] font-medium uppercase tracking-widest mb-2 text-text-dim">Relays</h2>
      <div className="space-y-1 mb-3">
        {relays.length === 0 && (
          <p className="text-text-dim text-[12px] px-1">No relays configured.</p>
        )}
        {relays.map((url) => (
          <RelayRow key={url} url={url} onRemove={() => handleRemove(url)} />
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(null); }}
          onKeyDown={handleKeyDown}
          placeholder="wss://relay.example.com"
          className="flex-1 bg-bg border border-border px-3 py-1.5 text-text text-[12px] font-mono focus:outline-none focus:border-accent/50 placeholder:text-text-dim"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 text-[11px] border border-border text-text-muted hover:text-accent hover:border-accent/40 transition-colors shrink-0"
        >
          add
        </button>
      </div>
      {error && <p className="text-danger text-[11px] mt-1">{error}</p>}
    </section>
  );
}

function IdentitySection() {
  const { npub, loggedIn } = useUserStore();
  const [copied, setCopied] = useState(false);

  if (!loggedIn || !npub) {
    return (
      <section>
        <h2 className="text-text text-[11px] font-medium uppercase tracking-widest mb-2 text-text-dim">Identity</h2>
        <p className="text-text-dim text-[12px]">Not logged in.</p>
      </section>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(npub).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section>
      <h2 className="text-text text-[11px] font-medium uppercase tracking-widest mb-2 text-text-dim">Identity</h2>
      <div className="flex items-center gap-2 px-3 py-2 border border-border">
        <span className="text-text font-mono text-[11px] truncate flex-1">{npub}</span>
        <button
          onClick={handleCopy}
          className="text-[10px] text-text-dim hover:text-accent transition-colors shrink-0"
        >
          {copied ? "copied ✓" : "copy npub"}
        </button>
      </div>
      <p className="text-text-dim text-[10px] mt-1 px-1">Your public key. Safe to share.</p>
    </section>
  );
}

function WalletSection() {
  const { nwcUri, setNwcUri, clearNwcUri } = useLightningStore();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const uri = input.trim();
    if (!uri) return;
    if (!isValidNwcUri(uri)) {
      setError("Invalid NWC URI. Must start with nostr+walletconnect://");
      return;
    }
    try {
      setSaving(true);
      setNwcUri(uri);
      setInput("");
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h2 className="text-text text-[11px] font-medium uppercase tracking-widest mb-2 text-text-dim">Lightning Wallet (NWC)</h2>
      {nwcUri ? (
        <div>
          <div className="flex items-center gap-2 px-3 py-2 border border-border mb-2">
            <span className="text-zap text-[11px]">⚡</span>
            <span className="text-text text-[12px] flex-1">Wallet connected</span>
            <button
              onClick={clearNwcUri}
              className="text-[10px] text-text-dim hover:text-danger transition-colors shrink-0"
            >
              disconnect
            </button>
          </div>
          <p className="text-text-dim text-[10px] px-1">Your NWC connection is active. You can zap notes and profiles.</p>
        </div>
      ) : (
        <div>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(null); }}
            placeholder="nostr+walletconnect://…"
            rows={3}
            className="w-full bg-bg border border-border px-3 py-2 text-text text-[11px] font-mono resize-none focus:outline-none focus:border-accent/50 placeholder:text-text-dim mb-2"
            style={{ WebkitUserSelect: "text", userSelect: "text" } as React.CSSProperties}
          />
          {error && <p className="text-danger text-[11px] mb-2">{error}</p>}
          <button
            onClick={handleSave}
            disabled={!input.trim() || saving}
            className="px-4 py-1.5 text-[11px] border border-border text-text-muted hover:text-accent hover:border-accent/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            connect wallet
          </button>
          <p className="text-text-dim text-[10px] mt-2 px-1">
            Get an NWC connection string from Alby, Mutiny, or any NWC-compatible wallet.
          </p>
        </div>
      )}
    </section>
  );
}

export function SettingsView() {
  return (
    <div className="h-full flex flex-col">
      <header className="border-b border-border px-4 py-2.5 shrink-0">
        <h1 className="text-text text-sm font-medium tracking-wide">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        <WalletSection />
        <RelaySection />
        <IdentitySection />
      </div>
    </div>
  );
}
