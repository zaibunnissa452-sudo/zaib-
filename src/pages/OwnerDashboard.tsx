import { useEffect, useState, useCallback, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, PackageCheck, Check, X, Clock, Loader2, Store, LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Order, OrderStatus, Canteen } from "../lib/types";
import type { Session } from "@supabase/supabase-js";

type StaffRole = "owner" | "auditor";
type StaffAccessState = "loading" | "signed_out" | "mfa" | "mfa_incomplete" | "authorized" | "error";

export function OwnerDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [accessState, setAccessState] = useState<StaffAccessState>("loading");
  const [staffRole, setStaffRole] = useState<StaffRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [incompleteFactorId, setIncompleteFactorId] = useState<string | null>(null);
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaMode, setMfaMode] = useState<"setup" | "challenge" | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [selectedCanteen, setSelectedCanteen] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

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
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!active) return;

      const assignedRole = staffRecord?.role;
      if (roleError || (assignedRole !== "owner" && assignedRole !== "auditor")) {
        setAuthError(roleError
          ? "Staff access isn't configured yet. Contact the project administrator."
          : "This account isn't authorized for staff access.");
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

  const restartAuthenticatorSetup = async () => {
    if (!incompleteFactorId) return;
    setAuthBusy(true);
    setAuthError(null);
    const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: incompleteFactorId });
    if (removeError) {
      setAuthError("The unfinished authenticator setup couldn't be reset. Contact the project administrator.");
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

  const loadOrders = useCallback(async () => {
    if (!staffRole) return;
    setError(null);
    let data: Order[] | null = null;
    let error: { message: string } | null = null;

    if (staffRole === "owner") {
      const result = await supabase.rpc("get_owner_orders", {
        p_canteen_id: selectedCanteen === "all" ? null : selectedCanteen,
      });
      data = result.data as Order[] | null;
      error = result.error;
    } else {
      let query = supabase
        .from("orders")
        .select("id,canteen_id,order_number,items,total,status,queue_position,estimated_wait_minutes,created_at,updated_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (selectedCanteen !== "all") query = query.eq("canteen_id", selectedCanteen);
      const result = await query;
      data = result.data as Order[] | null;
      error = result.error;
    }

    if (error) {
      setError(error.message);
    } else {
      setOrders(data as Order[]);
    }
    setLoading(false);
  }, [selectedCanteen, staffRole]);

  useEffect(() => {
    async function loadCanteens() {
      const { data } = await supabase.from("canteens").select("*").order("name");
      if (data) setCanteens(data as Canteen[]);
    }
    loadCanteens();
  }, []);

  useEffect(() => {
    if (accessState !== "authorized" || !staffRole) return;
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
    if (error) {
      setError(error.message);
    } else {
      await loadOrders();
    }
    setUpdating(null);
  };

  const canteenName = (id: string) =>
    canteens.find((c) => c.id === id)?.name ?? "Unknown";

  const pending = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready");

  const statusActions: Record<
    OrderStatus,
    { next: OrderStatus; label: string; icon: typeof ChefHat; color: string }[]
  > = {
    pending: [
      { next: "preparing", label: "Start Preparing", icon: ChefHat, color: "from-cyan to-violet" },
      { next: "cancelled", label: "Cancel", icon: X, color: "from-rose to-rose" },
    ],
    preparing: [
      { next: "ready", label: "Mark Ready", icon: PackageCheck, color: "from-lime to-cyan" },
    ],
    ready: [
      { next: "completed", label: "Complete", icon: Check, color: "from-violet to-magenta" },
    ],
    completed: [],
    cancelled: [],
  };

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
            {authError && <p role="alert" className="text-sm text-rose">{authError}</p>}
            <button
              type="submit"
              disabled={authBusy}
              className="w-full rounded-full bg-gradient-to-r from-cyan to-violet px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {authBusy ? "Signing in..." : "SIGN IN"}
            </button>
          </form>
          <p className="text-[11px] text-gray-600 mt-5">Only accounts assigned staff access by the project administrator can continue.</p>
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
            {accessState === "mfa_incomplete" ? "Finish authenticator setup" : isSetup ? "Secure your staff account" : "Enter your authenticator code"}
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
                  {mfaSecret && <p className="mt-3 break-all font-mono text-xs text-gray-700">Manual setup key: {mfaSecret}</p>}
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
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-center font-mono text-lg tracking-[0.35em] text-white outline-none focus:border-cyan/50"
                  />
                </label>
                {authError && <p role="alert" className="text-sm text-rose">{authError}</p>}
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
          {authError && accessState === "mfa_incomplete" && <p role="alert" className="text-sm text-rose mt-4">{authError}</p>}
          <button type="button" onClick={signOut} disabled={authBusy} className="mt-5 text-xs text-gray-500 hover:text-white">
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
          <p role="alert" className="text-sm text-rose mb-5">{authError ?? "Please sign in again or contact the project administrator."}</p>
          <button type="button" onClick={signOut} disabled={authBusy} className="rounded-full border border-white/15 px-5 py-2 text-sm text-gray-300 hover:border-cyan/40">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <Loader2 className="w-8 h-8 text-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 sm:px-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="text-[10px] tracking-[4px] text-cyan font-bold">
              {staffRole === "auditor" ? "AUDITOR DASHBOARD · READ ONLY" : "OWNER DASHBOARD"}
            </div>
            <button
              type="button"
              onClick={signOut}
              disabled={authBusy}
              className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-[10px] font-bold tracking-wider text-gray-400 hover:border-cyan/40 hover:text-white disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              SIGN OUT
            </button>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight font-['Space_Grotesk'] mb-6">
            {staffRole === "auditor" ? "Order Audit History" : "Order Management"}
          </h2>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {[
            { label: "In Queue", count: pending.length, color: "text-amber", border: "border-amber/20", bg: "bg-amber/5" },
            { label: "Preparing", count: preparing.length, color: "text-cyan", border: "border-cyan/20", bg: "bg-cyan/5" },
            { label: "Ready", count: ready.length, color: "text-lime", border: "border-lime/20", bg: "bg-lime/5" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
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

        {/* Canteen filter */}
        <div className="flex flex-wrap gap-2 mb-6">
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
        </div>

        {error && (
          <div className="text-rose text-xs bg-rose/10 border border-rose/20 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Store className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-500">{staffRole === "auditor" ? "No orders found for this canteen." : "No active orders right now."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {orders.map((order, i) => {
                const actions = statusActions[order.status] ?? [];
                const statusBadge: Record<OrderStatus, string> = {
                  pending: "badge-pending",
                  preparing: "badge-preparing",
                  ready: "badge-ready",
                  completed: "badge-completed",
                  cancelled: "badge-cancelled",
                };
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
                          <div className="text-xs text-cyan mb-1">
                            {canteenName(order.canteen_id)}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-1">
                            {order.items.map((item) => (
                              <span
                                key={item.id}
                                className="text-xs text-gray-400 bg-white/5 rounded-lg px-2 py-0.5"
                              >
                                {item.quantity}x {item.name}
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
                                : `${order.estimated_wait_minutes}m estimated wait`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: status badge + actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`badge ${statusBadge[order.status]}`}
                        >
                          {order.status.replace("_", " ").toUpperCase()}
                        </span>
                        {staffRole === "owner" && actions.map((action) => (
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
      </div>
    </div>
  );
}
