"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  getAllMembers,
  createMember,
  updateMemberPassword,
  deleteMember,
  getPendingPasswordResets,
  resolvePasswordReset,
  type Member,
  type PasswordResetRequest,
} from "@/lib/db";

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editPasswordId, setEditPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({ name: "", username: "", password: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const [all, requests] = await Promise.all([
      getAllMembers(),
      getPendingPasswordResets(),
    ]);
    setMembers(all);
    setResetRequests(requests);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createMember(form.name, form.username, form.password, form.phone, "member");
      setForm({ name: "", username: "", password: "", phone: "" });
      setShowAddForm(false);
      setMessage("✅ Member added successfully!");
      await load();
    } catch {
      setMessage("❌ Error adding member. Username may already exist.");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;
    await deleteMember(id);
    setMessage(`✅ ${name} removed.`);
    await load();
    setTimeout(() => setMessage(""), 3000);
  }

  async function handlePasswordChange(id: string) {
    if (!newPassword || newPassword.length < 4) {
      setMessage("❌ Password must be at least 4 characters.");
      return;
    }
    setSaving(true);
    await updateMemberPassword(id, newPassword);
    setNewPassword("");
    setEditPasswordId(null);
    setMessage("✅ Password updated!");
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  async function handleResolveReset(requestId: string, memberId: string, memberName: string) {
    const newPwd = prompt(`Set new password for ${memberName} (min 4 chars):`);
    if (!newPwd || newPwd.length < 4) {
      if (newPwd !== null) alert("Password must be at least 4 characters.");
      return;
    }
    setSaving(true);
    await updateMemberPassword(memberId, newPwd);
    await resolvePasswordReset(requestId);
    setMessage(`✅ Password reset for ${memberName}. Share their new password: "${newPwd}"`);
    setSaving(false);
    await load();
    setTimeout(() => setMessage(""), 10000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-700 text-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🕉️</span>
            <h1 className="font-bold text-lg">Mahadev Seva — Members</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin" className="hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">← Dashboard</Link>
            <Link href="/admin/payments" className="hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">Payments</Link>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${message.startsWith("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {message}
          </div>
        )}

        {/* Password Reset Requests */}
        {resetRequests.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-yellow-800 flex items-center gap-2">
              🔑 Password Reset Requests ({resetRequests.length})
            </h3>
            <p className="text-xs text-yellow-700">These members forgot their password. Reset it and share the new password with them via WhatsApp or call.</p>
            <div className="space-y-2">
              {resetRequests.map((req) => {
                const member = members.find((m) => m.id === req.memberId);
                return (
                  <div key={req.id} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between border border-yellow-200">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{member?.name ?? "Unknown"}</p>
                      <p className="text-xs text-gray-500">📱 {req.phone} · Requested {new Date(req.requestedAt).toLocaleString("en-IN")}</p>
                    </div>
                    <button
                      onClick={() => handleResolveReset(req.id, req.memberId, member?.name ?? "Member")}
                      disabled={saving}
                      className="text-sm bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Reset Password
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            Members ({members.filter(m => m.role === "member").length})
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            {showAddForm ? "✕ Cancel" : "+ Add Member"}
          </button>
        </div>

        {/* Add Member Form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
            <h3 className="font-semibold text-gray-800">New Member</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Username * (for login)</label>
                <input
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="e.g. ramesh (no spaces)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password * (given to member)</label>
                <input
                  required
                  minLength={4}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Min 4 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number *</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              {saving ? "Adding..." : "Add Member"}
            </button>
          </form>
        )}

        {/* Members List */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading...</div>
          ) : members.filter(m => m.role === "member").length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p className="text-4xl mb-3">👥</p>
              <p>No members yet. Add your first member above.</p>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Username</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Phone</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Password</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.filter(m => m.role === "member").map((member) => (
                  <tr key={member.id} className="hover:bg-orange-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {member.name}
                      {member.mustChangePassword && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">First login pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 font-mono text-xs">{member.username}</td>
                    <td className="px-5 py-3 text-gray-500">{member.phone || "—"}</td>
                    <td className="px-5 py-3">
                      {editPasswordId === member.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="border rounded px-2 py-1 text-xs text-gray-900 bg-white w-28 focus:outline-none focus:ring-1 focus:ring-orange-400"
                            placeholder="New password"
                            autoFocus
                          />
                          <button
                            onClick={() => handlePasswordChange(member.id)}
                            disabled={saving}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditPasswordId(null); setNewPassword(""); }}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditPasswordId(member.id)}
                          className="text-xs text-orange-600 hover:underline"
                        >
                          Change Password
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(member.id, member.name)}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline"
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

