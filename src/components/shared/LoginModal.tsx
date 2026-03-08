import { useState } from "react";
import { useUserStore } from "../../stores/user";

interface LoginModalProps {
  onClose: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
  const [tab, setTab] = useState<"nsec" | "pubkey">("nsec");
  const [input, setInput] = useState("");
  const { loginWithNsec, loginWithPubkey, loginError } = useUserStore();

  const handleLogin = async () => {
    if (!input.trim()) return;

    if (tab === "nsec") {
      await loginWithNsec(input.trim());
    } else {
      await loginWithPubkey(input.trim());
    }

    // Close if no error
    if (!useUserStore.getState().loginError) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-bg-raised border border-border w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-text text-sm font-medium">Login</h2>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("nsec")}
            className={`flex-1 px-4 py-2 text-[12px] transition-colors ${
              tab === "nsec"
                ? "text-accent border-b-2 border-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            Private key (nsec)
          </button>
          <button
            onClick={() => setTab("pubkey")}
            className={`flex-1 px-4 py-2 text-[12px] transition-colors ${
              tab === "pubkey"
                ? "text-accent border-b-2 border-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            Public key (read-only)
          </button>
        </div>

        {/* Input */}
        <div className="p-4">
          <label className="block text-text-muted text-[11px] mb-1.5">
            {tab === "nsec"
              ? "Paste your nsec or hex private key"
              : "Paste your npub or hex public key"}
          </label>
          <input
            type={tab === "nsec" ? "password" : "text"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tab === "nsec" ? "nsec1…" : "npub1…"}
            autoFocus
            className="w-full bg-bg border border-border px-3 py-2 text-text text-[13px] font-mono placeholder:text-text-dim focus:outline-none focus:border-accent/50"
          />

          {tab === "nsec" && (
            <p className="text-text-dim text-[10px] mt-1.5">
              Your key stays local. Never sent to any server.
            </p>
          )}

          {tab === "pubkey" && (
            <p className="text-text-dim text-[10px] mt-1.5">
              Read-only mode — you can browse but not post or zap.
            </p>
          )}

          {loginError && (
            <p className="text-danger text-[11px] mt-2">{loginError}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={!input.trim()}
            className="w-full mt-3 px-4 py-2 text-[12px] bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {tab === "nsec" ? "Login" : "View as read-only"}
          </button>
        </div>
      </div>
    </div>
  );
}
