import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Clock,
  Pill,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Skeleton } from "../components/ui/skeleton";
import { useDashboardStats, useRecentActivity } from "../hooks/use-dashboard";
import { useNotifications } from "../hooks/use-notifications";
import { useLangStore } from "../stores/lang-store";
import type { DashboardStats } from "../types/medicine";
import { formatDate } from "../utils/date-utils";
import { useTranslations } from "../utils/i18n";

// ─── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant: "total" | "safe" | "near" | "expired";
  delay?: number;
}

const variantStyles: Record<StatCardProps["variant"], string> = {
  total: "border-border bg-card",
  safe: "stat-card-safe",
  near: "stat-card-near",
  expired: "stat-card-expired",
};

const valueColors: Record<StatCardProps["variant"], string> = {
  total: "text-foreground",
  safe: "text-safe",
  near: "text-near-expiry",
  expired: "text-expired",
};

const iconBg: Record<StatCardProps["variant"], string> = {
  total: "bg-primary/10 text-primary",
  safe: "bg-safe/10 text-safe",
  near: "bg-near-expiry/10 text-near-expiry",
  expired: "bg-expired/10 text-expired",
};

function StatCard({ label, value, icon, variant, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={`rounded-xl border p-5 flex items-center gap-4 shadow-sm transition-smooth hover:shadow-md ${variantStyles[variant]}`}
      data-ocid={`stat-card-${variant}`}
    >
      <div className={`p-3 rounded-xl shrink-0 ${iconBg[variant]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
          {label}
        </p>
        <p
          className={`text-3xl font-bold mt-0.5 tabular-nums ${valueColors[variant]}`}
        >
          {value}
        </p>
      </div>
    </motion.div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

// ─── Alert Banner ──────────────────────────────────────────────────────────────

function AlertBanner({
  expiredCount,
  nearExpiryCount,
}: {
  expiredCount: number;
  nearExpiryCount: number;
}) {
  const [dismissed, setDismissed] = useState(false);
  const { language } = useLangStore();
  const tr = useTranslations(language);

  if (dismissed || (expiredCount === 0 && nearExpiryCount === 0)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="flex items-start gap-3 rounded-xl border border-expired/30 bg-expired/10 px-4 py-3"
        data-ocid="alert-banner"
      >
        <AlertTriangle className="text-expired shrink-0 mt-0.5" size={18} />
        <div className="flex-1 min-w-0 text-sm">
          {expiredCount > 0 && (
            <span className="text-expired font-semibold mr-2">
              {expiredCount} {tr("medicineExpired")}
            </span>
          )}
          {nearExpiryCount > 0 && (
            <span className="text-near-expiry font-semibold mr-2">
              {nearExpiryCount} {tr("medicineNearExpiry")}
            </span>
          )}
          <Link
            to="/app/medicines"
            className="inline-flex items-center gap-1 text-foreground underline underline-offset-2 hover:text-primary transition-colors-fast ml-1"
            data-ocid="alert-banner-link"
          >
            View Medicines <ChevronRight size={13} />
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss alert"
          className="text-muted-foreground hover:text-foreground transition-colors-fast shrink-0"
          data-ocid="alert-banner-dismiss"
        >
          <X size={15} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Donut Chart ───────────────────────────────────────────────────────────────

const DONUT_COLORS = [
  "oklch(0.72 0.2 152)",
  "oklch(0.78 0.19 78)",
  "oklch(0.65 0.22 27)",
];

interface TooltipPayload {
  name: string;
  value: number;
  payload: { total: number };
}

interface DonutTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  const pct = p.total > 0 ? Math.round((value / p.total) * 100) : 0;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{name}</p>
      <p className="text-muted-foreground">
        {value} medicines ({pct}%)
      </p>
    </div>
  );
}

function StatusDonutChart({ stats }: { stats: DashboardStats }) {
  const data = [
    { name: "Safe", value: stats.safe, total: stats.total },
    { name: "Near Expiry", value: stats.nearExpiry, total: stats.total },
    { name: "Expired", value: stats.expired, total: stats.total },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No medicines to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={DONUT_COLORS[index % DONUT_COLORS.length]}
              opacity={0.9}
            />
          ))}
        </Pie>
        <Tooltip content={<DonutTooltip />} />
        <Legend
          formatter={(value: string) => (
            <span className="text-xs text-muted-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Bar Chart (Monthly Additions) ────────────────────────────────────────────

const MONTHLY_DATA = [
  { month: "Oct", added: 3 },
  { month: "Nov", added: 5 },
  { month: "Dec", added: 2 },
  { month: "Jan", added: 7 },
  { month: "Feb", added: 4 },
  { month: "Mar", added: 6 },
  { month: "Apr", added: 2 },
];

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function BarTooltipContent({ active, payload, label }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">
        {payload[0].value} medicines added
      </p>
    </div>
  );
}

function MonthlyBarChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={MONTHLY_DATA} barSize={28}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="oklch(0.22 0.008 250 / 0.6)"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "oklch(0.55 0.01 240)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "oklch(0.55 0.01 240)" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={28}
        />
        <Tooltip
          content={<BarTooltipContent />}
          cursor={{ fill: "oklch(0.72 0.2 152 / 0.06)" }}
        />
        <Bar
          dataKey="added"
          fill="oklch(0.72 0.2 152)"
          radius={[4, 4, 0, 0]}
          name="Added"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Recent Activity ───────────────────────────────────────────────────────────

function RecentActivityList() {
  const { data: activity = [], isLoading } = useRecentActivity();
  const { language } = useLangStore();
  const tr = useTranslations(language);

  return (
    <div className="space-y-1" data-ocid="recent-activity-list">
      {isLoading ? (
        (["s1", "s2", "s3", "s4", "s5"] as const).map((sk) => (
          <div
            key={sk}
            className="flex items-center gap-3 rounded-lg px-3 py-3"
          >
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3 w-36 mb-1.5" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))
      ) : activity.length === 0 ? (
        <div
          className="py-8 text-center text-sm text-muted-foreground"
          data-ocid="activity-empty"
        >
          {tr("noMedicines")}
        </div>
      ) : (
        activity.map((med, i) => (
          <motion.div
            key={med.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/40 transition-colors-fast group"
            data-ocid={`activity-row-${med.id}`}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Pill size={14} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {med.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Expires {formatDate(med.expiryDate)} · {med.manufacturer}
              </p>
            </div>
            <StatusBadge status={med.status} />
          </motion.div>
        ))
      )}
    </div>
  );
}

// ─── Main Dashboard Page ───────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { expiredCount, nearExpiryCount } = useNotifications();
  const { language } = useLangStore();
  const tr = useTranslations(language);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" data-ocid="dashboard-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Medicine Monitoring Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time overview of your medicine inventory
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-lg px-3 py-2">
          <Activity size={13} className="text-primary" />
          <span>
            Live ·{" "}
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Alert Banner */}
      <AlertBanner
        expiredCount={expiredCount}
        nearExpiryCount={nearExpiryCount}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          (["total", "safe", "near", "expired"] as const).map((k) => (
            <StatCardSkeleton key={k} />
          ))
        ) : (
          <>
            <StatCard
              label={tr("totalMedicines")}
              value={stats?.total ?? 0}
              icon={<Pill size={22} />}
              variant="total"
              delay={0}
            />
            <StatCard
              label={tr("safe")}
              value={stats?.safe ?? 0}
              icon={<ShieldCheck size={22} />}
              variant="safe"
              delay={0.07}
            />
            <StatCard
              label={tr("nearExpiry")}
              value={stats?.nearExpiry ?? 0}
              icon={<Clock size={22} />}
              variant="near"
              delay={0.14}
            />
            <StatCard
              label={tr("expired")}
              value={stats?.expired ?? 0}
              icon={<AlertTriangle size={22} />}
              variant="expired"
              delay={0.21}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
          className="rounded-xl border border-border bg-card p-5"
          data-ocid="status-breakdown-chart"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Activity size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Status Breakdown
              </h2>
              <p className="text-xs text-muted-foreground">
                Medicine status distribution
              </p>
            </div>
          </div>
          {statsLoading ? (
            <div className="flex items-center justify-center h-[220px]">
              <Skeleton className="w-36 h-36 rounded-full" />
            </div>
          ) : (
            <StatusDonutChart
              stats={stats ?? { total: 0, expired: 0, nearExpiry: 0, safe: 0 }}
            />
          )}
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="rounded-xl border border-border bg-card p-5"
          data-ocid="monthly-additions-chart"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <TrendingUp size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Monthly Additions
              </h2>
              <p className="text-xs text-muted-foreground">
                Medicines added per month
              </p>
            </div>
          </div>
          <MonthlyBarChart />
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.4 }}
        className="rounded-xl border border-border bg-card p-5"
        data-ocid="recent-activity-section"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Clock size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {tr("recentActivity")}
              </h2>
              <p className="text-xs text-muted-foreground">
                Last 5 updated medicines
              </p>
            </div>
          </div>
          <Link
            to="/app/medicines"
            className="text-xs text-primary hover:text-primary/80 transition-colors-fast flex items-center gap-1"
            data-ocid="view-all-medicines-link"
          >
            View all <ChevronRight size={13} />
          </Link>
        </div>
        <RecentActivityList />
      </motion.div>
    </div>
  );
}
