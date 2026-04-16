import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Search, Loader2, Calendar, User } from "lucide-react";
import { getConfig, submitAttendance, type Config } from "../lib/api";

type Step = "name" | "dates" | "success";

export default function AttendancePage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("name");

  // Name selection
  const [search, setSearch] = useState("");
  const [selectedName, setSelectedName] = useState("");

  // Date selection
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    getConfig()
      .then(setConfig)
      .catch(() => setError("Unable to load attendance form. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const filteredNames = config?.names
    .filter((n) => n.toLowerCase().includes(search.toLowerCase()))
    .sort() ?? [];

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-cream">
        <Loader2 className="w-8 h-8 text-church-blue animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-cream px-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-church-blue text-white rounded-xl text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-church-cream">
      {/* Header */}
      <div className="bg-church-blue px-4 py-6 text-center shadow-md">
        <p className="text-church-gold-light text-xs font-semibold tracking-widest uppercase mb-1">
          Santaquin Ward
        </p>
        <h1 className="text-white text-2xl font-bold">Relief Society</h1>
        <p className="text-blue-200 text-sm mt-1">Attendance Roll</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Step: Select Name */}
        {step === "name" && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-church-blue text-white flex items-center justify-center text-sm font-bold">1</div>
              <h2 className="text-lg font-bold text-church-blue-dark">Select Your Name</h2>
            </div>

            {/* Search box */}
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search your name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-church-blue/30 focus:border-church-blue"
              />
            </div>

            {/* Name list */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {filteredNames.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-gray-400">No names found</p>
                ) : (
                  filteredNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => {
                        setSelectedName(name);
                        setStep("dates");
                      }}
                      className="w-full text-left px-4 py-3.5 text-sm text-gray-700 hover:bg-church-cream active:bg-blue-50 transition-colors flex items-center gap-3"
                    >
                      <User className="w-4 h-4 text-gray-300 shrink-0" />
                      {name}
                    </button>
                  ))
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              {config?.names.length ?? 0} members · tap your name to continue
            </p>
          </div>
        )}

        {/* Step: Select Dates */}
        {step === "dates" && (
          <div>
            {/* Selected name chip */}
            <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 mb-6">
              <div className="w-9 h-9 rounded-full bg-church-blue flex items-center justify-center text-white text-sm font-bold shrink-0">
                {selectedName.split(" ")[0]?.[0] ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Marking attendance for</p>
                <p className="font-semibold text-gray-800 truncate">{selectedName}</p>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-church-blue hover:underline shrink-0"
              >
                Change
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-church-blue text-white flex items-center justify-center text-sm font-bold">2</div>
              <h2 className="text-lg font-bold text-church-blue-dark">Select Dates Attended</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">You can select multiple Sundays.</p>

            {/* Date grid */}
            <div className="space-y-2 mb-6">
              {config?.dates.sort().map((date) => {
                const parsed = parseISO(date);
                const checked = selectedDates.includes(date);
                return (
                  <button
                    key={date}
                    onClick={() => toggleDate(date)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 transition-all text-left ${
                      checked
                        ? "border-church-blue bg-church-blue text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-church-blue/40"
                    }`}
                  >
                    <Calendar className={`w-5 h-5 shrink-0 ${checked ? "text-church-gold-light" : "text-gray-300"}`} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{format(parsed, "EEEE, MMMM d, yyyy")}</p>
                    </div>
                    {checked && <CheckCircle2 className="w-5 h-5 text-church-gold-light shrink-0" />}
                  </button>
                );
              })}
            </div>

            {selectedDates.length > 0 && (
              <p className="text-xs text-church-blue font-medium text-center mb-4">
                {selectedDates.length} {selectedDates.length === 1 ? "date" : "dates"} selected
              </p>
            )}

            {submitError && (
              <p className="text-sm text-red-600 text-center mb-4">{submitError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={selectedDates.length === 0 || submitting}
              className="w-full py-4 rounded-xl bg-church-gold text-white font-bold text-base shadow-lg hover:bg-church-gold-light active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Attendance"
              )}
            </button>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-church-blue-dark mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-1 font-medium">{selectedName}</p>
            <p className="text-sm text-gray-400 mb-1">
              {selectedDates.length} {selectedDates.length === 1 ? "date" : "dates"} recorded
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4 mb-8">
              {selectedDates.sort().map((d) => (
                <span key={d} className="px-3 py-1 bg-church-blue/10 text-church-blue text-xs rounded-full font-medium">
                  {format(parseISO(d), "MMM d")}
                </span>
              ))}
            </div>
            <button
              onClick={handleReset}
              className="px-8 py-3 rounded-xl border-2 border-church-blue text-church-blue font-semibold hover:bg-church-blue hover:text-white transition-all"
            >
              Submit Another
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <a href="/admin" className="text-xs text-gray-300 hover:text-gray-400">Admin</a>
      </div>
    </div>
  );
}
