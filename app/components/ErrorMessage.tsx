"use client";

interface ErrorMessageProps {
  message: string;
  title?: string;
  emoji?: string;
  titleColor?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export default function ErrorMessage({ 
  message, 
  title = "Something went wrong",
  emoji = "😕",
  titleColor = "text-red-400",
  onRetry,
  retryLabel = "Try Again"
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <div className="text-6xl">{emoji}</div>
      <div className="text-center">
        <h3 className={`text-xl font-semibold ${titleColor} mb-2`}>{title}</h3>
        <p className="text-white/50 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-6 py-3 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-all"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

