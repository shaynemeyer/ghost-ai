import Link from "next/link";
import { Lock } from "lucide-react";

export function AccessDenied() {
  return (
    <div className="flex h-screen items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-4 text-center">
        <Lock className="h-8 w-8 text-copy-muted" />
        <h1 className="text-lg font-semibold text-copy-primary">Access denied</h1>
        <p className="max-w-xs text-sm text-copy-muted">
          This project does not exist or you do not have access.
        </p>
        <Link href="/editor" className="text-sm text-brand hover:underline">
          Back to editor
        </Link>
      </div>
    </div>
  );
}
