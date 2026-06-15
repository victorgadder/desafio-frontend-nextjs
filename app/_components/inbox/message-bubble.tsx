import type { Message } from "@/lib/api";
import { formatTime } from "./utils";

export function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === "out";

  return (
    <div
      className={`max-w-[82%] rounded px-3 py-2 shadow-sm sm:max-w-[68%] ${
        isOutbound ? "bg-[#dcf8c6] dark:bg-emerald-900" : "bg-white dark:bg-slate-800"
      }`}
    >
      <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
      <div className="mt-1 flex items-center justify-end gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
        {isOutbound ? <span>{message.status}</span> : null}
      </div>
    </div>
  );
}
