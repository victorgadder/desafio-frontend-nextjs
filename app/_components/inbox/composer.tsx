import type { FormEvent } from "react";

export function Composer({
  value,
  disabled,
  isSending,
  isSuggesting,
  error,
  onChange,
  onSubmit,
  onSuggest,
}: {
  value: string;
  disabled: boolean;
  isSending: boolean;
  isSuggesting: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSuggest: () => void;
}) {
  return (
    <form className="shrink-0 space-y-3 bg-white p-4" onSubmit={onSubmit}>
      <label className="block">
        <span className="sr-only">Mensagem</span>
        <textarea
          value={value}
          disabled={disabled || isSending}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-20 w-full resize-none rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="Digite uma resposta para o cliente"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-5 text-sm text-red-600" role={error ? "alert" : undefined}>
          {error}
        </div>
        <div className="flex gap-2">
          <button
            className="h-10 rounded border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={disabled || isSuggesting}
            onClick={onSuggest}
          >
            {isSuggesting ? "Sugerindo..." : "Sugerir com IA"}
          </button>
          <button
            className="h-10 rounded bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
