import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  CheckCircle2,
  Globe,
  Info,
  ShieldAlert,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/auth-store";
import { useLangStore } from "../stores/lang-store";
import { useTranslations } from "../utils/i18n";

// ─── Section wrapper ────────────────────────────────────────────────────────
function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </section>
  );
}

// ─── Row helper ──────────────────────────────────────────────────────────────
function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Info row ────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground font-mono">
        {value}
      </span>
    </div>
  );
}

// ─── Language pill button ────────────────────────────────────────────────────
function LangButton({
  active,
  label,
  onClick,
  dataOcid,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  dataOcid: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-ocid={dataOcid}
      className={[
        "px-4 py-2 rounded-lg text-sm font-medium transition-smooth border",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-md"
          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { language, setLanguage } = useLangStore();
  const { user } = useAuthStore();
  const t = useTranslations(language);

  const [notifGranted, setNotifGranted] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setNotifGranted(Notification.permission);
    }
  }, []);

  const handleNotifToggle = async (checked: boolean) => {
    if (!("Notification" in window)) return;
    if (checked) {
      const result = await Notification.requestPermission();
      setNotifGranted(result);
    } else {
      // Browser doesn't allow revoking; inform user
      setNotifGranted("denied");
    }
  };

  const notifEnabled = notifGranted === "granted";
  const notifBlocked = notifGranted === "denied";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6" data-ocid="settings-page">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {t("settings")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {language === "en"
            ? "Manage your preferences and account settings"
            : "మీ ప్రాధాన్యతలు మరియు ఖాతా సెట్టింగులను నిర్వహించండి"}
        </p>
      </div>

      {/* ── Language ── */}
      <SettingsSection
        icon={Globe}
        title={language === "en" ? "Language" : "భాష"}
      >
        <SettingsRow
          label={language === "en" ? "Display Language" : "ప్రదర్శన భాష"}
          description={
            language === "en"
              ? "Choose the language for the entire app"
              : "యాప్ మొత్తానికి భాష ఎంచుకోండి"
          }
        >
          <div className="flex gap-2" data-ocid="lang-toggle">
            <LangButton
              active={language === "en"}
              label="English"
              onClick={() => setLanguage("en")}
              dataOcid="lang-en"
            />
            <LangButton
              active={language === "te"}
              label="తెలుగు"
              onClick={() => setLanguage("te")}
              dataOcid="lang-te"
            />
          </div>
        </SettingsRow>

        <Separator className="bg-border/50" />

        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            {language === "en"
              ? "Language preference is saved automatically and persists across sessions."
              : "భాష ప్రాధాన్యత స్వయంచాలకంగా సేవ్ అవుతుంది మరియు సెషన్‌ల మధ్య కొనసాగుతుంది."}
          </p>
        </div>
      </SettingsSection>

      {/* ── User Profile ── */}
      <SettingsSection
        icon={User}
        title={language === "en" ? "Profile" : "ప్రొఫైల్"}
      >
        <InfoRow
          label={language === "en" ? "Username" : "వినియోగదారు పేరు"}
          value={user?.username ?? "—"}
        />
        <Separator className="bg-border/50" />
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-muted-foreground">
            {language === "en" ? "Role" : "పాత్ర"}
          </span>
          <Badge
            variant="outline"
            data-ocid="user-role-badge"
            className={
              user?.role === "admin"
                ? "border-primary/40 text-primary bg-primary/10"
                : "border-border text-muted-foreground"
            }
          >
            {user?.role === "admin"
              ? language === "en"
                ? "Admin"
                : "అడ్మిన్"
              : language === "en"
                ? "User"
                : "వినియోగదారు"}
          </Badge>
        </div>
        <Separator className="bg-border/50" />
        <InfoRow
          label={language === "en" ? "Account type" : "ఖాతా రకం"}
          value={language === "en" ? "Local credentials" : "స్థానిక ఆధారపత్రాలు"}
        />
        <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-muted/40 border border-border">
          <ShieldAlert className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            {language === "en"
              ? "Profile details are read-only. Contact your administrator to update account information."
              : "ప్రొఫైల్ వివరాలు చదవడానికి మాత్రమే. ఖాతా సమాచారాన్ని నవీకరించడానికి మీ నిర్వాహకుని సంప్రదించండి."}
          </p>
        </div>
      </SettingsSection>

      {/* ── Notifications ── */}
      <SettingsSection icon={Bell} title={t("notifications")}>
        <SettingsRow
          label={language === "en" ? "Browser Notifications" : "బ్రౌజర్ నోటిఫికేషన్లు"}
          description={
            language === "en"
              ? "Receive alerts for expired or near-expiry medicines"
              : "గడువు తీరిన లేదా దగ్గరపడిన మందులకు హెచ్చరికలు పొందండి"
          }
        >
          <Switch
            checked={notifEnabled}
            onCheckedChange={handleNotifToggle}
            disabled={notifBlocked}
            data-ocid="notif-toggle"
            aria-label="Toggle browser notifications"
          />
        </SettingsRow>

        {notifBlocked && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-expired/10 border badge-expired">
            <XCircle className="w-4 h-4 text-expired mt-0.5 shrink-0" />
            <p className="text-xs text-expired">
              {language === "en"
                ? "Notifications are blocked in your browser. To enable them, update your browser's site permissions for this app."
                : "మీ బ్రౌజర్‌లో నోటిఫికేషన్లు నిరోధించబడ్డాయి. వాటిని ప్రారంభించడానికి, ఈ యాప్‌కు మీ బ్రౌజర్ సైట్ అనుమతులను నవీకరించండి."}
            </p>
          </div>
        )}

        {notifEnabled && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-safe/10 border badge-safe">
            <CheckCircle2 className="w-4 h-4 text-safe shrink-0" />
            <p className="text-xs text-safe">
              {language === "en"
                ? "Browser notifications are enabled. You will be alerted when medicines are near or past their expiry."
                : "బ్రౌజర్ నోటిఫికేషన్లు ప్రారంభించబడ్డాయి. మందులు గడువు దగ్గర పడినప్పుడు లేదా గడువు తీరినప్పుడు మీకు హెచ్చరిక ఇవ్వబడుతుంది."}
            </p>
          </div>
        )}
      </SettingsSection>

      {/* ── App Info ── */}
      <SettingsSection
        icon={Info}
        title={language === "en" ? "App Information" : "యాప్ సమాచారం"}
      >
        <InfoRow
          label={language === "en" ? "Application" : "అప్లికేషన్"}
          value="MedAlert AI"
        />
        <Separator className="bg-border/50" />
        <InfoRow label={language === "en" ? "Version" : "వెర్షన్"} value="1.0.0" />
        <Separator className="bg-border/50" />
        <InfoRow
          label={language === "en" ? "Platform" : "ప్లాట్‌ఫారమ్"}
          value="Internet Computer"
        />
        <Separator className="bg-border/50" />
        <InfoRow
          label={language === "en" ? "Backend" : "బ్యాక్‌ఎండ్"}
          value="Motoko Canister"
        />
        <Separator className="bg-border/50" />
        <div className="pt-1">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {language === "en"
              ? "MedAlert AI is a full-stack medicine monitoring system built on the Internet Computer blockchain. It uses OCR to extract medicine label data, tracks expiry dates, and sends alerts to help prevent medication errors."
              : "MedAlert AI అనేది ఇంటర్నెట్ కంప్యూటర్ బ్లాక్‌చెయిన్‌పై నిర్మించిన పూర్తి-స్టాక్ మందుల పర్యవేక్షణ వ్యవస్థ. ఇది మందుల లేబుల్ డేటాను సేకరించడానికి OCR ఉపయోగిస్తుంది, గడువు తేదీలను ట్రాక్ చేస్తుంది మరియు మందుల తప్పులను నివారించడంలో సహాయపడేందుకు హెచ్చరికలు పంపుతుంది."}
          </p>
        </div>
      </SettingsSection>

      {/* ── Disclaimer ── */}
      <section className="bg-expired/5 border badge-expired rounded-xl px-6 py-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-expired shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-expired mb-1">
              {language === "en" ? "Healthcare Disclaimer" : "ఆరోగ్య సేవ నిరాకరణ"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === "en"
                ? "MedAlert AI is intended as a supplementary tool to assist with medicine tracking. It does not replace professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions. The accuracy of OCR-extracted data should be verified before relying on it for clinical purposes."
                : "MedAlert AI అనేది మందుల ట్రాకింగ్‌లో సహాయపడటానికి అదనపు సాధనంగా ఉద్దేశించబడింది. ఇది వృత్తిపరమైన వైద్య సలహా, నిర్ధారణ లేదా చికిత్సను భర్తీ చేయదు. వైద్య నిర్ణయాల కోసం ఎల్లప్పుడూ అర్హత కలిగిన ఆరోగ్య సంరక్షణ ప్రదాతని సంప్రదించండి. క్లినికల్ ప్రయోజనాల కోసం ఆధారపడే ముందు OCR-సేకరించిన డేటా యొక్క ఖచ్చితత్వాన్ని ధృవీకరించాలి."}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground pb-2">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors duration-200"
        >
          Built with love using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
