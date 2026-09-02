"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAllMembers,
  getPaymentsByCycle,
  getActiveCycle,
  getCycleMonths,
  formatMonth,
  formatDate,
  currentMonth,
  type Member,
  type Payment,
  type Cycle,
} from "@/lib/db";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
      setMonths(getCycleMonths(activeCycle.startMonth, activeCycle.endDate));
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const thisMonth = currentMonth();
  const unpaidThisMonth = members.filter(
    (m) => !payments.some((p) => p.memberId === m.id && p.month === thisMonth)
  );

  // Build grid: member -> month -> payment
  function getPayment(memberId: string, month: string): Payment | undefined {
    return payments.find((p) => p.memberId === memberId && p.month === month);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-orange-600 text-lg animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-orange-700 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🕉️</span>
            <div>
              <h1 className="font-bold text-xl leading-tight">Mahadev Seva</h1>
              <p className="text-orange-200 text-xs">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link href="/admin" className="bg-orange-600 px-3 py-1.5 rounded-lg font-medium">Dashboard</Link>
              <Link href="/admin/members" className="hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">Members</Link>
              <Link href="/admin/payments" className="hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">Record Payment</Link>
              <Link href="/admin/cycle" className="hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">Cycle</Link>
            </nav>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden border-t border-orange-600 px-4 py-2 flex gap-2 text-sm overflow-x-auto">
          <Link href="/admin" className="bg-orange-600 px-3 py-1 rounded-lg whitespace-nowrap">Dashboard</Link>
          <Link href="/admin/members" className="hover:bg-orange-600 px-3 py-1 rounded-lg whitespace-nowrap transition-colors">Members</Link>
          <Link href="/admin/payments" className="hover:bg-orange-600 px-3 py-1 rounded-lg whitespace-nowrap transition-colors">Record Payment</Link>
          <Link href="/admin/cycle" className="hover:bg-orange-600 px-3 py-1 rounded-lg whitespace-nowrap transition-colors">Cycle</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Cycle Banner */}
        {cycle && (
          <div className="bg-orange-100 border border-orange-300 rounded-xl px-5 py-3 flex items-center justify-between">
            <div>
              <span className="text-orange-700 font-semibold">Active Cycle: {cycle.label}</span>
              <span className="text-orange-500 text-sm ml-3">
                {formatMonth(cycle.startMonth)} → {new Date(cycle.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <Link href="/admin/cycle" className="text-sm text-orange-600 hover:underline">Manage →</Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Collected</p>
            <p className="text-3xl font-bold text-green-600 mt-1">₹{totalCollected.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Members</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">{members.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pending This Month</p>
            <p className="text-3xl font-bold text-red-500 mt-1">{unpaidThisMonth.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Months</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{months.length}</p>
          </div>
        </div>

        {/* Unpaid This Month Alert */}
        {unpaidThisMonth.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">
              ⚠️ Pending for {formatMonth(thisMonth)} ({unpaidThisMonth.length} members)
            </h3>
            <div className="flex flex-wrap gap-2">
              {unpaidThisMonth.map((m) => (
                <span key={m.id} className="bg-yellow-200 text-yellow-800 text-sm px-3 py-1 rounded-full">
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Payment Grid */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Payment Grid</h3>
              <p className="text-xs text-gray-400">✅ Paid &nbsp;❌ Pending &nbsp;⬜ Upcoming</p>
            </div>
            <Link
              href="/admin/payments"
              className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2 rounded-xl transition-colors"
            >
              + Record Payment
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 sticky left-0 bg-gray-50 min-w-[150px]">
                    Member
                  </th>
                  {months.map((m) => (
                    <th key={m} className="px-3 py-3 font-medium text-gray-600 text-center whitespace-nowrap min-w-[100px]">
                      {formatMonth(m).split(" ")[0]}<br />
                      <span className="text-xs font-normal text-gray-400">{formatMonth(m).split(" ")[1]}</span>
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((member) => {
                  const memberTotal = payments
                    .filter((p) => p.memberId === member.id)
                    .reduce((s, p) => s + p.amount, 0);
                  return (
                    <tr key={member.id} className="hover:bg-orange-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800 sticky left-0 bg-white">
                        {member.name}
                        {member.phone && (
                          <div className="text-xs text-gray-400">{member.phone}</div>
                        )}
                      </td>
                      {months.map((month) => {
                        const payment = getPayment(member.id, month);
                        const now = new Date();
                        const [y, mo] = month.split("-").map(Number);
                        const isPast = new Date(y, mo - 1, 1) <= now;
                        return (
                          <td key={month} className="px-3 py-3 text-center">
                            {payment ? (
                              <span
                                title={`Paid ₹${payment.amount} on ${formatDate(payment.paidDate)}`}
                                className="inline-block w-8 h-8 leading-8 bg-green-100 text-green-700 rounded-full text-base cursor-default"
                              >
                                ✅
                              </span>
                            ) : isPast ? (
                              <span className="inline-block w-8 h-8 leading-8 bg-red-100 text-red-600 rounded-full text-base">
                                ❌
                              </span>
                            ) : (
                              <span className="inline-block w-8 h-8 leading-8 bg-gray-100 text-gray-400 rounded-full text-xs">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right font-bold text-green-600">
                        ₹{memberTotal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t font-semibold">
                <tr>
                  <td className="px-4 py-3 text-gray-700 sticky left-0 bg-gray-50">Total</td>
                  {months.map((month) => {
                    const monthTotal = payments
                      .filter((p) => p.month === month)
                      .reduce((s, p) => s + p.amount, 0);
                    return (
                      <td key={month} className="px-3 py-3 text-center text-green-700 text-xs">
                        {monthTotal > 0 ? `₹${monthTotal}` : "—"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right text-green-700">₹{totalCollected}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

