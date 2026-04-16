import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Lock, Plus, Trash2, Loader2, ArrowLeft, Users, Calendar,
  ClipboardList, CheckCircle2, AlertCircle,
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

  // Add name
  const [newName, setNewName] = useState("");
  const [nameMsg, setNameMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Add date
  const [newDate, setNewDate] = useState("");
  const [dateMsg, setDateMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleLogin = async () => {
    if (!pinInput.trim()) return;
    setPinLoading(true);
    setPinError("");
    const valid = await verifyPin(pinInput.trim());
    if (valid) {
      setPin(pinInput.trim());
      loadAll(pinInput.trim());
    } else {
      setPinError("Incorrect PIN. Please try again.");
    }
    setPinLoading(false);
  };

  const loadAll = async (p: string) => {
    setLoading(true);
    try {
      const [cfg, subs] = await Promise.all([getConfig(), getSubmissions(p)]);
      setConfig(cfg);
      setSubmissions(subs);
    } finally {
      setLoading(false);
    }
  };

  const handleAddName = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await addName(name, pin);
      setNewName("");
      setNameMsg({ type: "ok", text: `"${name}" added.` });
      setConfig((prev) => prev ? { ...prev, names: [...prev.names, name].sort() } : prev);
    } catch {
      setNameMsg({ type: "err", text: "Failed to add name." });
    }
    setTimeout(() => setNameMsg(null), 3000);
  };

  const handleRemoveName = async (name: string) => {
    if (!confirm(`Remove "${name}" from the list?`)) return;
    try {
      await removeName(name, pin);
      setConfig((prev) => prev ? { ...prev, names: prev.names.filter((n) => n !== name) } : prev);
    } catch {
      alert("Failed to remove name.");
    }
  };

  const handleAddDate = async () => {
    const date = newDate.trim();
    if (!date) return;
    try {
      await addDate(date, pin);
      setNewDate("");
      setDateMsg({ type: "ok", text: `Date added.` });
      setConfig((prev) => prev ? { ...prev, dates: [...prev.dates, date].sort() } : prev);
    } catch {
      setDateMsg({ type: "err", text: "Failed to add date." });
    }
    setTimeout(() => setDateMsg(null), 3000);
  };

  const handleRemoveDate = async (date: string) => {
    if (!confirm(`Remove ${format(parseISO(date), "MMMM d, yyyy")}?`)) return;
    try {
      await removeDate(date, pin);
      setConfig((prev) => prev ? { ...prev, dates: prev.dates.filter((d) => d !== date) } : prev);
    } catch {
      alert("Failed to remove date.");
    }
  };

  if (!pin) {
    return (
      <div className="min-h-screen bg-church-cream flex flex-col">
        <div className="bg-church-blue-dark px-4 py-6 text-center">
          <h1 className="text-white text-xl font-bold">Admin Panel</h1>
          <p className="text-blue-300 text-sm">Relief Society Attendance</p>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-church-blue/10 flex items-center justify-center">
                <Lock className="w-7 h-7 text-church-blue" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-center text-gray-800 mb-1">Enter Admin PIN</h2>
            <p className="text-sm text-gray-400 text-center mb-6">Set your PIN in the Google Sheet Settings tab</p>
            <input
              type="password"
              inputMode="numeric"
              placeholder="PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-church-blue/30 mb-3"
              maxLength={8}
            />
            {pinError && (
              <p className="text-sm text-red-500 text-center mb-3">{pinError}</p>
            )}
            <button
              onClick={handleLogin}
              disabled={pinLoading || !pinInput}
              className="w-full py-3 rounded-xl bg-church-blue text-white font-bold hover:bg-church-blue-light transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {pinLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enter"}
            </button>
            <a href="/" className="flex items-center justify-center gap-1 mt-4 text-sm text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Attendance Form
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-church-cream">
      <div className="bg-church-blue-dark px-4 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-white text-lg font-bold">Admin Panel</h1>
          <p className="text-blue-300 text-xs">Relief Society Attendance</p>
        </div>
        <button
          onClick={() => { setPin(""); setPinInput(""); }}
          className="text-xs text-blue-300 hover:text-white border border-blue-400/30 px-3 py-1.5 rounded-lg"
        >
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        {(["names", "dates", "submissions"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold capitalize flex items-center justify-center gap-1.5 transition-colors ${
              tab === t
                ? "text-church-blue border-b-2 border-church-blue"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "names" && <Users className="w-4 h-4" />}
            {t === "dates" && <Calendar className="w-4 h-4" />}
            {t === "submissions" && <ClipboardList className="w-4 h-4" />}
            <span className="hidden sm:inline">{t}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-church-blue animate-spin" />
        </div>
      ) : (
        <div className="max-w-lg mx-auto px-4 py-6">

          {/* Names Tab */}
          {tab === "names" && (
            <div>
              <h3 className="font-bold text-church-blue-dark mb-4">
                Manage Members <span className="text-gray-400 font-normal text-sm">({config?.names.length ?? 0})</span>
              </h3>

              {/* Add name */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Last, First Middle"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddName()}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-church-blue/30"
                />
                <button
                  onClick={handleAddName}
                  disabled={!newName.trim()}
                  className="px-4 py-2.5 rounded-xl bg-church-blue text-white font-medium text-sm hover:bg-church-blue-light transition disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {nameMsg && (
                <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg mb-3 ${nameMsg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {nameMsg.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {nameMsg.text}
                </div>
              )}

              {/* Name list */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-50">
                {config?.names.sort().map((name) => (
                  <div key={name} className="flex items-center justify-between px-4 py-3 group">
                    <span className="text-sm text-gray-700">{name}</span>
                    <button
                      onClick={() => handleRemoveName(name)}
                      className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dates Tab */}
          {tab === "dates" && (
            <div>
              <h3 className="font-bold text-church-blue-dark mb-4">
                Manage Sundays <span className="text-gray-400 font-normal text-sm">({config?.dates.length ?? 0} dates)</span>
              </h3>

              {/* Add date */}
              <div className="flex gap-2 mb-4">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-church-blue/30"
                />
                <button
                  onClick={handleAddDate}
                  disabled={!newDate}
                  className="px-4 py-2.5 rounded-xl bg-church-blue text-white font-medium text-sm hover:bg-church-blue-light transition disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {dateMsg && (
                <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg mb-3 ${dateMsg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {dateMsg.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {dateMsg.text}
                </div>
              )}

              {/* Date list */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-50">
                {config?.dates.sort().map((date) => (
                  <div key={date} className="flex items-center justify-between px-4 py-3 group">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{format(parseISO(date), "EEEE, MMMM d, yyyy")}</p>
                      <p className="text-xs text-gray-400">{date}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveDate(date)}
                      className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submissions Tab */}
          {tab === "submissions" && (
            <div>
              <h3 className="font-bold text-church-blue-dark mb-4">
                Recent Submissions <span className="text-gray-400 font-normal text-sm">({submissions.length})</span>
              </h3>
              <div className="space-y-3">
                {submissions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No submissions yet.</p>
                ) : (
                  submissions.map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{s.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Submitted {format(new Date(s.timestamp), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {s.dates.split(",").map((d) => (
                          <span key={d} className="px-2 py-0.5 bg-church-blue/10 text-church-blue text-xs rounded-full">
                            {d.trim() ? (() => { try { return format(parseISO(d.trim()), "MMM d"); } catch { return d.trim(); } })() : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
