"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  getActiveCycle,
  getAllCycles,
  createCycle,
  updateCycle,
  formatMonth,
  type Cycle,
} from "@/lib/db";

export default function AdminCyclePage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    label: "Mahashivratri 2028",
    startMonth: "",
    endDate: "",
  });

  async function load() {
    const [active, all] = await Promise.all([getActiveCycle(), getAllCycles()]);
    setActiveCycle(active);
    setCycles(all.sort((a, b) => b.startMonth.localeCompare(a.startMonth)));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await createCycle({ ...form, active: true });
    setShowForm(false);
    setMessage("✅ New cycle created and activated!");
    await load();
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  async function handleActivate(cycle: Cycle) {
    if (!confirm(`Set "${cycle.label}" as the active cycle? All other cycles will be deactivated.`)) return;
    await updateCycle(cycle.id, { active: true });
    // Deactivate others
    for (const c of cycles) {
      if (c.id !== cycle.id) await updateCycle(c.id, { active: false });
    }
    setMessage(`✅ "${cycle.label}" is now active.`);
    await load();
    setTimeout(() => setMessage(""), 3000);
  }

  const MONTHS_IN_CYCLE = activeCycle
    ? (() => {
        const [sy, sm] = activeCycle.startMonth.split("-").map(Number);
        const end = new Date(activeCycle.endDate);
        let y = sy, m = sm, count = 0;
        while (new Date(y, m - 1, 1) <= end) {
          count++;
          m++;
          if (m > 12) { m = 1; y++; }
        }
        return count;
      })()
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-700 text-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🕉️</span>
            <h1 className="font-bold text-lg">Collection Cycle Management</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin" className="hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">← Dashboard</Link>
            <Link href="/change-password" className="hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">Password</Link>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {message && (
          <div className="bg-green-100 text-green-800 rounded-xl px-4 py-3 text-sm font-medium">
            {message}
          </div>
        )}

        {/* Active Cycle Card */}
        {activeCycle && (
          <div className="bg-orange-600 text-white rounded-2xl p-5">
            <p className="text-orange-200 text-xs font-medium uppercase tracking-wide mb-1">Currently Active Cycle</p>
            <h2 className="text-2xl font-bold">{activeCycle.label}</h2>
            <div className="mt-3 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-orange-200 text-xs">Start</p>
                <p className="font-semibold">{formatMonth(activeCycle.startMonth)}</p>
              </div>
              <div>
                <p className="text-orange-200 text-xs">End Date</p>
                <p className="font-semibold">{new Date(activeCycle.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <div>
                <p className="text-orange-200 text-xs">Total Months</p>
                <p className="font-semibold">{MONTHS_IN_CYCLE}</p>
              </div>
            </div>
            <p className="text-orange-100 text-sm mt-3">
              💰 Each member pays ₹200/month × {MONTHS_IN_CYCLE} months = <strong>₹{MONTHS_IN_CYCLE * 200} total</strong>
            </p>
          </div>
        )}

        {/* Info about reset */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-800 text-sm">
          <p className="font-semibold mb-1">📋 How cycles work</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>After Mahashivratri (Feb 26, 2027), create a <strong>new cycle</strong> for 2028</li>
            <li>All previous payment data is preserved and viewable</li>
            <li>Members continue using the same username + password</li>
            <li>Only one cycle can be active at a time</li>
          </ul>
        </div>

        {/* New Cycle Button */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">All Cycles ({cycles.length})</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            {showForm ? "✕ Cancel" : "🔄 Start New Cycle"}
          </button>
        </div>

        {/* New Cycle Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
            <h3 className="font-semibold text-gray-800">New Collection Cycle</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cycle Label *</label>
                <input
                  required
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="e.g. Mahashivratri 2028"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Month * (YYYY-MM)</label>
                <input
                  required
                  type="month"
                  value={form.startMonth}
                  onChange={(e) => setForm({ ...form, startMonth: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date * (Mahashivratri)</label>
                <input
                  required
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-700 text-xs">
              ⚠️ Creating a new cycle will <strong>deactivate the current cycle</strong>. All previous data is preserved and still accessible.
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              {saving ? "Creating..." : "🔄 Create & Activate New Cycle"}
            </button>
          </form>
        )}

        {/* Cycles History */}
        {cycles.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold text-gray-800">Cycle History</h3>
            </div>
            <div className="divide-y">
              {cycles.map((c) => (
                <div key={c.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{c.label}</span>
                      {c.active && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Active</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatMonth(c.startMonth)} → {new Date(c.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  {!c.active && (
                    <button
                      onClick={() => handleActivate(c)}
                      className="text-xs text-orange-600 hover:underline border border-orange-300 hover:border-orange-500 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Set Active
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

