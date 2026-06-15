import type { Conversation } from "@/lib/api";

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatConversationDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function formatPhone(phone: string) {
  if (phone.length !== 13) return phone;

  return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
}

export function searchConversations(conversations: Conversation[], search: string) {
  const term = normalizeText(search);
  if (!term) return conversations;

  return conversations.filter((conversation) => {
    const searchable = normalizeText(
      `${conversation.contactName} ${conversation.contactPhone} ${conversation.lastMessage}`,
    );
    return searchable.includes(term);
  });
}
