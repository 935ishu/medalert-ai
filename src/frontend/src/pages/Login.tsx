import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
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
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const language = useLangStore((s) => s.language);
  const tr = useTranslations(language);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState({ username: false, password: false });
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
    if (!username.trim()) e.username = "Username is required";
    if (!password.trim()) e.password = "Password is required";
    return e;
  }

  function handleBlur(field: "username" | "password") {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const e = validate();
    setErrors(e);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true });
    const e2 = validate();
    setErrors(e2);
    if (Object.keys(e2).length > 0) return;

    setLoading(true);
    try {
      const result = backendApi.login(username.trim(), password.trim());
      if ("err" in result && result.err) {
        toast.error(result.err);
        setErrors({ password: result.err });
        return;
      }
      if ("ok" in result && result.ok) {
        toast.success(`${tr("welcomeBack")}, ${result.ok.user.username}!`);
        setSession(result.ok.token, result.ok.user);
        navigate({ to: "/app/dashboard" });
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setUsername("admin");
    setPassword("admin123");
    setErrors({});
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden"
      data-ocid="login-page"
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, oklch(var(--primary) / 0.3), transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, oklch(var(--safe) / 0.25), transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(var(--primary) / 0.04) 0%, transparent 50%, oklch(var(--safe) / 0.03) 100%)",
          }}
        />
      </div>

      {/* Decorative floating pills */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {[
          { id: "d1", top: "12%", left: "8%", delay: "0s", size: "w-8 h-8" },
          { id: "d2", top: "70%", left: "5%", delay: "0.5s", size: "w-6 h-6" },
          {
            id: "d3",
            top: "25%",
            right: "6%",
            delay: "0.3s",
            size: "w-10 h-10",
          },
          { id: "d4", top: "75%", right: "8%", delay: "0.8s", size: "w-7 h-7" },
        ].map((pos) => (
          <div
            key={pos.id}
            className={`absolute ${pos.size} rounded-full border opacity-10`}
            style={{
              top: pos.top,
              left: (pos as { left?: string }).left,
              right: (pos as { right?: string }).right,
              borderColor: "oklch(var(--primary))",
              background: "oklch(var(--primary) / 0.05)",
              animationDelay: pos.delay,
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
                  "linear-gradient(135deg, oklch(var(--primary) / 0.2), oklch(var(--primary) / 0.08))",
                border: "1px solid oklch(var(--primary) / 0.35)",
                boxShadow:
                  "0 0 40px oklch(var(--primary) / 0.2), 0 8px 32px oklch(0 0 0 / 0.4)",
              }}
            >
              <Stethoscope
                className="w-10 h-10"
                style={{ color: "oklch(var(--primary))" }}
              />
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(var(--safe))",
                boxShadow: "0 0 12px oklch(var(--safe) / 0.6)",
              }}
            >
              <Activity
                className="w-3 h-3"
                style={{ color: "oklch(var(--primary-foreground))" }}
              />
            </div>
          </div>

          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
            Med<span style={{ color: "oklch(var(--primary))" }}>Alert</span> AI
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Healthcare-grade Medicine Monitoring
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
                "linear-gradient(90deg, oklch(var(--primary) / 0.08), oklch(var(--card)))",
            }}
          >
            <h2 className="text-base font-semibold text-foreground">
              {tr("loginTitle")}
            </h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              {tr("welcomeBack")} — enter your credentials below
            </p>
          </div>

          <div className="p-6">
            {/* Demo hint */}
            <button
              type="button"
              onClick={fillDemo}
              data-ocid="login-demo-hint"
              className="w-full mb-5 px-3 py-2.5 rounded-lg border text-xs flex items-center gap-2 transition-smooth hover:border-primary/50 group"
              style={{
                background: "oklch(var(--primary) / 0.06)",
                borderColor: "oklch(var(--primary) / 0.25)",
              }}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(var(--primary) / 0.2)" }}
              >
                <User
                  className="w-3 h-3"
                  style={{ color: "oklch(var(--primary))" }}
                />
              </div>
              <span className="text-muted-foreground">
                Demo credentials:{" "}
                <span
                  className="font-mono"
                  style={{ color: "oklch(var(--primary))" }}
                >
                  admin / admin123
                </span>
                <span className="ml-1 group-hover:underline">
                  — click to fill
                </span>
              </span>
            </button>

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  {tr("username")}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </span>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (touched.username) setErrors(validate());
                    }}
                    onBlur={() => handleBlur("username")}
                    placeholder="Enter your username"
                    className="w-full bg-background border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-smooth"
                    style={{
                      borderColor:
                        errors.username && touched.username
                          ? "oklch(var(--expired))"
                          : "oklch(var(--input))",
                      // @ts-expect-error CSS custom property
                      "--tw-ring-color": "oklch(var(--ring))",
                    }}
                    autoComplete="username"
                    data-ocid="login-username"
                    aria-invalid={!!(errors.username && touched.username)}
                    aria-describedby={
                      errors.username ? "username-error" : undefined
                    }
                  />
                </div>
                {errors.username && touched.username && (
                  <p
                    id="username-error"
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
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  {tr("password")}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </span>
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (touched.password) setErrors(validate());
                    }}
                    onBlur={() => handleBlur("password")}
                    placeholder="Enter your password"
                    className="w-full bg-background border rounded-lg pl-9 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-smooth"
                    style={{
                      borderColor:
                        errors.password && touched.password
                          ? "oklch(var(--expired))"
                          : "oklch(var(--input))",
                    }}
                    autoComplete="current-password"
                    data-ocid="login-password"
                    aria-invalid={!!(errors.password && touched.password)}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors-fast"
                    aria-label={showPw ? "Hide password" : "Show password"}
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
                    id="password-error"
                    className="mt-1 text-xs"
                    style={{ color: "oklch(var(--expired))" }}
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                data-ocid="login-submit"
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed mt-1 relative overflow-hidden"
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
                    Signing in…
                  </span>
                ) : (
                  tr("signIn")
                )}
              </button>
            </form>

            {/* Footer link */}
            <div className="mt-5 pt-4 border-t border-border text-center">
              <span className="text-muted-foreground text-sm">
                {tr("noAccount")}{" "}
              </span>
              <button
                type="button"
                data-ocid="login-to-register"
                className="text-sm font-medium transition-colors-fast hover:underline"
                style={{ color: "oklch(var(--primary))" }}
                onClick={() => navigate({ to: "/register" })}
              >
                {tr("createAccount")}
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
