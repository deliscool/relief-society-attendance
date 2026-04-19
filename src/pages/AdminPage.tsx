import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Lock, Plus, Trash2, Loader2, ArrowLeft,
  Users, CalendarDays, ClipboardList, CheckCircle2, AlertCircle, LogOut,
} from "lucide-react";
import {
  getConfig, addName, removeName, addDate, removeDate,
  getSubmissions, verifyPin, type Config, type Submission,
} from "../lib/api";

type Tab = "names" | "dates" | "submissions";

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  const [config, setConfig] = useState<Config | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tab, setTab] = useState<Tab>("names");
  const [loading, setLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [nameMsg, setNameMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [newDate, setNewDate] = useState("");
  const [dateMsg, setDateMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleLogin = async () => {
    if (!pinInput.trim()) return;
    setPinLoading(true);
    setPinError("");
    const valid = await verifyPin(pinInput.trim());
    if (valid) {
      setPin(pinInput.trim());
      setLoading(true);
      try {
        const [cfg, subs] = await Promise.all([getConfig(), getSubmissions(pinInput.trim())]);
        setConfig(cfg);
        setSubmissions(subs);
      } finally {
        setLoading(false);
      }
    } else {
      setPinError("Incorrect PIN. Please try again.");
    }
    setPinLoading(false);
  };

  const handleAddName = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await addName(name, pin);
      setNewName("");
      setNameMsg({ type: "ok", text: `"${name}" added successfully.` });
      setConfig((prev) => prev ? { ...prev, names: [...prev.names, name].sort() } : prev);
    } catch {
      setNameMsg({ type: "err", text: "Failed to add name. Please try again." });
    }
    setTimeout(() => setNameMsg(null), 4000);
  };

  const handleRemoveName = async (name: string) => {
    if (!confirm(`Remove "${name}" from the list?`)) return;
    try {
      await removeName(name, pin);
      setConfig((prev) => prev ? { ...prev, names: prev.names.filter((n) => n !== name) } : prev);
    } catch {
      alert("Failed to remove. Please try again.");
    }
  };

  const handleAddDate = async () => {
    const date = newDate.trim();
    if (!date) return;
    try {
      await addDate(date, pin);
      setNewDate("");
      setDateMsg({ type: "ok", text: "Date added successfully." });
      setConfig((prev) => prev ? { ...prev, dates: [...prev.dates, date].sort() } : prev);
    } catch {
      setDateMsg({ type: "err", text: "Failed to add date. Please try again." });
    }
    setTimeout(() => setDateMsg(null), 4000);
  };

  const handleRemoveDate = async (date: string) => {
    if (!confirm(`Remove ${format(parseISO(date), "MMMM d, yyyy")} from the list?`)) return;
    try {
      await removeDate(date, pin);
      setConfig((prev) => prev ? { ...prev, dates: prev.dates.filter((d) => d !== date) } : prev);
    } catch {
      alert("Failed to remove. Please try again.");
    }
  };

  // ─── PIN Gate ───────────────────────────────────
  if (!pin) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="bg-navy px-6 pt-8 pb-6 text-center">
          <p className="font-serif italic text-gold text-base tracking-wide mb-2">
            "Charity Never Faileth"
          </p>
          <h1 className="font-serif text-white text-3xl font-bold">Admin Panel</h1>
          <p className="text-blue-200 text-sm font-sans mt-1">Relief Society Attendance</p>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-navy/10 border-2 border-navy/20 flex items-center justify-center">
                <Lock className="w-9 h-9 text-navy" />
              </div>
            </div>

            <h2 className="font-serif text-navy text-2xl font-bold text-center mb-2">
              Enter Your PIN
            </h2>
            <p className="text-gray-500 text-base text-center mb-8 font-sans">
              Your PIN is set in the Google Sheet Settings tab.
            </p>

            <input
              type="password"
              inputMode="numeric"
              placeholder="• • • •"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full border-2 border-navy/20 rounded-2xl px-6 py-4 text-center text-3xl tracking-[0.5em] font-sans text-navy focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/10 mb-3"
              style={{ minHeight: 64 }}
              maxLength={8}
            />

            {pinError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-red-700 font-semibold text-base">{pinError}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={pinLoading || !pinInput}
              className="w-full py-4 rounded-2xl bg-navy text-white font-serif font-bold text-xl hover:bg-navy-light transition disabled:opacity-40 flex items-center justify-center gap-3 mb-6"
              style={{ minHeight: 64 }}
            >
              {pinLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Enter Admin Panel"}
            </button>

            <a
              href="/"
              className="flex items-center justify-center gap-2 text-base text-gray-400 hover:text-navy font-sans min-h-touch"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Attendance Form
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Admin Panel ────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-navy px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-white text-xl font-bold">Admin Panel</h1>
          <p className="text-blue-300 text-sm font-sans">Relief Society Attendance</p>
        </div>
        <button
          onClick={() => { setPin(""); setPinInput(""); }}
          className="flex flex-col items-center gap-1 text-blue-200 hover:text-white transition min-h-touch min-w-touch justify-center px-2"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs font-sans">Sign Out</span>
        </button>
      </header>

      {/* ── Bottom-style visible tab bar (at top for accessibility) ── */}
      <nav className="bg-white border-b-2 border-navy/10 flex sticky top-0 z-10 shadow-sm">
        {([
          { id: "names", label: "Members", icon: Users },
          { id: "dates", label: "Sundays", icon: CalendarDays },
          { id: "submissions", label: "Submissions", icon: ClipboardList },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 font-sans font-semibold text-sm transition-colors ${
              tab === id
                ? "text-navy border-b-4 border-navy bg-navy/5"
                : "text-gray-400 hover:text-navy border-b-4 border-transparent"
            }`}
            style={{ minHeight: 64 }}
          >
            <Icon className="w-6 h-6" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-navy animate-spin" />
          <p className="text-navy font-semibold text-lg font-sans">Loading…</p>
        </div>
      ) : (
        <main className="flex-1 px-6 py-8 max-w-xl mx-auto w-full">

          {/* ── Members Tab ── */}
          {tab === "names" && (
            <div>
              <h2 className="font-serif text-navy text-2xl font-bold mb-1">
                Manage Members
              </h2>
              <p className="text-gray-500 text-base mb-6 font-sans">
                {config?.names.length ?? 0} members on the list
              </p>

              {/* Add name */}
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Last, First Middle"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddName()}
                  className="flex-1 border-2 border-navy/20 rounded-2xl px-4 py-3 text-base text-navy font-sans focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/10"
                  style={{ minHeight: 56 }}
                />
                <button
                  onClick={handleAddName}
                  disabled={!newName.trim()}
                  className="flex flex-col items-center justify-center gap-1 px-4 rounded-2xl bg-navy text-white font-sans font-semibold text-sm hover:bg-navy-light transition disabled:opacity-40 shrink-0"
                  style={{ minHeight: 56, minWidth: 64 }}
                >
                  <Plus className="w-5 h-5" />
                  <span>Add</span>
                </button>
              </div>

              {nameMsg && (
                <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-4 text-base font-sans font-semibold ${
                  nameMsg.type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {nameMsg.type === "ok"
                    ? <CheckCircle2 className="w-5 h-5 shrink-0" />
                    : <AlertCircle className="w-5 h-5 shrink-0" />}
                  {nameMsg.text}
                </div>
              )}

              <div className="rounded-2xl border-2 border-navy/15 overflow-hidden">
                {(config?.names ?? []).sort().map((name, i) => (
                  <div
                    key={name}
                    className={`flex items-center justify-between px-5 gap-4 ${i !== 0 ? "border-t border-navy/8" : ""}`}
                    style={{ minHeight: 56 }}
                  >
                    <span className="text-navy text-base font-sans font-medium flex-1 py-3">{name}</span>
                    <button
                      onClick={() => handleRemoveName(name)}
                      className="flex flex-col items-center gap-0.5 text-gray-300 hover:text-red-500 transition shrink-0 min-h-touch min-w-touch justify-center"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="text-xs font-sans">Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Sundays Tab ── */}
          {tab === "dates" && (
            <div>
              <h2 className="font-serif text-navy text-2xl font-bold mb-1">
                Manage Sundays
              </h2>
              <p className="text-gray-500 text-base mb-6 font-sans">
                {config?.dates.length ?? 0} dates available
              </p>

              {/* Add date */}
              <div className="flex gap-3 mb-4">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="flex-1 border-2 border-navy/20 rounded-2xl px-4 py-3 text-base text-navy font-sans focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/10"
                  style={{ minHeight: 56 }}
                />
                <button
                  onClick={handleAddDate}
                  disabled={!newDate}
                  className="flex flex-col items-center justify-center gap-1 px-4 rounded-2xl bg-navy text-white font-sans font-semibold text-sm hover:bg-navy-light transition disabled:opacity-40 shrink-0"
                  style={{ minHeight: 56, minWidth: 64 }}
                >
                  <Plus className="w-5 h-5" />
                  <span>Add</span>
                </button>
              </div>

              {dateMsg && (
                <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-4 text-base font-sans font-semibold ${
                  dateMsg.type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {dateMsg.type === "ok"
                    ? <CheckCircle2 className="w-5 h-5 shrink-0" />
                    : <AlertCircle className="w-5 h-5 shrink-0" />}
                  {dateMsg.text}
                </div>
              )}

              <div className="rounded-2xl border-2 border-navy/15 overflow-hidden">
                {(config?.dates ?? []).sort().map((date, i) => (
                  <div
                    key={date}
                    className={`flex items-center justify-between px-5 gap-4 ${i !== 0 ? "border-t border-navy/8" : ""}`}
                    style={{ minHeight: 64 }}
                  >
                    <div className="flex-1 py-3">
                      <p className="text-navy text-base font-semibold font-sans">
                        {format(parseISO(date), "EEEE, MMMM d, yyyy")}
                      </p>
                      <p className="text-gray-400 text-sm font-sans">{date}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveDate(date)}
                      className="flex flex-col items-center gap-0.5 text-gray-300 hover:text-red-500 transition shrink-0 min-h-touch min-w-touch justify-center"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="text-xs font-sans">Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Submissions Tab ── */}
          {tab === "submissions" && (
            <div>
              <h2 className="font-serif text-navy text-2xl font-bold mb-1">
                Submissions
              </h2>
              <p className="text-gray-500 text-base mb-6 font-sans">
                {submissions.length} total submissions
              </p>

              {submissions.length === 0 ? (
                <div className="text-center py-16 text-gray-400 font-sans text-base">
                  No submissions yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((s, i) => (
                    <div key={i} className="rounded-2xl border-2 border-navy/15 px-5 py-4">
                      <p className="font-serif font-bold text-navy text-lg leading-tight">{s.name}</p>
                      <p className="text-gray-400 text-sm font-sans mt-0.5 mb-3">
                        {(() => {
                          try {
                            const d = new Date(s.timestamp);
                            if (isNaN(d.getTime())) return "Date unavailable";
                            return new Intl.DateTimeFormat("en-US", {
                              timeZone: "America/Denver",
                              month: "long", day: "numeric", year: "numeric",
                              hour: "numeric", minute: "2-digit",
                            }).format(d);
                          } catch { return "Date unavailable"; }
                        })()}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {s.dates.split(",").map((d) => (
                          <span key={d} className="px-3 py-1.5 bg-navy text-white text-sm font-semibold rounded-lg font-sans">
                            {(() => { try { return format(parseISO(d.trim()), "MMM d"); } catch { return d.trim(); } })()}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      )}
    </div>
  );
}
