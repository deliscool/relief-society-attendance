import { useEffect, useState } from "react";
import { format, parseISO, isValid } from "date-fns";

function safeFormat(dateStr: string, fmt: string, fallback = dateStr): string {
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, fmt) : fallback;
  } catch {
    return fallback;
  }
}
import { CheckCircle2, Search, Loader2, CalendarDays, UserCheck, Send } from "lucide-react";
import { getConfig, submitAttendance, type Config } from "../lib/api";

type Step = "name" | "dates" | "success";

export default function AttendancePage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("name");

  const [search, setSearch] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    getConfig()
      .then(setConfig)
      .catch(() => setError("Unable to load the form. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const filteredNames = (config?.names ?? [])
    .filter((n) => n.toLowerCase().includes(search.toLowerCase()))
    .sort();

  const toggleDate = (date: string) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const handleSubmit = async () => {
    if (!selectedName || selectedDates.length === 0) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await submitAttendance(selectedName, selectedDates);
      setStep("success");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep("name");
    setSelectedName("");
    setSelectedDates([]);
    setSearch("");
    setSubmitError("");
  };

  // ─── Loading ───────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="w-10 h-10 text-navy animate-spin" />
        <p className="text-navy font-semibold text-lg">Loading…</p>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-sm w-full text-center">
          <p className="text-red-700 font-semibold text-lg mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full min-h-touch bg-navy text-white rounded-2xl font-semibold text-lg px-6 py-4"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Header ── */}
      <header className="bg-navy px-6 pt-8 pb-6 text-center">
        <p className="font-serif italic text-gold text-base tracking-wide mb-2">
          "Charity Never Faileth"
        </p>
        <h1 className="font-serif text-white text-3xl font-bold mb-1">
          Relief Society
        </h1>
        <p className="text-blue-200 text-sm font-sans">
          Foothills Ward · 2026 Attendance Roll
        </p>
      </header>

      {/* ── Progress indicator ── */}
      <div className="bg-navy/5 border-b border-navy/10 px-6 py-3 flex items-center gap-3">
        <StepDot n={1} active={step === "name"} done={step !== "name"} />
        <div className="flex-1 h-0.5 bg-navy/20 rounded" />
        <StepDot n={2} active={step === "dates"} done={step === "success"} />
        <div className="flex-1 h-0.5 bg-navy/20 rounded" />
        <StepDot n={3} active={step === "success"} done={false} />
      </div>

      <main className="flex-1 px-6 py-8 max-w-xl mx-auto w-full">

        {/* ── Step 1: Select Name ── */}
        {step === "name" && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <UserCheck className="w-6 h-6 text-gold shrink-0" />
              <h2 className="font-serif text-navy text-2xl font-bold">Step 1: Your Name</h2>
            </div>
            <p className="text-gray-600 mb-6">Find and tap your name below.</p>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-navy/40" />
              <input
                type="text"
                placeholder="Type to search your name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-navy/20 bg-white text-navy text-base font-sans focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/10"
                style={{ minHeight: 56 }}
              />
            </div>

            {/* Name list */}
            <div className="rounded-2xl border-2 border-navy/15 overflow-hidden shadow-sm">
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-navy/8">
                {filteredNames.length === 0 ? (
                  <p className="px-6 py-8 text-center text-gray-500 text-base">
                    No names found. Try a different spelling.
                  </p>
                ) : (
                  filteredNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => { setSelectedName(name); setStep("dates"); }}
                      className="w-full text-left px-6 py-4 text-navy text-base font-semibold hover:bg-navy/5 active:bg-navy/10 transition-colors flex items-center justify-between gap-4"
                      style={{ minHeight: 56 }}
                    >
                      <span>{name}</span>
                      <span className="text-navy/30 text-sm shrink-0">Tap →</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <p className="text-center text-gray-400 text-sm mt-4">
              {config?.names.length ?? 0} members listed
            </p>
          </div>
        )}

        {/* ── Step 2: Select Dates ── */}
        {step === "dates" && (
          <div>
            {/* Who is attending chip */}
            <div className="flex items-center gap-4 bg-navy/5 border-2 border-navy/15 rounded-2xl px-5 py-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center text-white font-serif font-bold text-xl shrink-0">
                {selectedName.split(",")[1]?.trim()[0] ?? selectedName[0] ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-sans uppercase tracking-wider mb-0.5">Marking attendance for</p>
                <p className="font-serif font-bold text-navy text-lg leading-tight truncate">{selectedName}</p>
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-gold font-semibold hover:underline shrink-0 px-2 min-h-touch flex items-center"
              >
                Change
              </button>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <CalendarDays className="w-6 h-6 text-gold shrink-0" />
              <h2 className="font-serif text-navy text-2xl font-bold">Step 2: Dates Attended</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Select all Sundays you attended. You can choose more than one.
            </p>

            {/* Date list */}
            {(config?.dates ?? []).length === 0 ? (
              <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 px-6 py-8 text-center mb-6">
                <p className="text-amber-800 font-semibold text-base mb-1">No dates available yet.</p>
                <p className="text-amber-700 text-sm">Please ask your admin to add upcoming Sundays.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {(config?.dates ?? []).sort().map((date) => {
                  const checked = selectedDates.includes(date);
                  return (
                    <button
                      key={date}
                      onClick={() => toggleDate(date)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all text-left ${
                        checked
                          ? "border-navy bg-navy text-white shadow-lg"
                          : "border-navy/20 bg-white text-navy hover:border-navy/40"
                      }`}
                      style={{ minHeight: 64 }}
                    >
                      <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                        checked ? "bg-gold border-gold" : "border-navy/30 bg-white"
                      }`}>
                        {checked && <CheckCircle2 className="w-5 h-5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base leading-tight">
                          {safeFormat(date, "EEEE, MMMM d")}
                        </p>
                        <p className={`text-sm mt-0.5 ${checked ? "text-blue-200" : "text-gray-400"}`}>
                          {safeFormat(date, "yyyy")}
                        </p>
                      </div>
                      {checked && (
                        <span className="text-gold font-bold text-sm shrink-0">✓ Selected</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedDates.length > 0 && (
              <div className="bg-gold/10 border border-gold/30 rounded-xl px-4 py-3 text-center mb-4">
                <p className="text-gold-dark font-semibold text-base">
                  {selectedDates.length} {selectedDates.length === 1 ? "Sunday" : "Sundays"} selected
                </p>
              </div>
            )}

            {submitError && (
              <p className="text-red-700 font-semibold text-center mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {submitError}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={selectedDates.length === 0 || submitting}
              className="w-full py-5 rounded-2xl bg-navy text-white font-serif font-bold text-xl shadow-lg hover:bg-navy-light active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              style={{ minHeight: 64 }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Submitting…</span>
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  <span>Submit Attendance</span>
                </>
              )}
            </button>
            <p className="text-center text-gray-400 text-sm mt-3 font-sans">
              Your record will be saved automatically.
            </p>
          </div>
        )}

        {/* ── Step 3: Success ── */}
        {step === "success" && (
          <div className="text-center py-8">
            <div className="w-24 h-24 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="font-serif text-navy text-3xl font-bold mb-2">Thank You!</h2>
            <p className="font-serif italic text-gold text-lg mb-1">"Charity Never Faileth"</p>
            <p className="text-gray-600 text-base mb-6">
              Your attendance has been recorded.
            </p>

            <div className="bg-navy/5 border border-navy/15 rounded-2xl px-5 py-4 mb-2 text-left">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-sans mb-1">Member</p>
              <p className="font-serif font-bold text-navy text-lg">{selectedName}</p>
            </div>
            <div className="bg-navy/5 border border-navy/15 rounded-2xl px-5 py-4 mb-8 text-left">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-sans mb-2">Dates Recorded</p>
              <div className="flex flex-wrap gap-2">
                {selectedDates.sort().map((d) => (
                  <span key={d} className="px-3 py-1.5 bg-navy text-white text-sm font-semibold rounded-lg">
                    {safeFormat(d, "MMM d, yyyy")}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-4 rounded-2xl border-2 border-navy text-navy font-serif font-bold text-lg hover:bg-navy hover:text-white transition-all"
              style={{ minHeight: 56 }}
            >
              Submit for Another Member
            </button>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-navy/10 py-4 text-center">
        <a
          href="/admin"
          className="text-sm text-gray-400 hover:text-navy inline-flex items-center gap-1 min-h-touch px-4 justify-center"
        >
          Admin Access
        </a>
      </footer>
    </div>
  );
}

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-sans shrink-0 transition-all ${
      done ? "bg-green-500 text-white" :
      active ? "bg-navy text-white" :
      "bg-navy/15 text-navy/40"
    }`}>
      {done ? "✓" : n}
    </div>
  );
}
