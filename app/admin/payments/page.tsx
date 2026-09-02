"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  getAllMembers,
  getActiveCycle,
  getPaymentsByCycle,
  getPaymentForMonth,
  recordPayment,
  deletePayment,
  getCycleMonths,
  formatMonth,
  currentMonth,
  type Member,
  type Payment,
  type Cycle,
} from "@/lib/db";
import { useSession } from "next-auth/react";

export default function AdminPaymentsPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [months, setMonths] = useState<string[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    memberId: "",
    month: currentMonth(),
    paidDate: new Date().toISOString().split("T")[0],
    amount: "200",
    note: "",
  });

  async function load() {
    const activeCycle = await getActiveCycle();
    setCycle(activeCycle);
    const [allMembers, allPayments] = await Promise.all([
      getAllMembers(),
      activeCycle ? getPaymentsByCycle(activeCycle.id) : Promise.resolve([]),
    ]);
    setMembers(allMembers.filter((m) => m.role === "member"));
    setPayments(allPayments);
    if (activeCycle) {
      const ms = getCycleMonths(activeCycle.startMonth, activeCycle.endDate);
      setMonths(ms);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!cycle) return;
    setSaving(true);
    setMessage("");

    // Check if already paid
    const existing = await getPaymentForMonth(form.memberId, form.month, cycle.id);
    if (existing) {
      setMessage("⚠️ This member already has a payment recorded for this month!");
      setSaving(false);
      return;
    }

    const member = members.find((m) => m.id === form.memberId);
    await recordPayment({
      memberId: form.memberId,
      memberName: member?.name || "",
      cycleId: cycle.id,
      amount: Number(form.amount),
      month: form.month,
      paidDate: form.paidDate,
      recordedBy: session?.user?.name || "admin",
      note: form.note,
    });

    setMessage(`✅ Payment of ₹${form.amount} recorded for ${member?.name} (${formatMonth(form.month)})`);
    setForm({ ...form, note: "" });
    await load();
    setSaving(false);
    setTimeout(() => setMessage(""), 4000);
  }

  async function handleDeletePayment(payment: Payment) {
    if (!confirm(`Remove payment for ${payment.memberName} — ${formatMonth(payment.month)}?`)) return;
    await deletePayment(payment.id);
    setMessage(`✅ Payment removed.`);
    await load();
    setTimeout(() => setMessage(""), 3000);
  }

  const recentPayments = [...payments]
    .sort((a, b) => b.paidDate.localeCompare(a.paidDate))
    .slice(0, 20);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-700 text-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🕉️</span>
            <h1 className="font-bold text-lg">Record Payment</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin" className="hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">← Dashboard</Link>
            <Link href="/admin/members" className="hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">Members</Link>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${message.startsWith("✅") ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
            {message}
          </div>
        )}

        {/* Record Form */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-800 mb-4 text-lg">Record New Payment</h2>
          {!cycle ? (
            <div className="text-gray-400 text-center py-8">
              No active cycle. <Link href="/admin/cycle" className="text-orange-600 underline">Create a cycle</Link> first.
            </div>
          ) : (
            <form onSubmit={handleRecord} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Member *</label>
                  <select
                    required
                    value={form.memberId}
                    onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">Select member...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Month *</label>
                  <select
                    required
                    value={form.month}
                    onChange={(e) => setForm({ ...form, month: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>{formatMonth(m)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date Paid *</label>
                  <input
                    type="date"
                    required
                    value={form.paidDate}
                    onChange={(e) => setForm({ ...form, paidDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.amount}
                    min="1"
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
                  <input
                    type="text"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="e.g. Cash received, Online transfer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {saving ? "Saving..." : "✅ Record Payment"}
              </button>
            </form>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-800">Recent Payments</h3>
          </div>
          {recentPayments.length === 0 ? (
            <div className="py-8 text-center text-gray-400">No payments recorded yet.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Member</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Month</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Date Paid</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Amount</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Note</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-orange-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{p.memberName}</td>
                    <td className="px-5 py-3 text-gray-600">{formatMonth(p.month)}</td>
                    <td className="px-5 py-3 text-gray-600">{new Date(p.paidDate).toLocaleDateString("en-IN")}</td>
                    <td className="px-5 py-3 text-green-700 font-semibold">₹{p.amount}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{p.note || "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDeletePayment(p)}
                        className="text-xs text-red-400 hover:text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

