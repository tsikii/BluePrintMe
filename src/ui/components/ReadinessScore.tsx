import React from "react";

interface ReadinessItem {
  docType: string;
  label: string;
  status: "complete" | "partial" | "missing" | "stale";
  detail?: string;
}

interface Props {
  score: number;
  items: ReadinessItem[];
}

export function ReadinessScore({ score, items }: Props) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const dashOffset = circumference - progress;

  const scoreColor =
    score >= 80
      ? { stroke: "#22c55e", text: "text-green-400", bg: "text-green-500" }
      : score >= 50
        ? { stroke: "#eab308", text: "text-yellow-400", bg: "text-yellow-500" }
        : { stroke: "#ef4444", text: "text-red-400", bg: "text-red-500" };

  const statusIcon = (status: ReadinessItem["status"]) => {
    switch (status) {
      case "complete":
        return (
          <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        );
      case "partial":
        return (
          <svg className="h-3.5 w-3.5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
          </svg>
        );
      case "stale":
        return (
          <svg className="h-3.5 w-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "missing":
        return (
          <svg className="h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
    }
  };

  return (
    <div className="border-t border-zinc-800 px-4 py-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" className="mx-auto block">
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke="#27272a"
              strokeWidth="6"
            />
            {/* Progress circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke={scoreColor.stroke}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 48 48)"
              className="transition-all duration-700 ease-out"
            />
            {/* Score text */}
            <text
              x="48"
              y="44"
              textAnchor="middle"
              className={`text-xl font-bold ${scoreColor.text}`}
              fill="currentColor"
              style={{ fontSize: "1.25rem", fontWeight: 700 }}
            >
              {score}%
            </text>
            <text
              x="48"
              y="60"
              textAnchor="middle"
              fill="#71717a"
              style={{ fontSize: "0.55rem" }}
            >
              Readiness
            </text>
          </svg>
        </div>
      </div>

      {/* Status list */}
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.docType}
            className="flex items-center gap-2 rounded px-2 py-1 text-xs"
          >
            {statusIcon(item.status)}
            <span className="flex-1 truncate text-zinc-400">{item.label}</span>
            <span
              className={`text-[10px] font-medium uppercase tracking-wide ${
                item.status === "complete"
                  ? "text-green-600"
                  : item.status === "partial"
                    ? "text-yellow-600"
                    : item.status === "stale"
                      ? "text-orange-600"
                      : "text-red-600"
              }`}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
