import { useState, useCallback } from "react";
import { usePodcastStore } from "../../stores/podcast";
import { startStreaming, stopStreaming, boost } from "../../lib/podcast/v4v";

const RATE_OPTIONS = [5, 10, 21, 50, 100];
const NWC_KEY = "wrystr_nwc_uri";

export function V4VIndicator() {
  const [open, setOpen] = useState(false);
  const [boostAmount, setBoostAmount] = useState("100");
  const [boosting, setBoosting] = useState(false);

  const episode = usePodcastStore((s) => s.currentEpisode);
  const v4vSatsPerMinute = usePodcastStore((s) => s.v4vSatsPerMinute);
  const v4vStreaming = usePodcastStore((s) => s.v4vStreaming);
  const v4vTotalStreamed = usePodcastStore((s) => s.v4vTotalStreamed);
  const { setV4VEnabled, setV4VSatsPerMinute, setV4VStreaming, addStreamedSats } = usePodcastStore.getState();

  const nwcUri = localStorage.getItem(NWC_KEY) ?? "";
  const hasWallet = !!nwcUri;
  const hasRecipients = episode?.value && episode.value.length > 0;

  const toggleStreaming = useCallback(() => {
    if (!episode || !hasWallet) return;

    if (v4vStreaming) {
      stopStreaming();
      setV4VStreaming(false);
      setV4VEnabled(false);
    } else {
      const intervalId = startStreaming(
        episode,
        v4vSatsPerMinute,
        nwcUri,
        (amount) => addStreamedSats(amount),
      );
      if (intervalId >= 0) {
        setV4VStreaming(true, intervalId);
        setV4VEnabled(true);
      }
    }
  }, [episode, v4vStreaming, v4vSatsPerMinute, nwcUri, hasWallet]);

  const handleBoost = useCallback(async () => {
    if (!episode || !hasWallet || boosting) return;
    const amount = parseInt(boostAmount);
    if (!amount || amount <= 0) return;

    setBoosting(true);
    const paid = await boost(episode, amount, nwcUri);
    if (paid > 0) addStreamedSats(paid);
    setBoosting(false);
  }, [episode, boostAmount, nwcUri, hasWallet, boosting]);

  if (!episode) return null;

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={`text-[11px] px-1.5 py-0.5 rounded-sm transition-colors ${
          v4vStreaming
            ? "text-amber-400 bg-amber-500/10 animate-pulse"
            : "text-text-dim hover:text-text"
        }`}
        title="Value 4 Value"
      >
        {v4vStreaming ? `${v4vTotalStreamed} sats` : "V4V"}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-bg border border-border rounded-sm shadow-lg p-3 z-50">
          <div className="text-[11px] text-text font-medium mb-2">Value 4 Value</div>

          {!hasWallet && (
            <div className="text-[10px] text-text-dim mb-2">
              Connect NWC wallet in Settings to stream sats.
            </div>
          )}

          {!hasRecipients && hasWallet && (
            <div className="text-[10px] text-text-dim mb-2">
              This episode has no V4V recipients.
            </div>
          )}

          {hasWallet && hasRecipients && (
            <>
              {/* Toggle */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-text-muted">Stream sats</span>
                <button
                  onClick={toggleStreaming}
                  className={`w-8 h-4 rounded-full transition-colors relative ${
                    v4vStreaming ? "bg-accent" : "bg-border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                      v4vStreaming ? "left-4" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Rate picker */}
              <div className="flex items-center gap-1 mb-2">
                <span className="text-[10px] text-text-dim shrink-0">Rate:</span>
                {RATE_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setV4VSatsPerMinute(rate)}
                    className={`text-[10px] px-1.5 py-0.5 rounded-sm transition-colors ${
                      v4vSatsPerMinute === rate
                        ? "bg-accent/20 text-accent"
                        : "text-text-dim hover:text-text"
                    }`}
                  >
                    {rate}
                  </button>
                ))}
                <span className="text-[9px] text-text-dim">/min</span>
              </div>

              {/* Boost */}
              <div className="flex items-center gap-1 border-t border-border pt-2">
                <input
                  type="number"
                  value={boostAmount}
                  onChange={(e) => setBoostAmount(e.target.value)}
                  className="w-16 bg-bg-raised border border-border rounded-sm px-1.5 py-0.5 text-[10px] text-text"
                  min="1"
                />
                <button
                  onClick={handleBoost}
                  disabled={boosting}
                  className="text-[10px] text-accent hover:text-accent-hover px-2 py-0.5 bg-accent/10 rounded-sm disabled:opacity-40"
                >
                  {boosting ? "..." : "boost"}
                </button>
              </div>

              {v4vTotalStreamed > 0 && (
                <div className="text-[9px] text-text-dim mt-2">
                  Total streamed: {v4vTotalStreamed} sats
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
