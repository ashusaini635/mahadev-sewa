import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import bcrypt from "bcryptjs";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Member {
  id: string;
  name: string;
  username: string;
  phone: string;
  role: "admin" | "member";
  mustChangePassword?: boolean;
  createdAt?: string;
}

export interface MemberWithHash extends Member {
  passwordHash: string;
}

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  cycleId: string;
  amount: number;
  month: string; // "YYYY-MM"
  paidDate: string; // "YYYY-MM-DD"
  recordedBy: string;
  note?: string;
}

export interface Cycle {
  id: string;
  label: string;
  startMonth: string; // "YYYY-MM"
  endDate: string;    // "YYYY-MM-DD"
  active: boolean;
}

export interface PasswordResetRequest {
  id: string;
  memberId: string;
  phone: string;
  requestedAt: string;
  status: "pending" | "resolved";
}

// ─── Cycle ───────────────────────────────────────────────────────────────────

export async function getActiveCycle(): Promise<Cycle | null> {
  const q = query(collection(db, "cycles"), where("active", "==", true));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Cycle;
}

export async function getAllCycles(): Promise<Cycle[]> {
  const snap = await getDocs(collection(db, "cycles"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Cycle));
}

export async function createCycle(data: Omit<Cycle, "id">): Promise<string> {
  const batch = writeBatch(db);
  const existing = await getDocs(collection(db, "cycles"));
  existing.docs.forEach((d) => batch.update(d.ref, { active: false }));
  await batch.commit();
  const ref = await addDoc(collection(db, "cycles"), data);
  return ref.id;
}

export async function updateCycle(id: string, data: Partial<Cycle>): Promise<void> {
  await updateDoc(doc(db, "cycles", id), data);
}

// ─── Members ─────────────────────────────────────────────────────────────────

export async function getAllMembers(): Promise<Member[]> {
  const snap = await getDocs(query(collection(db, "members"), orderBy("name")));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      username: data.username,
      phone: data.phone ?? "",
      role: data.role,
      mustChangePassword: data.mustChangePassword ?? false,
      createdAt: data.createdAt,
    } as Member;
  });
}

export async function getMemberByUsername(username: string): Promise<MemberWithHash | null> {
  const q = query(collection(db, "members"), where("username", "==", username.toLowerCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as MemberWithHash;
}

export async function getMemberById(id: string): Promise<Member | null> {
  const snap = await getDoc(doc(db, "members", id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name,
    username: data.username,
    phone: data.phone ?? "",
    role: data.role,
    mustChangePassword: data.mustChangePassword ?? false,
    createdAt: data.createdAt,
  } as Member;
}

export async function createMember(
  name: string,
  username: string,
  password: string,
  phone: string,
  role: "admin" | "member" = "member"
): Promise<string> {
  const passwordHash = await bcrypt.hash(password, 10);
  const ref = await addDoc(collection(db, "members"), {
    name,
    username: username.toLowerCase(),
    passwordHash,
    phone,
    role,
    mustChangePassword: role === "member", // members must change password on first login
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateMember(
  id: string,
  data: { name?: string; phone?: string; role?: string }
): Promise<void> {
  await updateDoc(doc(db, "members", id), data);
}

export async function updateMemberPassword(
  id: string,
  newPassword: string,
  mustChangePassword?: boolean
): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const data: { passwordHash: string; mustChangePassword?: boolean } = { passwordHash };
  if (mustChangePassword !== undefined) {
    data.mustChangePassword = mustChangePassword;
  }
  await updateDoc(doc(db, "members", id), data);
}

export async function deleteMember(id: string): Promise<void> {
  await deleteDoc(doc(db, "members", id));
}

export async function verifyMemberPassword(
  username: string,
  password: string
): Promise<MemberWithHash | null> {
  const member = await getMemberByUsername(username);
  if (!member) return null;
  const valid = await bcrypt.compare(password, member.passwordHash);
  return valid ? member : null;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function getPaymentsByMember(
  memberId: string,
  cycleId?: string
): Promise<Payment[]> {
  const conditions: Parameters<typeof query>[1][] = [where("memberId", "==", memberId)];
  if (cycleId) conditions.push(where("cycleId", "==", cycleId));
  const q = query(collection(db, "payments"), ...conditions, orderBy("month", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment));
}

export async function getPaymentsByCycle(cycleId: string): Promise<Payment[]> {
  const q = query(
    collection(db, "payments"),
    where("cycleId", "==", cycleId),
    orderBy("month", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment));
}

export async function getPaymentForMonth(
  memberId: string,
  month: string,
  cycleId: string
): Promise<Payment | null> {
  const q = query(
    collection(db, "payments"),
    where("memberId", "==", memberId),
    where("month", "==", month),
    where("cycleId", "==", cycleId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Payment;
}

export async function recordPayment(data: Omit<Payment, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "payments"), data);
  return ref.id;
}

export async function deletePayment(id: string): Promise<void> {
  await deleteDoc(doc(db, "payments", id));
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Generate list of YYYY-MM months from startMonth up to endDate */
export function getCycleMonths(startMonth: string, endDate: string): string[] {
  const months: string[] = [];
  const [sy, sm] = startMonth.split("-").map(Number);
  const end = new Date(endDate);
  let year = sy;
  let month = sm;
  while (true) {
    const current = new Date(year, month - 1, 1);
    if (current > end) break;
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return months;
}

export function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleString("en-IN", { month: "long", year: "numeric" });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function isPaymentAlertActive(): boolean {
  return new Date().getDate() > 15;
}

// ─── Password Reset Requests ─────────────────────────────────────────────────

export async function clearMustChangePassword(id: string): Promise<void> {
  await updateDoc(doc(db, "members", id), { mustChangePassword: false });
}

export async function createPasswordResetRequest(phone: string): Promise<{ found: boolean }> {
  const q = query(collection(db, "members"), where("phone", "==", phone));
  const snap = await getDocs(q);
  if (snap.empty) return { found: false };
  const member = snap.docs[0];
  // Avoid duplicate pending requests
  const existingQ = query(
    collection(db, "passwordResetRequests"),
    where("memberId", "==", member.id),
    where("status", "==", "pending")
  );
  const existing = await getDocs(existingQ);
  if (!existing.empty) return { found: true };
  await addDoc(collection(db, "passwordResetRequests"), {
    memberId: member.id,
    phone,
    requestedAt: new Date().toISOString(),
    status: "pending",
  });
  return { found: true };
}

export async function getPendingPasswordResets(): Promise<PasswordResetRequest[]> {
  const q = query(
    collection(db, "passwordResetRequests"),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PasswordResetRequest));
}

export async function resolvePasswordReset(requestId: string): Promise<void> {
  await updateDoc(doc(db, "passwordResetRequests", requestId), { status: "resolved" });
}
