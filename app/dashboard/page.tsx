"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  getPaymentsByMember,
  getActiveCycle,
  getCycleMonths,
  formatMonth,
  formatDate,
  currentMonth,
  isPaymentAlertActive,
  type Payment,
  type Cycle,
} from "@/lib/db";

import { OmLoader } from "@/components/OmLoader";

export default function MemberDashboard() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [allMonths, setAllMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!session?.user?.id) return;
      try {
        const [activeCycle, memberPayments] = await Promise.all([
          getActiveCycle(),
          getPaymentsByMember(session.user.id),
        ]);
        setCycle(activeCycle);
        if (activeCycle) {
          setAllMonths(getCycleMonths(activeCycle.startMonth, activeCycle.endDate));
          setPayments(memberPayments.filter((p) => !p.cycleId || p.cycleId === activeCycle.id));
        } else {
          setPayments(memberPayments);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session]);

  const paidMonths = new Set(payments.map((p) => p.month));
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpected = allMonths.filter(m => {
    const now = new Date();
    const [y, mo] = m.split("-").map(Number);
    return new Date(y, mo - 1, 1) <= now;
  }).length * 200;
  const thisMonth = currentMonth();
  const thisMonthPaid = paidMonths.has(thisMonth);
  const showAlert = isPaymentAlertActive() && !thisMonthPaid && allMonths.includes(thisMonth);

  if (loading) {
    return <OmLoader message="Loading your committee dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🕉️</span>
            <div>
              <h1 className="font-bold text-orange-800 text-lg leading-tight">Mahadev Seva</h1>
              <p className="text-xs text-gray-500">Committee Fund Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              👤 {session?.user?.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Pending Alert */}
        {showAlert && (
          <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl mt-0.5">⚠️</span>
            <div>
              <p className="font-bold text-red-700 text-base">Payment Pending!</p>
              <p className="text-red-600 text-sm mt-0.5">
                Your ₹200 payment for <strong>{formatMonth(thisMonth)}</strong> is still pending.
                Please pay your committee contribution as soon as possible.
              </p>
            </div>
          </div>
        )}

        {/* Welcome & Cycle Info */}
        <div className="bg-orange-600 rounded-2xl p-5 text-white">
          <p className="text-orange-200 text-sm">Namaste 🙏</p>
          <h2 className="text-2xl font-bold mt-1">{session?.user?.name}</h2>
          {cycle && (
            <p className="text-orange-100 text-sm mt-1">
              📅 Collection until {new Date(cycle.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} ({cycle.label})
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Total Paid</p>
            <p className="text-3xl font-bold text-green-600 mt-1">₹{totalPaid}</p>
            <p className="text-xs text-gray-400 mt-0.5">{payments.length} months</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Still Due</p>
            <p className="text-3xl font-bold text-red-500 mt-1">₹{Math.max(0, totalExpected - totalPaid)}</p>
            <p className="text-xs text-gray-400 mt-0.5">as of today</p>
          </div>
        </div>

        {/* Payment History Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Payment History</h3>
            <p className="text-xs text-gray-400 mt-0.5">All months in this collection cycle</p>
          </div>
          <div className="divide-y divide-gray-50">
            {allMonths.map((month) => {
              const payment = payments.find((p) => p.month === month);
              const isPast = new Date(month + "-01") <= new Date();
              return (
                <div key={month} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{formatMonth(month)}</p>
                    {payment && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Paid on {formatDate(payment.paidDate)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {payment ? (
                      <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                        ✅ ₹{payment.amount}
                      </span>
                    ) : isPast ? (
                      <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                        ❌ Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-400 text-xs px-3 py-1.5 rounded-full">
                        🔮 Upcoming
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">🚩 Har Har Mahadev 🚩</p>
      </main>
    </div>
  );
}

