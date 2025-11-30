"use client";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <div className="text-6xl">😕</div>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-red-400 mb-2">Something went wrong</h3>
        <p className="text-white/50 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-6 py-3 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-all"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

