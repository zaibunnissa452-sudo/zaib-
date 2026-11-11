import { useEffect, useState, useCallback, useRef, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  PackageCheck,
  Check,
  X,
  Clock,
  Loader2,
  Store,
  LogOut,
  ShieldCheck,
  ClipboardList,
  UtensilsCrossed,
  History,
  Settings,
  ToggleLeft,
  ToggleRight,
  QrCode,
  Edit2,
  Save,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Order, OrderStatus, Canteen, MenuItem } from "../lib/types";
import type { Session } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────────────────────────

type StaffRole = "owner" | "auditor";
type StaffAccessState = "loading" | "signed_out" | "mfa" | "mfa_incomplete" | "authorized" | "error";
type DashTab = "orders" | "menu" | "history" | "stall";

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { id: DashTab; label: string; icon: typeof ClipboardList }[] = [
  { id: "orders",  label: "Orders",  icon: ClipboardList    },
  { id: "menu",    label: "Menu",    icon: UtensilsCrossed  },
  { id: "history", label: "History", icon: History          },
  { id: "stall",   label: "Stall",   icon: Settings         },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  if (isToday) return `Today ${time}`;
  return `${d.getDate()} ${d.toLocaleString("en-IN", { month: "short" })} ${time}`;
}

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending:   "badge-pending",
  preparing: "badge-preparing",
  ready:     "badge-ready",
  completed: "badge-completed",
  cancelled: "badge-cancelled",
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OwnerDashboard() {
  // ── Auth state ──────────────────────────────────────────────────────────────
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [accessState, setAccessState] = useState<StaffAccessState>("loading");
  const [staffRole, setStaffRole] = useState<StaffRole | null>(null);
  const [canteenId, setCanteenId] = useState<string | null>(null); // from staff_roles

  // sign-in form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // MFA
  const [verificationCode, setVerificationCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [incompleteFactorId, setIncompleteFactorId] = useState<string | null>(null);
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaMode, setMfaMode] = useState<"setup" | "challenge" | null>(null);

  // auth feedback
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  // ── Dashboard state ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<DashTab>("orders");

  // Orders tab
  const [orders, setOrders] = useState<Order[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [selectedCanteen, setSelectedCanteen] = useState<string>("all");
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // Menu tab
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<string>("");
  const [togglingItem, setTogglingItem] = useState<string | null>(null);

  // History tab
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Stall tab
  const [stallCanteen, setStallCanteen] = useState<Canteen | null>(null);
  const [stallLoading, setStallLoading] = useState(false);
  const [stallError, setStallError] = useState<string | null>(null);
  const [togglingStall, setTogglingStall] = useState(false);
  const [upiId, setUpiId] = useState<string>("");
  const [savedUpi, setSavedUpi] = useState<string>("");
  const [editingUpi, setEditingUpi] = useState(false);

  const priceInputRef = useRef<HTMLInputElement>(null);

  // ── Auth: session listener ──────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setAuthError("We couldn't check your staff sign-in. Please try again.");
      setSession(data.session);
      setSessionReady(true);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // ── Auth: access check ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionReady) return;
    let active = true;

    const checkStaffAccess = async () => {
      if (!session) {
        setStaffRole(null);
        setFactorId(null);
        setMfaQrCode(null);
        setMfaSecret(null);
        setMfaMode(null);
        setAccessState("signed_out");
        return;
      }

      setAccessState("loading");
      setAuthError(null);

      const { data: staffRecord, error: roleError } = await supabase
        .from("staff_roles")
        .select("role, canteen_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!active) return;

      const assignedRole = staffRecord?.role;
      if (roleError || (assignedRole !== "owner" && assignedRole !== "auditor")) {
        setAuthError(
          roleError
            ? "Staff access isn't configured yet. Contact the project administrator."
            : "This account isn't authorized for staff access.",
        );
        setStaffRole(null);
        setAccessState("signed_out");
        await supabase.auth.signOut();
        return;
      }

      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!active) return;
      if (assuranceError) {
        setAuthError("We couldn't verify your authenticator code. Please sign in again.");
        setAccessState("error");
        return;
      }

      if (assurance.currentLevel === "aal2") {
        setStaffRole(assignedRole);
        setCanteenId(staffRecord?.canteen_id ?? null);
        setFactorId(null);
        setMfaQrCode(null);
        setMfaSecret(null);
        setMfaMode(null);
        setAccessState("authorized");
        return;
      }

      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (!active) return;
      if (factorsError) {
        setAuthError("We couldn't load your authenticator. Please try signing in again.");
        setAccessState("error");
        return;
      }

      const verifiedFactor = factors.totp.find((factor) => factor.status === "verified");
      if (verifiedFactor) {
        setFactorId(verifiedFactor.id);
        setMfaMode("challenge");
        setAccessState("mfa");
        return;
      }

      const incompleteFactor = factors.all.find(
        (factor) => factor.factor_type === "totp" && factor.status === "unverified",
      );
      if (incompleteFactor) {
        setIncompleteFactorId(incompleteFactor.id);
        setAccessState("mfa_incomplete");
        return;
      }

      const { data: enrollment, error: enrollmentError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Smart Canteen Staff",
      });
      if (!active) return;
      if (enrollmentError || !enrollment?.totp?.qr_code) {
        setAuthError("We couldn't start authenticator setup. Please try again.");
        setAccessState("error");
        return;
      }

      setFactorId(enrollment.id);
      setMfaMode("setup");
      setMfaQrCode(enrollment.totp.qr_code);
      setMfaSecret(enrollment.totp.secret);
      setAccessState("mfa");
    };

    void checkStaffAccess();
    return () => {
      active = false;
    };
  }, [session, sessionReady]);

  // ── Auth: sign-in ──────────────────────────────────────────────────────────
  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) setAuthError("Sign-in failed. Check your email and password.");
    else setPassword("");
    setAuthBusy(false);
  };

  // ── Auth: MFA verify ───────────────────────────────────────────────────────
  const verifyAuthenticator = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!factorId || !/^\d{6}$/.test(verificationCode.trim())) {
      setAuthError("Enter the six-digit code from your authenticator app.");
      return;
    }

    setAuthBusy(true);
    setAuthError(null);
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: verificationCode.trim(),
    });
    if (verifyError) {
      setAuthError("That code wasn't accepted. Check the time on your phone and try again.");
      setAuthBusy(false);
      return;
    }

    setVerificationCode("");
    setMfaQrCode(null);
    setMfaSecret(null);
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setAuthBusy(false);
  };

  // ── Auth: restart MFA setup ────────────────────────────────────────────────
  const restartAuthenticatorSetup = async () => {
    if (!incompleteFactorId) return;
    setAuthBusy(true);
    setAuthError(null);
    const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: incompleteFactorId });
    if (removeError) {
      setAuthError(
        "The unfinished authenticator setup couldn't be reset. Contact the project administrator.",
      );
      setAuthBusy(false);
      return;
    }
    setIncompleteFactorId(null);
    const { data: enrollment, error: enrollmentError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Smart Canteen Staff",
    });
    if (enrollmentError || !enrollment?.totp?.qr_code) {
      setAuthError("We couldn't restart authenticator setup. Please try again.");
      setAccessState("error");
    } else {
      setFactorId(enrollment.id);
      setMfaMode("setup");
      setMfaQrCode(enrollment.totp.qr_code);
      setMfaSecret(enrollment.totp.secret);
      setAccessState("mfa");
    }
    setAuthBusy(false);
  };

  // ── Auth: sign-out ─────────────────────────────────────────────────────────
  const signOut = async () => {
    setAuthBusy(true);
    await supabase.auth.signOut();
    setSession(null);
    setStaffRole(null);
    setOrders([]);
    setPassword("");
    setVerificationCode("");
    setMfaQrCode(null);
    setMfaSecret(null);
    setAuthBusy(false);
  };

  // ── Effective canteen id for queries ───────────────────────────────────────
  // For owners with a canteen_id in staff_roles, force-filter to that canteen.
  const effectiveCanteenId = canteenId ?? (selectedCanteen === "all" ? null : selectedCanteen);

  // ── Tab: Orders ────────────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    if (!staffRole) return;
    setOrdersError(null);

    let data: Order[] | null = null;
    let err: { message: string } | null = null;

    if (staffRole === "owner") {
      const result = await supabase.rpc("get_owner_orders", {
        p_canteen_id: effectiveCanteenId,
      });
      data = result.data as Order[] | null;
      err = result.error;
    } else {
      let query = supabase
        .from("orders")
        .select(
          "id,canteen_id,order_number,items,total,status,queue_position,estimated_wait_minutes,created_at,updated_at",
        )
        .order("created_at", { ascending: false })
        .limit(1000);
      if (effectiveCanteenId) query = query.eq("canteen_id", effectiveCanteenId);
      const result = await query;
      data = result.data as Order[] | null;
      err = result.error;
    }

    if (err) {
      setOrdersError(err.message);
    } else {
      setOrders((data as Order[]) ?? []);
    }
    setOrdersLoading(false);
  }, [effectiveCanteenId, staffRole]);

  useEffect(() => {
    async function loadCanteens() {
      const { data } = await supabase.from("canteens").select("*").order("name");
      if (data) setCanteens(data as Canteen[]);
    }
    loadCanteens();
  }, []);

  useEffect(() => {
    if (accessState !== "authorized" || !staffRole) return;
    setOrdersLoading(true);
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [accessState, loadOrders, staffRole]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    if (staffRole !== "owner") return;
    setUpdating(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) setOrdersError(error.message);
    else await loadOrders();
    setUpdating(null);
  };

  const canteenName = (id: string) => canteens.find((c) => c.id === id)?.name ?? "Unknown";

  const activeOrders = orders.filter((o) =>
    ["pending", "preparing", "ready"].includes(o.status),
  );
  const pending   = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready     = orders.filter((o) => o.status === "ready");

  const statusActions: Record<
    OrderStatus,
    { next: OrderStatus; label: string; icon: typeof ChefHat; color: string }[]
  > = {
    pending:   [
      { next: "preparing", label: "Start Preparing", icon: ChefHat,      color: "from-cyan to-violet"    },
      { next: "cancelled", label: "Cancel",          icon: X,            color: "from-rose-600 to-rose-500" },
    ],
    preparing: [{ next: "ready",     label: "Mark Ready",    icon: PackageCheck, color: "from-lime-500 to-cyan"  }],
    ready:     [{ next: "completed", label: "Complete",      icon: Check,       color: "from-violet to-magenta" }],
    completed: [],
    cancelled: [],
  };

  // ── Tab: Menu ──────────────────────────────────────────────────────────────
  const loadMenu = useCallback(async () => {
    if (!effectiveCanteenId) return;
    setMenuLoading(true);
    setMenuError(null);
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("canteen_id", effectiveCanteenId)
      .order("category");
    if (error) setMenuError(error.message);
    else setMenuItems((data as MenuItem[]) ?? []);
    setMenuLoading(false);
  }, [effectiveCanteenId]);

  useEffect(() => {
    if (accessState === "authorized" && activeTab === "menu") loadMenu();
  }, [accessState, activeTab, loadMenu]);

  const toggleItemAvailability = async (item: MenuItem) => {
    setTogglingItem(item.id);
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id);
    if (!error) {
      setMenuItems((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, is_available: !m.is_available } : m)),
      );
    } else setMenuError(error.message);
    setTogglingItem(null);
  };

  const startEditPrice = (item: MenuItem) => {
    setEditingPrice(item.id);
    setPriceInput(String(item.price));
    setTimeout(() => priceInputRef.current?.focus(), 50);
  };

  const savePrice = async (item: MenuItem) => {
    const newPrice = parseFloat(priceInput);
    if (!Number.isFinite(newPrice) || newPrice <= 0) {
      setMenuError("Enter a valid price greater than zero.");
    } else if (newPrice !== item.price) {
      const { error } = await supabase
        .from("menu_items")
        .update({ price: newPrice })
        .eq("id", item.id);
      if (!error) {
        setMenuItems((prev) =>
          prev.map((m) => (m.id === item.id ? { ...m, price: newPrice } : m)),
        );
      } else setMenuError(error.message);
    }
    setEditingPrice(null);
  };

  // Group menu items by category
  const menuByCategory = menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // ── Tab: History ───────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!staffRole) return;
    setHistoryLoading(true);
    setHistoryError(null);
    const { data, error } = await supabase.rpc("get_staff_order_history", {
      p_canteen_id: effectiveCanteenId,
    });
    if (error) setHistoryError(error.message);
    else setHistoryOrders((data as Order[]) ?? []);
    setHistoryLoading(false);
  }, [effectiveCanteenId, staffRole]);

  useEffect(() => {
    if (accessState === "authorized" && activeTab === "history") loadHistory();
  }, [accessState, activeTab, loadHistory]);

  // ── Tab: Stall ─────────────────────────────────────────────────────────────
  const loadStall = useCallback(async () => {
    if (!effectiveCanteenId) return;
    setStallLoading(true);
    setStallError(null);
    const { data, error } = await supabase
      .from("canteens")
      .select("*")
      .eq("id", effectiveCanteenId)
      .single();
    if (error) setStallError(error.message);
    else setStallCanteen(data as Canteen);
    setStallLoading(false);
  }, [effectiveCanteenId]);

  useEffect(() => {
    if (accessState === "authorized" && activeTab === "stall") loadStall();
  }, [accessState, activeTab, loadStall]);

  // Load UPI from localStorage
  useEffect(() => {
    if (effectiveCanteenId) {
      const stored = localStorage.getItem(`owner_upi_${effectiveCanteenId}`) ?? "";
      setSavedUpi(stored);
      setUpiId(stored);
    }
  }, [effectiveCanteenId]);

  const toggleStallOpen = async () => {
    if (!stallCanteen) return;
    setTogglingStall(true);
    const { error } = await supabase
      .from("canteens")
      .update({ is_open: !stallCanteen.is_open })
      .eq("id", stallCanteen.id);
    if (!error) setStallCanteen((prev) => prev ? { ...prev, is_open: !prev.is_open } : prev);
    else setStallError(error.message);
    setTogglingStall(false);
  };

  const saveUpi = () => {
    if (!effectiveCanteenId) return;
    localStorage.setItem(`owner_upi_${effectiveCanteenId}`, upiId.trim());
    setSavedUpi(upiId.trim());
    setEditingUpi(false);
  };

  const qrUrl = savedUpi
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        `upi://pay?pa=${savedUpi}&pn=LORDS+CANTEEN&cu=INR`,
      )}`
    : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        "upi://pay?pa=LORDS.canteen@upi&pn=LORDS+Canteen&am=&cu=INR",
      )}`;

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH SCREENS (preserved exactly)
  // ═══════════════════════════════════════════════════════════════════════════

  if (!sessionReady || accessState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <Loader2 className="w-8 h-8 text-cyan animate-spin" />
      </div>
    );
  }

  if (accessState === "signed_out") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-16 relative z-10">
        <div className="glass-card w-full max-w-md p-6 sm:p-8">
          <div className="text-[10px] tracking-[4px] text-cyan font-bold mb-3">STAFF ACCESS</div>
          <h2 className="text-3xl font-bold tracking-tight font-['Space_Grotesk'] mb-2">Sign in</h2>
          <p className="text-sm text-gray-400 mb-6">Use the staff account provided by your administrator.</p>
          <form onSubmit={signIn} className="space-y-4">
            <label className="block text-xs text-gray-400">
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan/50"
              />
            </label>
            <label className="block text-xs text-gray-400">
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan/50"
              />
            </label>
            {authError && <p role="alert" className="text-sm text-rose-400">{authError}</p>}
            <button
              type="submit"
              disabled={authBusy}
              className="w-full rounded-full bg-gradient-to-r from-cyan to-violet px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {authBusy ? "Signing in..." : "SIGN IN"}
            </button>
          </form>
          <p className="text-[11px] text-gray-600 mt-5">
            Only accounts assigned staff access by the project administrator can continue.
          </p>
        </div>
      </div>
    );
  }

  if (accessState === "mfa" || accessState === "mfa_incomplete") {
    const isSetup = accessState === "mfa_incomplete" || mfaMode === "setup";
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-16 relative z-10">
        <div className="glass-card w-full max-w-md p-6 sm:p-8">
          <div className="flex items-center gap-2 text-cyan mb-4">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] tracking-[4px] font-bold">TWO-STEP VERIFICATION</span>
          </div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] mb-2">
            {accessState === "mfa_incomplete"
              ? "Finish authenticator setup"
              : isSetup
              ? "Secure your staff account"
              : "Enter your authenticator code"}
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            {accessState === "mfa_incomplete"
              ? "A previous setup was not completed. Restart it and scan the new QR code."
              : isSetup
              ? "Scan this QR code with an authenticator app, then enter the six-digit code it shows."
              : "Open your authenticator app and enter its current six-digit code."}
          </p>
          {accessState === "mfa_incomplete" ? (
            <button
              type="button"
              onClick={restartAuthenticatorSetup}
              disabled={authBusy}
              className="w-full rounded-full bg-gradient-to-r from-cyan to-violet px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {authBusy ? "Restarting..." : "RESTART SETUP"}
            </button>
          ) : (
            <>
              {isSetup && mfaQrCode && (
                <div className="mb-5 rounded-2xl bg-white p-4 text-center">
                  <img src={mfaQrCode} alt="Authenticator setup QR code" className="mx-auto h-48 w-48" />
                  {mfaSecret && (
                    <p className="mt-3 break-all font-mono text-xs text-gray-700">
                      Manual setup key: {mfaSecret}
                    </p>
                  )}
                </div>
              )}
              <form onSubmit={verifyAuthenticator} className="space-y-4">
                <label className="block text-xs text-gray-400">
                  Six-digit code
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={verificationCode}
                    onChange={(event) =>
                      setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-center font-mono text-lg tracking-[0.35em] text-white outline-none focus:border-cyan/50"
                  />
                </label>
                {authError && <p role="alert" className="text-sm text-rose-400">{authError}</p>}
                <button
                  type="submit"
                  disabled={authBusy}
                  className="w-full rounded-full bg-gradient-to-r from-cyan to-violet px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {authBusy ? "Verifying..." : isSetup ? "VERIFY AND FINISH SETUP" : "VERIFY CODE"}
                </button>
              </form>
            </>
          )}
          {authError && accessState === "mfa_incomplete" && (
            <p role="alert" className="text-sm text-rose-400 mt-4">{authError}</p>
          )}
          <button
            type="button"
            onClick={signOut}
            disabled={authBusy}
            className="mt-5 text-xs text-gray-500 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (accessState === "error" || !staffRole) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-16 relative z-10">
        <div className="glass-card w-full max-w-md p-6 sm:p-8 text-center">
          <ShieldCheck className="w-8 h-8 mx-auto mb-4 text-cyan" />
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] mb-2">Staff access unavailable</h2>
          <p role="alert" className="text-sm text-rose-400 mb-5">
            {authError ?? "Please sign in again or contact the project administrator."}
          </p>
          <button
            type="button"
            onClick={signOut}
            disabled={authBusy}
            className="rounded-full border border-white/15 px-5 py-2 text-sm text-gray-300 hover:border-cyan/40"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHORIZED DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="app-page min-h-screen pt-20 pb-16 px-4 sm:px-8 relative z-10">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-start justify-between gap-4 mb-6"
        >
          <div>
            <div className="text-[10px] tracking-[4px] text-cyan font-bold mb-1">
              {staffRole === "auditor" ? "AUDITOR DASHBOARD · READ ONLY" : "OWNER DASHBOARD"}
            </div>
            <h1 className="page-title text-3xl sm:text-4xl font-bold tracking-tight font-['Space_Grotesk']">
              {staffRole === "auditor" ? "Audit View" : "Canteen Control"}
            </h1>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={authBusy}
            className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-[10px] font-bold tracking-wider text-gray-400 hover:border-cyan/40 hover:text-white disabled:opacity-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            SIGN OUT
          </button>
        </motion.div>

        {/* ── Tab bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex gap-1 mb-6 glass rounded-2xl p-1.5"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            // hide stall/menu tabs for auditors
            if (staffRole === "auditor" && (tab.id === "stall" || tab.id === "menu")) return null;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 flex-1 justify-center rounded-xl px-3 py-2.5 text-xs font-bold tracking-wider transition-all ${
                  isActive
                    ? "bg-cyan/15 text-cyan border border-cyan/30"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label.toUpperCase()}</span>
              </button>
            );
          })}
        </motion.div>

        {/* ── Canteen filter (for multi-canteen owners / auditors) ── */}
        {!canteenId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-2 mb-5"
          >
            <button
              onClick={() => setSelectedCanteen("all")}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all ${
                selectedCanteen === "all"
                  ? "bg-cyan/15 text-cyan border border-cyan/40"
                  : "bg-white/5 text-gray-500 border border-white/10 hover:border-white/20"
              }`}
            >
              ALL CANTEENS
            </button>
            {canteens.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCanteen(c.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all ${
                  selectedCanteen === c.id
                    ? "bg-cyan/15 text-cyan border border-cyan/40"
                    : "bg-white/5 text-gray-500 border border-white/10 hover:border-white/20"
                }`}
              >
                {c.name.toUpperCase()}
              </button>
            ))}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1: ORDERS
        ══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {activeTab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                {[
                  { label: "In Queue",  count: pending.length,   color: "text-amber-400",  border: "border-amber-400/20",  bg: "bg-amber-400/5"  },
                  { label: "Preparing", count: preparing.length, color: "text-cyan",        border: "border-cyan/20",        bg: "bg-cyan/5"        },
                  { label: "Ready",     count: ready.length,     color: "text-lime-400",    border: "border-lime-400/20",    bg: "bg-lime-400/5"    },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`glass-card p-4 sm:p-5 ${stat.border} border`}
                  >
                    <div className={`text-2xl sm:text-4xl font-bold ${stat.color} font-['Space_Grotesk']`}>
                      {stat.count}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 tracking-wider mt-1">
                      {stat.label.toUpperCase()}
                    </div>
                  </motion.div>
                ))}
              </div>

              {ordersError && (
                <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mb-4">
                  {ordersError}
                </div>
              )}

              {ordersLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : activeOrders.length === 0 ? (
                <div className="glass rounded-2xl p-16 text-center">
                  <Store className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500">
                    {staffRole === "auditor" ? "No orders found for this canteen." : "No active orders right now."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {activeOrders.map((order, i) => {
                      const actions = staffRole === "owner" ? (statusActions[order.status] ?? []) : [];
                      return (
                        <motion.div
                          key={order.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ delay: i * 0.04, duration: 0.3 }}
                          className="glass-card p-4 sm:p-5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* Left: order info */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="text-center min-w-[60px]">
                                <div className="text-xs text-gray-600">#</div>
                                <div className="text-2xl font-bold text-white font-['Space_Grotesk']">
                                  {order.order_number}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs text-cyan mb-1">{canteenName(order.canteen_id)}</div>
                                <div className="flex flex-wrap gap-1.5 mb-1">
                                  {order.items.map((item) => (
                                    <span
                                      key={item.id}
                                      className="text-xs text-gray-400 bg-white/5 rounded-lg px-2 py-0.5"
                                    >
                                      {item.quantity}× {item.name}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                  <span className="font-bold text-gray-400">₹{order.total}</span>
                                  {order.customer_name && <span>• {order.customer_name}</span>}
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {staffRole === "auditor"
                                      ? new Date(order.created_at).toLocaleString()
                                      : `${order.estimated_wait_minutes}m est. wait`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: status + actions */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`badge ${STATUS_BADGE[order.status]}`}>
                                {order.status.replace("_", " ").toUpperCase()}
                              </span>
                              {actions.map((action) => (
                                <button
                                  key={action.next}
                                  onClick={() => updateStatus(order.id, action.next)}
                                  disabled={updating === order.id}
                                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r ${action.color} hover:scale-105 active:scale-95 transition-transform disabled:opacity-50`}
                                >
                                  <action.icon className="w-3.5 h-3.5" />
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 2: MENU
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {!effectiveCanteenId ? (
                <div className="glass rounded-2xl p-16 text-center">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500">Select a canteen above to manage its menu.</p>
                </div>
              ) : menuLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-6 w-32" />
                      {[...Array(3)].map((__, j) => (
                        <Skeleton key={j} className="h-16 w-full" />
                      ))}
                    </div>
                  ))}
                </div>
              ) : menuError ? (
                <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
                  {menuError}
                </div>
              ) : Object.keys(menuByCategory).length === 0 ? (
                <div className="glass rounded-2xl p-16 text-center">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500">No menu items found for this canteen.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(menuByCategory).map(([category, items]) => (
                    <div key={category}>
                      <div className="text-[10px] tracking-[4px] text-violet font-bold mb-3 uppercase">
                        {category}
                      </div>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <motion.div
                            key={item.id}
                            layout
                            className={`glass-card flex items-center gap-4 p-3 sm:p-4 transition-opacity ${
                              !item.is_available ? "opacity-50" : ""
                            }`}
                          >
                            {/* Thumbnail */}
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <UtensilsCrossed className="w-5 h-5 text-gray-600" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-sm font-semibold text-white ${
                                  !item.is_available ? "line-through text-gray-500" : ""
                                }`}
                              >
                                {item.name}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5">
                                {/* Inline price edit */}
                                {editingPrice === item.id ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500">₹</span>
                                    <input
                                      ref={priceInputRef}
                                      type="number"
                                      min={0}
                                      step={0.5}
                                      value={priceInput}
                                      onChange={(e) => setPriceInput(e.target.value)}
                                      onBlur={() => savePrice(item)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") savePrice(item);
                                        if (e.key === "Escape") setEditingPrice(null);
                                      }}
                                      className="w-20 rounded-lg border border-cyan/40 bg-black/40 px-2 py-0.5 text-xs text-white outline-none focus:border-cyan"
                                    />
                                    <button
                                      onClick={() => savePrice(item)}
                                      className="text-cyan hover:text-white transition-colors"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => startEditPrice(item)}
                                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-cyan transition-colors"
                                  >
                                    <span className="font-bold text-white">₹{item.price}</span>
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {item.prep_time_minutes}m
                                </span>
                              </div>
                            </div>

                            {/* Availability toggle */}
                            <button
                              onClick={() => toggleItemAvailability(item)}
                              disabled={togglingItem === item.id}
                              className="flex-shrink-0 disabled:opacity-50 transition-transform active:scale-95"
                            >
                              {item.is_available ? (
                                <ToggleRight className="w-8 h-8 text-cyan" />
                              ) : (
                                <ToggleLeft className="w-8 h-8 text-gray-600" />
                              )}
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 3: HISTORY
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {!effectiveCanteenId ? (
                <div className="glass rounded-2xl p-16 text-center">
                  <History className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500">Select a canteen above to view order history.</p>
                </div>
              ) : historyLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : historyError ? (
                <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
                  {historyError}
                </div>
              ) : historyOrders.length === 0 ? (
                <div className="glass rounded-2xl p-16 text-center">
                  <History className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500">No completed or cancelled orders yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyOrders.map((order, i) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="text-center min-w-[52px]">
                          <div className="text-xs text-gray-600">#</div>
                          <div className="text-xl font-bold text-white font-['Space_Grotesk']">
                            {order.order_number}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap gap-1.5 mb-1">
                            {order.items.map((item) => (
                              <span
                                key={item.id}
                                className="text-xs text-gray-400 bg-white/5 rounded-lg px-2 py-0.5"
                              >
                                {item.quantity}× {item.name}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span className="font-bold text-gray-300">₹{order.total}</span>
                            {order.customer_name && <span>• {order.customer_name}</span>}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatOrderDate(order.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`badge ${STATUS_BADGE[order.status]} self-start sm:self-center`}>
                        {order.status.toUpperCase()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 4: STALL SETTINGS
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === "stall" && (
            <motion.div
              key="stall"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {!effectiveCanteenId ? (
                <div className="glass rounded-2xl p-16 text-center">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500">Select a canteen above to manage its settings.</p>
                </div>
              ) : stallLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : stallError ? (
                <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
                  {stallError}
                </div>
              ) : stallCanteen ? (
                <>
                  {/* Stall Info Card */}
                  <div className="glass-card p-5 sm:p-6">
                    <div className="text-[10px] tracking-[4px] text-cyan font-bold mb-4">STALL DETAILS</div>
                    <h3 className="text-2xl font-bold font-['Space_Grotesk'] mb-1">{stallCanteen.name}</h3>
                    <p className="text-sm text-gray-400 mb-1">{stallCanteen.location}</p>
                    {stallCanteen.description && (
                      <p className="text-xs text-gray-600 mt-2">{stallCanteen.description}</p>
                    )}
                  </div>

                  {/* Open/Closed Toggle */}
                  <div className="glass-card p-5 sm:p-6">
                    <div className="text-[10px] tracking-[4px] text-cyan font-bold mb-4">STALL STATUS</div>

                    {/* Status banner */}
                    <motion.div
                      key={String(stallCanteen.is_open)}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`rounded-2xl px-5 py-4 mb-5 border ${
                        stallCanteen.is_open
                          ? "bg-lime-500/10 border-lime-500/30 text-lime-400"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            stallCanteen.is_open ? "bg-lime-400 pulse-dot" : "bg-rose-500"
                          }`}
                        />
                        <span className="font-bold text-sm">
                          {stallCanteen.is_open
                            ? "Your stall is OPEN — accepting orders"
                            : "Your stall is CLOSED — students cannot order"}
                        </span>
                      </div>
                    </motion.div>

                    {/* Big toggle button */}
                    <button
                      onClick={toggleStallOpen}
                      disabled={togglingStall}
                      className={`flex items-center gap-4 w-full rounded-2xl px-6 py-5 border transition-all disabled:opacity-60 ${
                        stallCanteen.is_open
                          ? "border-rose-500/40 hover:bg-rose-500/10"
                          : "border-lime-500/40 hover:bg-lime-500/10"
                      }`}
                    >
                      {togglingStall ? (
                        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
                      ) : stallCanteen.is_open ? (
                        <ToggleRight className="w-10 h-10 text-lime-400 flex-shrink-0" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-500 flex-shrink-0" />
                      )}
                      <div className="text-left">
                        <div className="font-bold text-white text-base">
                          {stallCanteen.is_open ? "Close Stall" : "Open Stall"}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {stallCanteen.is_open
                            ? "Tap to stop accepting new orders"
                            : "Tap to start accepting new orders"}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* QR Code / UPI */}
                  <div className="glass-card p-5 sm:p-6">
                    <div className="flex items-center gap-2 text-[10px] tracking-[4px] text-cyan font-bold mb-4">
                      <QrCode className="w-4 h-4" />
                      PAYMENT QR CODE
                    </div>

                    {/* UPI input */}
                    <div className="mb-5">
                      <label className="block text-xs text-gray-400 mb-1.5">Your UPI ID</label>
                      {editingUpi ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="yourname@upi"
                            className="flex-1 rounded-xl border border-cyan/30 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan/60"
                          />
                          <button
                            onClick={saveUpi}
                            className="rounded-xl bg-cyan/15 border border-cyan/30 px-4 py-2.5 text-cyan text-xs font-bold hover:bg-cyan/25 transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingUpi(false); setUpiId(savedUpi); }}
                            className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-gray-400 text-xs hover:border-white/20 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingUpi(true)}
                          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                        >
                          <span className={savedUpi ? "text-white" : "text-gray-600 italic"}>
                            {savedUpi || "Not set — click to add UPI ID"}
                          </span>
                          <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      )}
                    </div>

                    {/* QR display */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-2xl bg-white p-4 shadow-lg shadow-cyan/5">
                        <img
                          src={qrUrl}
                          alt="UPI Payment QR code"
                          className="w-48 h-48"
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        Show this to customers for payment
                      </p>
                      {savedUpi && (
                        <div className="text-xs text-cyan font-mono bg-cyan/5 border border-cyan/15 rounded-lg px-3 py-1.5">
                          {savedUpi}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
