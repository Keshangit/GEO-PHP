import { Loader2 } from "lucide-react";

interface PageLoadingStateProps {
  message?: string;
}

export function PageLoadingState({
  message = "Loading…",
}: PageLoadingStateProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <Loader2 className="size-10 animate-spin text-[#3eb1f1]" aria-hidden />
      <p className="text-sm font-medium text-[#0b2a5b]">{message}</p>
    </div>
  );
}
