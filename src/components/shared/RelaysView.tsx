import { getNDK } from "../../lib/nostr";

export function RelaysView() {
  const ndk = getNDK();
  const relays = Array.from(ndk.pool?.relays?.values() ?? []);

  return (
    <div className="h-full flex flex-col">
      <header className="border-b border-border px-4 py-2.5 shrink-0">
        <h1 className="text-text text-sm font-medium tracking-wide">Relays</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {relays.length === 0 ? (
          <p className="text-text-dim text-[12px]">No relays configured.</p>
        ) : (
          <div className="space-y-1">
            {relays.map((relay) => (
              <div
                key={relay.url}
                className="flex items-center gap-3 px-3 py-2 border border-border text-[12px]"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    relay.connected ? "bg-success" : "bg-danger"
                  }`}
                />
                <span className="text-text truncate flex-1 font-mono">{relay.url}</span>
                <span className="text-text-dim shrink-0">
                  {relay.connected ? "connected" : "disconnected"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
