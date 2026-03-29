import { requireUserId } from "@/lib/auth";
import { getApiKeysByUser } from "@/lib/db";
import { GenerateKeyButton, RevokeKeyButton } from "./ApiKeyActions";

export default async function ApiKeysPage() {
  const userId = await requireUserId();
  const keys = await getApiKeysByUser(userId);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate an API key to connect the IGTP daemon running on your machine.
        </p>
      </div>

      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
          Generate a new key
        </h2>
        <GenerateKeyButton />
        <p className="text-xs text-muted-foreground mt-2">
          You&apos;ll need this key when you install the daemon on your machine.
        </p>
      </div>

      {keys.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Your keys ({keys.length})
          </h2>
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-3 ring-1 ring-foreground/5"
              >
                <div>
                  <div className="font-mono text-sm text-foreground">
                    {key.keyPrefix}...
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                  </div>
                </div>
                <RevokeKeyButton keyId={key.id} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
