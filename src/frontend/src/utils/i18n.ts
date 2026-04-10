import type { Language } from "../stores/lang-store";

type TranslationKey =
  | "dashboard"
  | "scanner"
  | "medicines"
  | "reports"
  | "settings"
  | "logout"
  | "login"
  | "register"
  | "totalMedicines"
  | "expired"
  | "nearExpiry"
  | "safe"
  | "addMedicine"
  | "editMedicine"
  | "deleteMedicine"
  | "searchMedicines"
  | "name"
  | "expiryDate"
  | "batchNumber"
  | "manufacturer"
  | "dosage"
  | "quantity"
  | "notes"
  | "status"
  | "save"
  | "cancel"
  | "delete"
  | "confirmDelete"
  | "confirmDeleteMsg"
  | "noMedicines"
  | "loading"
  | "error"
  | "success"
  | "username"
  | "password"
  | "loginTitle"
  | "registerTitle"
  | "scanLabel"
  | "uploadImage"
  | "useCamera"
  | "extractedData"
  | "confirmSave"
  | "recentActivity"
  | "downloadReport"
  | "language"
  | "notifications"
  | "noNotifications"
  | "medicineNearExpiry"
  | "medicineExpired"
  | "filterAll"
  | "filterSafe"
  | "filterNear"
  | "filterExpired"
  | "actions"
  | "view"
  | "edit"
  | "welcomeBack"
  | "signIn"
  | "createAccount"
  | "haveAccount"
  | "noAccount";

type Translations = Record<TranslationKey, string>;

const en: Translations = {
  dashboard: "Dashboard",
  scanner: "Scanner",
  medicines: "Medicines",
  reports: "Reports",
  settings: "Settings",
  logout: "Logout",
  login: "Login",
  register: "Register",
  totalMedicines: "Total Medicines",
  expired: "Expired",
  nearExpiry: "Near Expiry",
  safe: "Safe",
  addMedicine: "Add Medicine",
  editMedicine: "Edit Medicine",
  deleteMedicine: "Delete Medicine",
  searchMedicines: "Search medicines...",
  name: "Name",
  expiryDate: "Expiry Date",
  batchNumber: "Batch Number",
  manufacturer: "Manufacturer",
  dosage: "Dosage",
  quantity: "Quantity",
  notes: "Notes",
  status: "Status",
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  confirmDelete: "Confirm Delete",
  confirmDeleteMsg:
    "Are you sure you want to delete this medicine? This action cannot be undone.",
  noMedicines: "No medicines found",
  loading: "Loading...",
  error: "An error occurred",
  success: "Operation successful",
  username: "Username",
  password: "Password",
  loginTitle: "Sign in to MedAlert AI",
  registerTitle: "Create your account",
  scanLabel: "Scan Medicine Label",
  uploadImage: "Upload Image",
  useCamera: "Use Camera",
  extractedData: "Extracted Data",
  confirmSave: "Confirm & Save",
  recentActivity: "Recent Activity",
  downloadReport: "Download Report",
  language: "Language",
  notifications: "Notifications",
  noNotifications: "No notifications",
  medicineNearExpiry: "medicine(s) expiring within 7 days",
  medicineExpired: "medicine(s) have expired",
  filterAll: "All",
  filterSafe: "Safe",
  filterNear: "Near Expiry",
  filterExpired: "Expired",
  actions: "Actions",
  view: "View",
  edit: "Edit",
  welcomeBack: "Welcome back",
  signIn: "Sign In",
  createAccount: "Create Account",
  haveAccount: "Already have an account?",
  noAccount: "Don't have an account?",
};

const te: Translations = {
  dashboard: "డాష్‌బోర్డ్",
  scanner: "స్కానర్",
  medicines: "మందులు",
  reports: "నివేదికలు",
  settings: "సెట్టింగులు",
  logout: "లాగ్ అవుట్",
  login: "లాగిన్",
  register: "నమోదు",
  totalMedicines: "మొత్తం మందులు",
  expired: "గడువు తీరింది",
  nearExpiry: "గడువు దగ్గర పడింది",
  safe: "సురక్షితం",
  addMedicine: "మందు చేర్చు",
  editMedicine: "మందు సవరించు",
  deleteMedicine: "మందు తొలగించు",
  searchMedicines: "మందులు వెతకండి...",
  name: "పేరు",
  expiryDate: "గడువు తేదీ",
  batchNumber: "బ్యాచ్ నంబర్",
  manufacturer: "తయారీదారు",
  dosage: "మోతాదు",
  quantity: "పరిమాణం",
  notes: "గమనికలు",
  status: "స్థితి",
  save: "సేవ్ చేయి",
  cancel: "రద్దు",
  delete: "తొలగించు",
  confirmDelete: "తొలగింపు నిర్ధారించు",
  confirmDeleteMsg: "ఈ మందును తొలగించాలని మీరు నిశ్చయంగా ఉన్నారా? ఈ చర్యను రద్దు చేయలేరు.",
  noMedicines: "మందులు కనుగొనబడలేదు",
  loading: "లోడ్ అవుతోంది...",
  error: "లోపం సంభవించింది",
  success: "విజయవంతమైంది",
  username: "వినియోగదారు పేరు",
  password: "పాస్‌వర్డ్",
  loginTitle: "MedAlert AI లో సైన్ ఇన్ చేయండి",
  registerTitle: "మీ ఖాతా సృష్టించండి",
  scanLabel: "మందు లేబుల్ స్కాన్ చేయండి",
  uploadImage: "చిత్రం అప్‌లోడ్ చేయండి",
  useCamera: "కెమెరా ఉపయోగించండి",
  extractedData: "సేకరించిన డేటా",
  confirmSave: "నిర్ధారించి సేవ్ చేయండి",
  recentActivity: "ఇటీవలి కార్యాచరణ",
  downloadReport: "నివేదిక డౌన్‌లోడ్ చేయండి",
  language: "భాష",
  notifications: "నోటిఫికేషన్లు",
  noNotifications: "నోటిఫికేషన్లు లేవు",
  medicineNearExpiry: "మందులు 7 రోజుల్లో గడువు తీరుతున్నాయి",
  medicineExpired: "మందులు గడువు తీరాయి",
  filterAll: "అన్నీ",
  filterSafe: "సురక్షితం",
  filterNear: "గడువు దగ్గర పడింది",
  filterExpired: "గడువు తీరింది",
  actions: "చర్యలు",
  view: "చూడు",
  edit: "సవరించు",
  welcomeBack: "తిరిగి స్వాగతం",
  signIn: "సైన్ ఇన్",
  createAccount: "ఖాతా సృష్టించండి",
  haveAccount: "ఇప్పటికే ఖాతా ఉందా?",
  noAccount: "ఖాతా లేదా?",
};

const translations: Record<Language, Translations> = { en, te };

export function t(key: TranslationKey, lang: Language): string {
  return translations[lang][key] ?? key;
}

export function useTranslations(lang: Language) {
  return (key: TranslationKey) => t(key, lang);
}
