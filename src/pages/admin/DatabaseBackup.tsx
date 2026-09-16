import { useMemo, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CircleStackIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../config/api";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";
import { RootState } from "../../store";

const getDownloadName = (contentDisposition: string | null) => {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/^"|"$/g, ""));
    } catch {
      return utf8Match[1].replace(/^"|"$/g, "");
    }
  }

  const normalMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return normalMatch?.[1] ?? null;
};

const readError = async (response: Response, fallback: string) => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
    const message =
      payload?.message ??
      payload?.Message ??
      payload?.title ??
      payload?.Title ??
      payload?.error ??
      payload?.Error;

    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  const text = await response.text().catch(() => "");
  return text || fallback;
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const DatabaseBackup = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const canRestore = useMemo(
    () => Boolean(selectedFile) && confirmation.trim().toUpperCase() === "RESTORE" && !isRestoring,
    [confirmation, isRestoring, selectedFile],
  );

  const handleExport = async () => {
    if (!token || isExporting) return;

    setIsExporting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/database-backup/export`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          await readError(
            response,
            isBg ? "Архивът не можа да бъде създаден." : "The backup could not be created.",
          ),
        );
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fallbackName = `higiatrade-full-database-${new Date().toISOString().replace(/[:.]/g, "-")}.dump`;

      link.href = objectUrl;
      link.download = getDownloadName(response.headers.get("content-disposition")) ?? fallbackName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);

      toast.success(isBg ? "Пълният backup е свален." : "The full backup was downloaded.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isBg
            ? "Грешка при създаване на backup."
            : "Backup creation failed.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestore = async () => {
    if (!token || !selectedFile || !canRestore) return;

    const finalConfirmation = window.confirm(
      isBg
        ? "Това ще замени текущото съдържание на базата с данните от избрания backup. Продължаване?"
        : "This will replace the current database contents with the selected backup. Continue?",
    );

    if (!finalConfirmation) return;

    setIsRestoring(true);

    try {
      const formData = new FormData();
      formData.append("archive", selectedFile);

      const response = await fetch(`${API_BASE_URL}/database-backup/restore`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await readError(
            response,
            isBg ? "Базата не можа да бъде възстановена." : "The database could not be restored.",
          ),
        );
      }

      setSelectedFile(null);
      setConfirmation("");
      toast.success(isBg ? "Базата е възстановена успешно." : "Database restored successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isBg
            ? "Грешка при възстановяване на базата."
            : "Database restore failed.",
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_70px_-55px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 sm:text-sm sm:tracking-[0.28em]">
              {isBg ? "Администрация" : "Administration"}
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {isBg ? "Backup и възстановяване" : "Backup and restore"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {isBg
                ? "Експортира цялата PostgreSQL база: всички таблици, записи, връзки, sequence-и, индекси, constraints, миграции и бинарни данни, които се пазят в базата."
                : "Exports the complete PostgreSQL database: every table, row, relationship, sequence, index, constraint, migration and binary value stored in the database."}
            </p>
          </div>
          <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-slate-950 text-white">
            <CircleStackIcon className="h-6 w-6" />
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ArrowDownTrayIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-950">
                {isBg ? "Експорт на пълен backup" : "Export full backup"}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {isBg
                  ? "Създава PostgreSQL custom-format .dump архив на текущото състояние на цялата база."
                  : "Creates a PostgreSQL custom-format .dump archive containing the current state of the entire database."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={isExporting || isRestoring}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isExporting ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <ArrowDownTrayIcon className="h-5 w-5" />}
            {isExporting
              ? isBg ? "Създаване..." : "Creating..."
              : isBg ? "Свали пълен backup" : "Download full backup"}
          </button>
        </section>

        <section className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-red-50 text-red-700">
              <ArrowUpTrayIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-950">
                {isBg ? "Възстановяване от backup" : "Restore from backup"}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {isBg
                  ? "Качи .dump архив, създаден от тази функция. Текущите обекти и данни, които присъстват в архива, ще бъдат заменени."
                  : "Upload a .dump archive created by this feature. Current objects and data represented by the archive will be replaced."}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex gap-3">
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-none" />
              <p>
                {isBg
                  ? "Restore е разрушителна операция. При неуспешно PostgreSQL възстановяване transaction-ът се rollback-ва, но използвай само проверен backup."
                  : "Restore is destructive. A failed PostgreSQL restore is rolled back transactionally, but only use a verified backup."}
              </p>
            </div>
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">
              {isBg ? "Backup файл" : "Backup file"}
            </span>
            <input
              type="file"
              accept=".dump,.backup,application/octet-stream"
              disabled={isRestoring || isExporting}
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
                setConfirmation("");
              }}
              className="block w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
            />
          </label>

          {selectedFile && (
            <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold">{selectedFile.name}</span>
              <span className="ml-2 text-slate-500">({formatBytes(selectedFile.size)})</span>
            </div>
          )}

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">
              {isBg ? "Напиши RESTORE за потвърждение" : "Type RESTORE to confirm"}
            </span>
            <input
              type="text"
              value={confirmation}
              disabled={!selectedFile || isRestoring || isExporting}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 disabled:text-slate-400"
              placeholder="RESTORE"
            />
          </label>

          <button
            type="button"
            onClick={() => void handleRestore()}
            disabled={!canRestore || isExporting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isRestoring ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <ArrowUpTrayIcon className="h-5 w-5" />}
            {isRestoring
              ? isBg ? "Възстановяване..." : "Restoring..."
              : isBg ? "Възстанови базата" : "Restore database"}
          </button>
        </section>
      </div>
    </div>
  );
};

export default DatabaseBackup;
