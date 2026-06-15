import type { FormEvent, KeyboardEvent } from "react";

export function Composer({
  value,
  disabled,
  isSending,
  isSuggesting,
  sendWithEnter,
  error,
  onChange,
  onSendWithEnterChange,
  onSubmit,
  onSendRequest,
  onSuggest,
}: {
  value: string;
  disabled: boolean;
  isSending: boolean;
  isSuggesting: boolean;
  sendWithEnter: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onSendWithEnterChange: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSendRequest: () => void;
  onSuggest: () => void;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!sendWithEnter || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;

    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onSendRequest();
    }
  }

  return (
    <form className="shrink-0 space-y-1.5 bg-white p-3 sm:space-y-3 sm:p-4" onSubmit={onSubmit}>
      <label className="block">
        <span className="sr-only">Mensagem</span>
        <textarea
          value={value}
          disabled={disabled || isSending}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          enterKeyHint={sendWithEnter ? "send" : "enter"}
          className="min-h-16 w-full resize-none rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-20"
          placeholder="Digite uma resposta para o cliente"
        />
      </label>

      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-0 text-sm text-red-600 sm:min-h-5" role={error ? "alert" : undefined}>
          {error}
        </div>
        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          <button
            className={`inline-flex h-9 items-center gap-2 rounded border px-2.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:px-4 sm:text-sm ${
              sendWithEnter
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            type="button"
            aria-pressed={sendWithEnter}
            aria-label="Enviar mensagem com ENTER"
            onClick={() => onSendWithEnterChange(!sendWithEnter)}
          >
            <span
              className={`relative h-4 w-7 rounded-full transition ${
                sendWithEnter ? "bg-emerald-500" : "bg-slate-300"
              }`}
              aria-hidden="true"
            >
              <span
                className={`absolute top-0.5 size-3 rounded-full bg-white transition ${
                  sendWithEnter ? "left-3.5" : "left-0.5"
                }`}
              />
            </span>
            Enviar com ENTER
          </button>
          <button
            className="h-9 rounded border border-slate-200 px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:px-4 sm:text-sm"
            type="button"
            disabled={disabled || isSuggesting}
            onClick={onSuggest}
          >
            {isSuggesting ? "IA..." : "Sugerir IA"}
          </button>
          <button
            className="h-9 rounded bg-emerald-600 px-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:px-4 sm:text-sm"
            type="submit"
            disabled={disabled || isSending || value.trim().length === 0}
          >
            {isSending ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </form>
  );
}
