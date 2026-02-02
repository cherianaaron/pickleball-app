"use client";

export default function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-lime-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center p-3">
          <img src="/picklebracket-logo.svg" alt="Loading" className="w-full h-full" />
        </div>
      </div>
      <p className="text-white/50 text-lg animate-pulse">{message}</p>
    </div>
  );
}

