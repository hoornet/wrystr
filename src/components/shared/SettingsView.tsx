export function SettingsView() {
  return (
    <div className="h-full flex flex-col">
      <header className="border-b border-border px-4 py-2.5 shrink-0">
        <h1 className="text-text text-sm font-medium tracking-wide">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-text-dim text-[12px]">
          Settings will appear here — key management, relay config, Lightning wallet connection, appearance.
        </p>
      </div>
    </div>
  );
}
