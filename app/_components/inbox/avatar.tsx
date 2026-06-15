import type { Conversation } from "@/lib/api";
import { initials } from "./utils";

export function Avatar({ conversation }: { conversation: Conversation }) {
  return (
    <span
      className="grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
      style={{ backgroundColor: conversation.avatarColor }}
      aria-hidden="true"
    >
      {initials(conversation.contactName)}
    </span>
  );
}
