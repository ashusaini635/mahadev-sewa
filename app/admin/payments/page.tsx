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
  const [reminderMonth, setReminderMonth] = useState(currentMonth());

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

    const existing = await getPaymentForMonth(form.memberId, form.month, cycle.id);
    if (existing) {
      setMessage("âš ï¸ This member already has a payment recorded for this month!");
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

    setMessage(`âœ… Payment of â‚¹${form.amount} recorded for ${member?.name} (${formatMonth(form.month)})`);
    setForm({ ...form, note: "" });
    await load();
    setSaving(false);
    setTimeout(() => setMessage(""), 4000);
  }

  async function handleDeletePayment(payment: Payment) {
    if (!confirm(`Remove payment for ${payment.memberName} â€” ${formatMonth(payment.month)}?`)) return;
    await deletePayment(payment.id);
    setMessage(`âœ… Payment removed.`);
    await load();
    setTimeout(() => setMessage(""), 3000);
  }

  // Build WhatsApp reminder URL for a single member
  function whatsappUrl(phone: string, memberName: string, month: string) {
    const clean = phone.replace(/\D/g, "");
    const number = clean.startsWith("91") ? clean : `91${clean}`;
    const monthLabel = formatMonth(month);
    const msg = encodeURIComponent(
      `ðŸ™ Namaskar ${memberName} ji,\n\nMahadev Seva Committee ka *${monthLabel}* ka payment abhi pending hai.\n\nKripya jald payment karein. ðŸ•‰ï¸\n\n*Har Har Mahadev* ðŸš©`
    );
    return `https://wa.me/${number}?text=${msg}`;
  }

  // Members who haven't paid for the selected reminder month
  const unpaidMembers = members.filter((m) => {
    if (!cycle) return false;
    return !payments.some((p) => p.memberId === m.id && p.month === reminderMonth && p.cycleId === cycle.id);
  });

  const recentPayments = [...payments]
    .sort((a, b) => b.paidDate.localeCompare(a.paidDate))
    .slice(0, 20);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-700 text-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">ðŸ•‰ï¸</span>
            <h1 className="font-bold text-lg">Record Payment</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin" className="hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">â† Dashboard</Link>
            <Link href="/admin/members" className="hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">Members</Link>
            <Link href="/change-password" className="hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">Password</Link>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${message.startsWith("âœ…") ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount (â‚¹) *</label>
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
                {saving ? "Saving..." : "âœ… Record Payment"}
              </button>
            </form>
          )}
        </div>

        {/* WhatsApp Payment Reminders */}
        {cycle && (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-semibold text-gray-800">ðŸ“² Send WhatsApp Reminders</h3>
                <p className="text-xs text-gray-400 mt-0.5">Members who have not paid for the selected month</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 font-medium">Month:</label>
                <select
                  value={reminderMonth}
                  onChange={(e) => setReminderMonth(e.target.value)}
                  className="border rounded-lg px-2 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>{formatMonth(m)}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : unpaidMembers.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-2xl mb-2">ðŸŽ‰</p>
                <p className="text-green-700 font-semibold text-sm">All members have paid for {formatMonth(reminderMonth)}!</p>
              </div>
            ) : (
              <div>
                {/* Send All button */}
                <div className="px-5 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between">
                  <p className="text-sm text-green-800 font-medium">
                    {unpaidMembers.length} member{unpaidMembers.length > 1 ? "s" : ""} pending
                  </p>
                  <a
                    href={(() => {
                      // Opens WhatsApp for the first unpaid member with phone; admin can tap through
                      const first = unpaidMembers.find((m) => m.phone);
                      if (!first) return "#";
                      return whatsappUrl(first.phone, first.name, reminderMonth);
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
                  >
                    ðŸ“² Open WhatsApp
                  </a>
                </div>

                <div className="divide-y divide-gray-50">
                  {unpaidMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 px-5 py-3 hover:bg-green-50/50 transition-colors">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm">{member.name}</p>
                        <p className="text-xs text-gray-400">
                          {member.phone ? `ðŸ“± ${member.phone}` : "No phone number saved"}
                        </p>
                      </div>

                      {/* WhatsApp button */}
                      {member.phone ? (
                        <a
                          href={whatsappUrl(member.phone, member.name, reminderMonth)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs bg-[#25D366] hover:bg-[#1ebe5c] text-white px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Send Reminder
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300 px-3 py-1.5">No phone</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
                    <td className="px-5 py-3 text-green-700 font-semibold">â‚¹{p.amount}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{p.note || "â€”"}</td>
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

