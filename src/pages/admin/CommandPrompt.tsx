import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

const commands = [
  "/products all price 100",
  "/products all quantity 100",
  "/products all price 100 quantity 100",
  "/help",
  "/clear",
];

type Output = { command: string; message: string; error?: boolean };
type Result = { affectedProducts: number; price: number | null; quantity: number | null };

export default function CommandPrompt() {
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const bg = language === "bg";
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState<Output[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [position, setPosition] = useState(0);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const help = bg
    ? "Всички неизтрити продукти, включително неактивните и всички категории. Цената е в EUR с ДДС; премахва отстъпките и изравнява активните цени на едро. Количеството се заменя, не се добавя."
    : "All non-deleted products, including inactive products and every category. Prices are in EUR including VAT; discounts are removed and enabled wholesale prices are aligned. Quantity is replaced, not added.";

  async function execute(event: FormEvent) {
    event.preventDefault();
    const value = command.trim();
    if (!value || running.current) return;
    setHistory(previous => [...previous, value]);
    setPosition(history.length + 1);
    setCommand("");
    if (value.toLowerCase() === "/clear") { setOutput([]); return; }
    if (value.toLowerCase() === "/help") {
      setOutput(previous => [...previous, { command: value, message: commands.join("\n") + "\n\n" + help }]);
      return;
    }
    running.current = true;
    setBusy(true);
    try {
      if (!token) throw new Error(bg ? "Влезте отново в профила си." : "Please sign in again.");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ command: value }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || (bg ? `Грешка (${response.status}).` : `Error (${response.status}).`));
      const result = payload as Result;
      const details = [
        result.price !== null ? `${bg ? "Цена" : "Price"}: ${result.price} EUR` : "",
        result.quantity !== null ? `${bg ? "Количество" : "Quantity"}: ${result.quantity}` : "",
      ].filter(Boolean).join(" · ");
      setOutput(previous => [...previous, { command: value, message: `${bg ? "Обновени продукти" : "Updated products"}: ${result.affectedProducts}. ${details}` }]);
    } catch (error) {
      setOutput(previous => [...previous, { command: value, message: error instanceof Error ? error.message : String(error), error: true }]);
    } finally {
      running.current = false;
      setBusy(false);
      requestAnimationFrame(() => input.current?.focus());
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Tab") {
      const match = commands.find(item => item.startsWith(command));
      if (match) { event.preventDefault(); setCommand(match); }
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const next = Math.max(0, Math.min(history.length, position + (event.key === "ArrowUp" ? -1 : 1)));
      setPosition(next);
      setCommand(history[next] ?? "");
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Command Prompt</h1>
        <p className="mt-2 text-sm text-slate-600">{help}</p>
      </header>
      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-xl">
        <div className="border-b border-slate-800 px-5 py-3 font-mono text-sm text-slate-400">HigiaTrade / admin / console</div>
        <div role="log" aria-live="polite" aria-label={bg ? "Резултати от командите" : "Command output"} className="max-h-[50vh] min-h-64 space-y-4 overflow-y-auto p-5 font-mono text-sm">
          <p className="text-slate-400">{bg ? "Въведете /help за командите. Tab: допълване · ↑/↓: история." : "Type /help for commands. Tab: autocomplete · ↑/↓: history."}</p>
          {output.map((entry, index) => <div key={index}>
            <p className="break-words text-slate-400">&gt; {entry.command}</p>
            <p className={`mt-1 whitespace-pre-wrap break-words ${entry.error ? "text-red-400" : "text-emerald-400"}`}>{entry.message}</p>
          </div>)}
          {busy && <p className="text-amber-300">{bg ? "Изпълнява се…" : "Executing…"}</p>}
        </div>
        <form onSubmit={execute} className="flex gap-3 border-t border-slate-800 p-4">
          <span className="py-2 font-mono text-emerald-400" aria-hidden="true">&gt;</span>
          <input ref={input} aria-label={bg ? "Команда" : "Command"} value={command} onChange={event => setCommand(event.target.value)} onKeyDown={onKeyDown} disabled={busy} maxLength={200} autoComplete="off" spellCheck={false} placeholder="/products all price 100 quantity 100" className="min-w-0 flex-1 rounded-lg bg-slate-900 px-3 py-2 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-emerald-400" />
          <button type="submit" disabled={busy || !command.trim()} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40">{bg ? "Изпълни" : "Run"}</button>
        </form>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {commands.map(item => <button key={item} type="button" disabled={busy} onClick={() => { setCommand(item); input.current?.focus(); }} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left font-mono text-xs text-slate-700 hover:border-emerald-500 disabled:opacity-50">{item}</button>)}
      </div>
    </section>
  );
}
