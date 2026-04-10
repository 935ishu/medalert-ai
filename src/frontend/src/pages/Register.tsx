import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Shield,
  Stethoscope,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { backendApi } from "../hooks/use-backend";
import { useAuthStore } from "../stores/auth-store";
import { useLangStore } from "../stores/lang-store";
import { useTranslations } from "../utils/i18n";

interface FieldError {
  username?: string;
  password?: string;
  confirm?: string;
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const hasLen = password.length >= 8;
  const hasNum = /\d/.test(password);
  const hasCap = /[A-Z]/.test(password);
  const score = [hasLen, hasNum, hasCap].filter(Boolean).length;
  const labels = ["Weak", "Fair", "Strong"];
  const colors = [
    "oklch(var(--expired))",
    "oklch(var(--near-expiry))",
    "oklch(var(--safe))",
  ];
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-smooth"
            style={{
              background:
                i < score ? colors[score - 1] : "oklch(var(--border))",
            }}
          />
        ))}
      </div>
      <p
        className="text-xs"
        style={{
          color:
            score > 0 ? colors[score - 1] : "oklch(var(--muted-foreground))",
        }}
      >
        {score > 0 ? labels[score - 1] : ""}
        {score === 0 && password.length > 0 ? "Too short" : ""}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const language = useLangStore((s) => s.language);
  const tr = useTranslations(language);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState({
    username: false,
    password: false,
    confirm: false,
  });
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/app/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  function validate(): FieldError {
    const e: FieldError = {};
    if (!username.trim()) {
      e.username = "Username is required";
    } else if (username.trim().length < 3) {
      e.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      e.username = "Only letters, numbers, and underscores allowed";
    }
    if (!password) {
      e.password = "Password is required";
    } else if (password.length < 6) {
      e.password = "Password must be at least 6 characters";
    }
    if (!confirm) {
      e.confirm = "Please confirm your password";
    } else if (password !== confirm) {
      e.confirm = "Passwords do not match";
    }
    return e;
  }

  function handleBlur(field: "username" | "password" | "confirm") {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true, confirm: true });
    const e2 = validate();
    setErrors(e2);
    if (Object.keys(e2).length > 0) return;

    setLoading(true);
    try {
      const result = backendApi.register(username.trim(), password);
      if ("err" in result && result.err) {
        toast.error(result.err);
        setErrors({ username: result.err });
        return;
      }
      if ("ok" in result && result.ok) {
        toast.success("Account created! Welcome to MedAlert AI.");
        setSession(result.ok.token, result.ok.user);
        navigate({ to: "/app/dashboard" });
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = confirm.length > 0 && password === confirm;

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden"
      data-ocid="register-page"
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 right-1/4 w-96 h-96 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, oklch(var(--safe) / 0.3), transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, oklch(var(--primary) / 0.25), transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(var(--safe) / 0.03) 0%, transparent 50%, oklch(var(--primary) / 0.04) 100%)",
          }}
        />
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {[
          { id: "r1", top: "10%", left: "6%", size: "w-8 h-8" },
          { id: "r2", top: "65%", left: "4%", size: "w-5 h-5" },
          { id: "r3", top: "20%", right: "5%", size: "w-7 h-7" },
          { id: "r4", top: "80%", right: "7%", size: "w-9 h-9" },
        ].map((pos) => (
          <div
            key={pos.id}
            className={`absolute ${pos.size} rounded-full border opacity-[0.08]`}
            style={{
              top: pos.top,
              left: (pos as { left?: string }).left,
              right: (pos as { right?: string }).right,
              borderColor: "oklch(var(--safe))",
              background: "oklch(var(--safe) / 0.05)",
            }}
          />
        ))}
      </div>

      <div
        ref={cardRef}
        className="w-full max-w-md relative z-10 transition-all duration-700"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(24px)",
        }}
      >
        {/* Logo + branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--safe) / 0.18), oklch(var(--primary) / 0.08))",
                border: "1px solid oklch(var(--safe) / 0.3)",
                boxShadow:
                  "0 0 40px oklch(var(--safe) / 0.15), 0 8px 32px oklch(0 0 0 / 0.4)",
              }}
            >
              <Stethoscope
                className="w-10 h-10"
                style={{ color: "oklch(var(--safe))" }}
              />
            </div>
          </div>

          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
            Med<span style={{ color: "oklch(var(--primary))" }}>Alert</span> AI
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Create your healthcare account
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
          style={{
            boxShadow:
              "0 24px 64px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(var(--border))",
          }}
        >
          {/* Card header bar */}
          <div
            className="px-6 py-4 border-b border-border"
            style={{
              background:
                "linear-gradient(90deg, oklch(var(--safe) / 0.06), oklch(var(--card)))",
            }}
          >
            <h2 className="text-base font-semibold text-foreground">
              {tr("registerTitle")}
            </h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              Join MedAlert AI to monitor your medicines
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              {/* Username */}
              <div>
                <label
                  htmlFor="reg-username"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  {tr("username")}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </span>
                  <input
                    id="reg-username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (touched.username) setErrors(validate());
                    }}
                    onBlur={() => handleBlur("username")}
                    placeholder="Choose a username"
                    className="w-full bg-background border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-smooth"
                    style={{
                      borderColor:
                        errors.username && touched.username
                          ? "oklch(var(--expired))"
                          : "oklch(var(--input))",
                    }}
                    autoComplete="username"
                    data-ocid="register-username"
                    aria-invalid={!!(errors.username && touched.username)}
                    aria-describedby={
                      errors.username ? "reg-username-error" : undefined
                    }
                  />
                </div>
                {errors.username && touched.username && (
                  <p
                    id="reg-username-error"
                    className="mt-1 text-xs"
                    style={{ color: "oklch(var(--expired))" }}
                  >
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  {tr("password")}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </span>
                  <input
                    id="reg-password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (touched.password) setErrors(validate());
                    }}
                    onBlur={() => handleBlur("password")}
                    placeholder="Min 6 characters"
                    className="w-full bg-background border rounded-lg pl-9 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-smooth"
                    style={{
                      borderColor:
                        errors.password && touched.password
                          ? "oklch(var(--expired))"
                          : "oklch(var(--input))",
                    }}
                    autoComplete="new-password"
                    data-ocid="register-password"
                    aria-invalid={!!(errors.password && touched.password)}
                    aria-describedby="reg-password-error"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors-fast"
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p
                    id="reg-password-error"
                    className="mt-1 text-xs"
                    style={{ color: "oklch(var(--expired))" }}
                  >
                    {errors.password}
                  </p>
                )}
                <PasswordStrength password={password} />
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="reg-confirm"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </span>
                  <input
                    id="reg-confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      if (touched.confirm) setErrors(validate());
                    }}
                    onBlur={() => handleBlur("confirm")}
                    placeholder="Repeat password"
                    className="w-full bg-background border rounded-lg pl-9 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-smooth"
                    style={{
                      borderColor:
                        errors.confirm && touched.confirm
                          ? "oklch(var(--expired))"
                          : passwordsMatch
                            ? "oklch(var(--safe))"
                            : "oklch(var(--input))",
                    }}
                    autoComplete="new-password"
                    data-ocid="register-confirm"
                    aria-invalid={!!(errors.confirm && touched.confirm)}
                    aria-describedby={
                      errors.confirm ? "reg-confirm-error" : undefined
                    }
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {passwordsMatch && (
                      <CheckCircle2
                        className="w-4 h-4"
                        style={{ color: "oklch(var(--safe))" }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="text-muted-foreground hover:text-foreground transition-colors-fast"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {errors.confirm && touched.confirm && (
                  <p
                    id="reg-confirm-error"
                    className="mt-1 text-xs"
                    style={{ color: "oklch(var(--expired))" }}
                  >
                    {errors.confirm}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                data-ocid="register-submit"
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                style={{
                  background: loading
                    ? "oklch(var(--primary) / 0.7)"
                    : "oklch(var(--primary))",
                  color: "oklch(var(--primary-foreground))",
                  boxShadow: loading
                    ? "none"
                    : "0 4px 16px oklch(var(--primary) / 0.35)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : (
                  tr("createAccount")
                )}
              </button>
            </form>

            {/* Footer link */}
            <div className="mt-5 pt-4 border-t border-border text-center">
              <span className="text-muted-foreground text-sm">
                {tr("haveAccount")}{" "}
              </span>
              <button
                type="button"
                data-ocid="register-to-login"
                className="text-sm font-medium transition-colors-fast hover:underline"
                style={{ color: "oklch(var(--primary))" }}
                onClick={() => navigate({ to: "/" })}
              >
                {tr("signIn")}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5 flex items-center justify-center gap-1.5">
          <Shield className="w-3 h-3" />
          Secured by Internet Computer · Your data stays private
        </p>
      </div>
    </div>
  );
}
