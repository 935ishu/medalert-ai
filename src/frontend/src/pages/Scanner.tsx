import { toast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCamera } from "@caffeineai/camera";
import {
  AlertTriangle,
  Barcode,
  Camera,
  CheckCircle,
  RefreshCw,
  ScanLine,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useAddMedicine } from "../hooks/use-medicines";
import { useLangStore } from "../stores/lang-store";
import type { AddMedicineRequest } from "../types/medicine";
import { useTranslations } from "../utils/i18n";

// ── Types ────────────────────────────────────────────────────────────────────

interface ExtractedData {
  name: string;
  expiryDate: string;
  batchNumber: string;
  manufacturer: string;
  dosage: string;
  quantity: number;
  notes: string;
}

interface OcrProgress {
  status: string;
  progress: number;
}

type ScanTab = "ocr" | "barcode";
type OcrSource = "upload" | "camera";

// ── OCR helpers ───────────────────────────────────────────────────────────────

function parseExpiryDate(text: string): string {
  const patterns = [
    /exp(?:iry|\.)?[\s:]*(\d{2})[\/\-](\d{4})/i,
    /exp(?:iry|\.)?[\s:]*(\d{2})[\/\-](\d{2})/i,
    /(\d{2})[\/\-](\d{4})/,
    /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/,
    /(\w{3,9})\s+(\d{4})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      if (m.length === 3 && m[2].length === 4)
        return `${m[2]}-${m[1].padStart(2, "0")}-01`;
      if (m.length === 4)
        return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    }
  }
  return "";
}

function parseMedicineName(text: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    if (line.length > 3 && line.length < 60 && /[A-Za-z]/.test(line)) {
      return line.replace(/[^A-Za-z0-9\s\-().]/g, "").trim();
    }
  }
  return "";
}

function extractFromOcrText(raw: string): Partial<ExtractedData> {
  const name = parseMedicineName(raw);
  const expiryDate = parseExpiryDate(raw);
  const batchMatch = raw.match(
    /(?:batch|lot|b\.no|lot no)[\s:]*([A-Z0-9\-]+)/i,
  );
  const mfgMatch = raw.match(
    /(?:mfg|manufactured by|manf)[\s:\.]*([A-Za-z][\w\s&.,]+)/i,
  );
  const dosageMatch = raw.match(/(\d+(?:\.\d+)?\s*(?:mg|ml|mcg|iu|g|%|IU))/i);
  return {
    name,
    expiryDate,
    batchNumber: batchMatch ? batchMatch[1].trim() : "",
    manufacturer: mfgMatch ? mfgMatch[1].trim().slice(0, 60) : "",
    dosage: dosageMatch ? dosageMatch[1].trim() : "",
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface ImagePreviewProps {
  src: string;
  onClear: () => void;
}

function ImagePreview({ src, onClear }: ImagePreviewProps) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-border">
      <img
        src={src}
        alt="Medicine label"
        className="w-full max-h-72 object-contain bg-muted/20"
      />
      <button
        type="button"
        onClick={onClear}
        aria-label="Remove image"
        className="absolute top-2 right-2 rounded-full bg-card/80 border border-border p-1 hover:bg-destructive/20 transition-smooth"
      >
        <X className="h-4 w-4 text-foreground" />
      </button>
    </div>
  );
}

interface OcrProgressBarProps {
  progress: OcrProgress;
}

function OcrProgressBar({ progress }: OcrProgressBarProps) {
  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{progress.status}</span>
        <span className="text-primary font-mono">
          {Math.round(progress.progress * 100)}%
        </span>
      </div>
      <Progress value={progress.progress * 100} className="h-1.5" />
    </div>
  );
}

// ── Confirmation Form ─────────────────────────────────────────────────────────

interface ConfirmFormProps {
  initial: Partial<ExtractedData>;
  onSave: (data: ExtractedData) => void;
  onCancel: () => void;
  isSaving: boolean;
}

function ConfirmForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: ConfirmFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExtractedData>({
    defaultValues: {
      name: initial.name ?? "",
      expiryDate: initial.expiryDate ?? "",
      batchNumber: initial.batchNumber ?? "",
      manufacturer: initial.manufacturer ?? "",
      dosage: initial.dosage ?? "",
      quantity: initial.quantity ?? 1,
      notes: initial.notes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Medicine Name *</Label>
          <Input
            id="name"
            {...register("name", { required: "Name is required" })}
            placeholder="e.g. Paracetamol 500mg"
            data-ocid="confirm-name"
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expiryDate">Expiry Date *</Label>
          <Input
            id="expiryDate"
            type="date"
            {...register("expiryDate", { required: "Expiry date is required" })}
            data-ocid="confirm-expiry"
          />
          {errors.expiryDate && (
            <p className="text-xs text-destructive">
              {errors.expiryDate.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="batchNumber">Batch Number</Label>
          <Input
            id="batchNumber"
            {...register("batchNumber")}
            placeholder="e.g. BN2024001"
            data-ocid="confirm-batch"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input
            id="manufacturer"
            {...register("manufacturer")}
            placeholder="e.g. Sun Pharma"
            data-ocid="confirm-manufacturer"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dosage">Dosage</Label>
          <Input
            id="dosage"
            {...register("dosage")}
            placeholder="e.g. 500mg"
            data-ocid="confirm-dosage"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            {...register("quantity", { valueAsNumber: true, min: 1 })}
            data-ocid="confirm-quantity"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Additional notes about this medicine..."
          rows={2}
          data-ocid="confirm-notes"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSaving}
          className="flex-1"
          data-ocid="confirm-save-btn"
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" /> Confirm & Save
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          data-ocid="confirm-cancel-btn"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ── Camera Error Banner ───────────────────────────────────────────────────────

interface CameraErrorBannerProps {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}

function CameraErrorBanner({
  message,
  onRetry,
  retryLabel = "Grant Camera Permission",
}: CameraErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-foreground">{message}</p>
        <p className="text-muted-foreground text-xs mt-1">
          Make sure your browser allows camera access for this site, then click
          retry below.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="mt-2 gap-1.5 text-xs h-7 border-destructive/40 text-destructive hover:bg-destructive/10"
          data-ocid="camera-retry-btn"
        >
          <RefreshCw className="h-3 w-3" /> {retryLabel}
        </Button>
      </div>
    </div>
  );
}

// ── Barcode Scanner ───────────────────────────────────────────────────────────

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  active: boolean;
}

function BarcodeScanner({ onDetected, active }: BarcodeScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scanError, setScanError] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const quaggaRef = useRef<boolean>(false);

  // Use the platform camera extension for proper permission handling
  const {
    isActive: camIsActive,
    isLoading: camIsLoading,
    error: camError,
    startCamera,
    stopCamera: stopCamHook,
    videoRef: camVideoRef,
    canvasRef: camCanvasRef,
    retry: retryCamera,
  } = useCamera({ facingMode: "environment", width: 640, height: 360 });

  const stopQuagga = useCallback(async () => {
    if (!quaggaRef.current) return;
    try {
      const { default: Quagga } = await import("quagga");
      Quagga.offDetected();
      Quagga.stop();
      quaggaRef.current = false;
      setScanning(false);
    } catch (_) {
      // ignore cleanup errors
    }
  }, []);

  const startQuagga = useCallback(async () => {
    if (!containerRef.current || quaggaRef.current) return;
    setScanError("");

    // Get the media stream from the video element managed by useCamera
    const videoEl = camVideoRef.current;
    const stream =
      videoEl && videoEl.srcObject instanceof MediaStream
        ? videoEl.srcObject
        : null;

    if (!stream) {
      setScanError("Camera stream not available. Please grant camera access.");
      return;
    }

    try {
      const { default: Quagga } = await import("quagga");
      await new Promise<void>((resolve, reject) => {
        Quagga.init(
          {
            inputStream: {
              type: "LiveStream",
              target: containerRef.current!,
              // Pass the existing stream so Quagga doesn't request camera again
              stream,
            },
            decoder: {
              readers: [
                "ean_reader",
                "ean_8_reader",
                "code_128_reader",
                "code_39_reader",
                "upc_reader",
                "upc_e_reader",
              ],
            },
            locate: true,
          },
          (err: Error | null) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          },
        );
      });
      Quagga.start();
      quaggaRef.current = true;
      setScanning(true);
      Quagga.onDetected((result: { codeResult?: { code?: string } }) => {
        const code = result?.codeResult?.code;
        if (code) {
          onDetected(code);
          stopQuagga();
        }
      });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Failed to start barcode scanner";
      setScanError(msg);
    }
  }, [onDetected, stopQuagga, camVideoRef]);

  // When active, start the extension camera first, then Quagga
  useEffect(() => {
    if (active) {
      startCamera().then((ok) => {
        if (ok) startQuagga();
      });
    } else {
      stopQuagga().then(() => stopCamHook());
      setScanError("");
    }
    return () => {
      stopQuagga();
    };
  }, [active, startCamera, stopCamHook, startQuagga, stopQuagga]);

  // When camera becomes active, kick off Quagga if it hasn't started yet
  useEffect(() => {
    if (camIsActive && active && !quaggaRef.current) {
      startQuagga();
    }
  }, [camIsActive, active, startQuagga]);

  const handleRetry = useCallback(async () => {
    setScanError("");
    const ok = await retryCamera();
    if (ok) startQuagga();
  }, [retryCamera, startQuagga]);

  const displayError = camError?.message ?? (scanError || "");
  const isPermissionError = camError?.type === "permission";

  return (
    <div className="space-y-3" data-ocid="barcode-scanner">
      {/* Hidden video/canvas managed by useCamera for the stream */}
      <video ref={camVideoRef} className="hidden" playsInline muted />
      <canvas ref={camCanvasRef} className="hidden" />

      {/* Quagga renders its own video into containerRef */}
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden border border-border bg-muted/20 min-h-[220px] flex items-center justify-center"
      >
        {!scanning && !displayError && !camIsLoading && (
          <div className="text-center text-muted-foreground p-6">
            <Barcode className="h-12 w-12 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Camera preview will appear here</p>
          </div>
        )}
        {camIsLoading && !scanning && (
          <div className="text-center text-muted-foreground p-6">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin opacity-60" />
            <p className="text-sm">Starting camera…</p>
          </div>
        )}
        {scanning && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="mx-8 h-0.5 bg-primary/80 shadow-[0_0_8px_oklch(var(--primary)/0.8)] animate-pulse" />
          </div>
        )}
      </div>

      {displayError && (
        <CameraErrorBanner
          message={
            isPermissionError
              ? "Camera access was denied. Please allow camera permissions in your browser settings."
              : displayError
          }
          onRetry={handleRetry}
          retryLabel={isPermissionError ? "Grant Camera Permission" : "Retry"}
        />
      )}

      {scanning && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <ScanLine className="h-4 w-4 animate-pulse" />
          <span>Scanning for barcodes…</span>
        </div>
      )}
    </div>
  );
}

// ── Main Scanner Page ─────────────────────────────────────────────────────────

export default function ScannerPage() {
  const lang = useLangStore((s) => s.language);
  const tr = useTranslations(lang);
  const addMedicine = useAddMedicine();

  // OCR state
  const [scanTab, setScanTab] = useState<ScanTab>("ocr");
  const [ocrSource, setOcrSource] = useState<OcrSource>("upload");
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const [ocrError, setOcrError] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [extracted, setExtracted] = useState<Partial<ExtractedData>>({});

  // Barcode prefill state
  const [barcodeValue, setBarcodeValue] = useState("");
  const [barcodeActive, setBarcodeActive] = useState(false);

  // ── Camera (OCR mode) via extension ────────────────────────────────────────

  const {
    isActive: camActive,
    isLoading: camLoading,
    error: camHookError,
    startCamera,
    stopCamera,
    videoRef,
    canvasRef,
    retry: retryOcrCamera,
  } = useCamera({ facingMode: "environment" });

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL("image/jpeg", 0.9);
    setImageDataUrl(dataUrl);
    stopCamera();
  }, [videoRef, canvasRef, stopCamera]);

  // Stop OCR camera when switching tabs or source
  useEffect(() => {
    if (scanTab === "barcode") {
      stopCamera();
      setBarcodeActive(true);
    } else {
      setBarcodeActive(false);
    }
  }, [scanTab, stopCamera]);

  useEffect(() => {
    if (ocrSource !== "camera" && camActive) stopCamera();
  }, [ocrSource, camActive, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // ── File upload ─────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, etc.)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") setImageDataUrl(result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── OCR processing ──────────────────────────────────────────────────────────

  const runOcr = useCallback(async () => {
    if (!imageDataUrl) return;
    setOcrError("");
    setOcrProgress({ status: "Initializing OCR engine…", progress: 0 });
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          setOcrProgress({ status: m.status, progress: m.progress ?? 0 });
        },
      });
      const { data } = await worker.recognize(imageDataUrl);
      await worker.terminate();
      setOcrProgress(null);
      const fields = extractFromOcrText(data.text);
      setExtracted(fields);
      setShowConfirm(true);
    } catch (e) {
      setOcrProgress(null);
      setOcrError(
        e instanceof Error ? e.message : "OCR failed. Please try manual entry.",
      );
    }
  }, [imageDataUrl]);

  const openManualEntry = () => {
    setExtracted({});
    setShowConfirm(true);
  };

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async (data: ExtractedData) => {
    const req: AddMedicineRequest = {
      name: data.name,
      expiryDate: data.expiryDate,
      batchNumber: data.batchNumber,
      manufacturer: data.manufacturer,
      dosage: data.dosage,
      quantity: data.quantity,
      notes: data.notes,
    };
    try {
      await addMedicine.mutateAsync(req);
      toast.success(`${data.name} saved successfully!`);
      setShowConfirm(false);
      setImageDataUrl("");
      setExtracted({});
      setBarcodeValue("");
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Failed to save medicine. Please retry.",
      );
    }
  };

  const handleBarcodeDetected = (code: string) => {
    setBarcodeValue(code);
    toast.success(`Barcode detected: ${code}`);
    setBarcodeActive(false);
  };

  const camError = camHookError?.message ?? "";
  const isPermissionDenied = camHookError?.type === "permission";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="p-4 md:p-6 max-w-2xl mx-auto space-y-6"
      data-ocid="scanner-page"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{tr("scanner")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Scan a medicine label with OCR or barcode to auto-fill medicine
          details.
        </p>
      </div>

      {/* Mode tabs */}
      <Tabs
        value={scanTab}
        onValueChange={(v) => setScanTab(v as ScanTab)}
        data-ocid="scanner-tabs"
      >
        <TabsList className="w-full grid grid-cols-2 bg-muted/50">
          <TabsTrigger value="ocr" className="gap-2" data-ocid="tab-ocr">
            <Camera className="h-4 w-4" />
            OCR Scanner
          </TabsTrigger>
          <TabsTrigger
            value="barcode"
            className="gap-2"
            data-ocid="tab-barcode"
          >
            <Barcode className="h-4 w-4" />
            Barcode Scanner
          </TabsTrigger>
        </TabsList>

        {/* ── OCR Tab ────────────────────────────────────────────────────────── */}
        <TabsContent value="ocr" className="space-y-4 mt-4">
          {/* Source selector */}
          <div className="flex gap-2" data-ocid="ocr-source-toggle">
            <Button
              size="sm"
              variant={ocrSource === "upload" ? "default" : "outline"}
              onClick={() => {
                setOcrSource("upload");
                stopCamera();
              }}
              className="gap-1.5"
              data-ocid="btn-upload-mode"
            >
              <Upload className="h-4 w-4" />
              {tr("uploadImage")}
            </Button>
            <Button
              size="sm"
              variant={ocrSource === "camera" ? "default" : "outline"}
              onClick={() => setOcrSource("camera")}
              className="gap-1.5"
              data-ocid="btn-camera-mode"
            >
              <Camera className="h-4 w-4" />
              {tr("useCamera")}
            </Button>
          </div>

          {/* Upload source */}
          {ocrSource === "upload" && (
            <div className="space-y-3">
              {!imageDataUrl ? (
                <label
                  htmlFor="file-input"
                  className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/30 cursor-pointer transition-smooth p-10"
                  data-ocid="upload-dropzone"
                >
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Click to upload image
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, HEIC up to 20MB
                    </p>
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <ImagePreview
                  src={imageDataUrl}
                  onClear={() => setImageDataUrl("")}
                />
              )}
            </div>
          )}

          {/* Camera source */}
          {ocrSource === "camera" && (
            <div className="space-y-3">
              {!imageDataUrl && (
                <div className="space-y-3">
                  <div
                    className="relative rounded-xl overflow-hidden border border-border bg-muted/20 min-h-[220px] flex items-center justify-center"
                    data-ocid="camera-preview"
                  >
                    {!camActive && !camLoading && !camError && (
                      <div className="text-center text-muted-foreground p-6">
                        <Camera className="h-12 w-12 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Camera not started</p>
                      </div>
                    )}
                    {camLoading && !camActive && (
                      <div className="text-center text-muted-foreground p-6">
                        <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin opacity-60" />
                        <p className="text-sm">Starting camera…</p>
                      </div>
                    )}
                    <video
                      ref={videoRef}
                      className={`w-full h-full object-cover ${camActive ? "" : "hidden"}`}
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  {camError && (
                    <CameraErrorBanner
                      message={
                        isPermissionDenied
                          ? "Camera access was denied. Please allow camera permissions in your browser settings and try again."
                          : camError
                      }
                      onRetry={retryOcrCamera}
                      retryLabel={
                        isPermissionDenied
                          ? "Grant Camera Permission"
                          : "Retry Camera"
                      }
                    />
                  )}

                  <div className="flex gap-2">
                    {!camActive ? (
                      <Button
                        onClick={startCamera}
                        disabled={camLoading}
                        className="gap-2 flex-1"
                        data-ocid="start-camera-btn"
                      >
                        {camLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />{" "}
                            Starting…
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4" /> Start Camera
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={captureFrame}
                          className="gap-2 flex-1"
                          data-ocid="capture-btn"
                        >
                          <ScanLine className="h-4 w-4" /> Capture Frame
                        </Button>
                        <Button
                          variant="outline"
                          onClick={stopCamera}
                          data-ocid="stop-camera-btn"
                        >
                          Stop
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
              {imageDataUrl && (
                <ImagePreview
                  src={imageDataUrl}
                  onClear={() => setImageDataUrl("")}
                />
              )}
            </div>
          )}

          {/* OCR progress */}
          {ocrProgress && <OcrProgressBar progress={ocrProgress} />}

          {/* OCR error */}
          {ocrError && (
            <div
              className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm"
              data-ocid="ocr-error"
            >
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-foreground">{ocrError}</p>
                <button
                  type="button"
                  onClick={openManualEntry}
                  className="text-primary text-xs underline mt-1 hover:no-underline"
                  data-ocid="fallback-manual-btn"
                >
                  Enter details manually →
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={runOcr}
              disabled={!imageDataUrl || !!ocrProgress}
              className="flex-1 gap-2"
              data-ocid="run-ocr-btn"
            >
              {ocrProgress ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <ScanLine className="h-4 w-4" /> Extract with OCR
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={openManualEntry}
              className="gap-2"
              data-ocid="manual-entry-btn"
            >
              Manual Entry
            </Button>
          </div>
        </TabsContent>

        {/* ── Barcode Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="barcode" className="space-y-4 mt-4">
          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm">
                Live Barcode Detection
              </h3>
              {barcodeValue && (
                <Badge
                  variant="secondary"
                  className="font-mono text-xs"
                  data-ocid="barcode-result-badge"
                >
                  {barcodeValue}
                </Badge>
              )}
            </div>

            <BarcodeScanner
              active={barcodeActive && scanTab === "barcode"}
              onDetected={handleBarcodeDetected}
            />

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={barcodeActive ? "outline" : "default"}
                onClick={() => setBarcodeActive((v) => !v)}
                className="gap-2"
                data-ocid="toggle-barcode-btn"
              >
                {barcodeActive ? (
                  <>
                    <X className="h-4 w-4" /> Stop Scanner
                  </>
                ) : (
                  <>
                    <Barcode className="h-4 w-4" /> Start Scanner
                  </>
                )}
              </Button>
              {barcodeValue && (
                <Button
                  size="sm"
                  onClick={() => {
                    setExtracted({ name: barcodeValue });
                    setShowConfirm(true);
                  }}
                  className="gap-2 flex-1"
                  data-ocid="barcode-fill-btn"
                >
                  <CheckCircle className="h-4 w-4" /> Use This Code
                </Button>
              )}
            </div>
          </div>

          {/* Fallback manual */}
          <div className="text-center pt-1">
            <p className="text-xs text-muted-foreground">
              Barcode not recognized?
            </p>
            <button
              type="button"
              onClick={openManualEntry}
              className="text-primary text-xs underline mt-1 hover:no-underline"
              data-ocid="barcode-manual-fallback"
            >
              Enter details manually →
            </button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirmation Modal */}
      <Dialog
        open={showConfirm}
        onOpenChange={(open) => !addMedicine.isPending && setShowConfirm(open)}
      >
        <DialogContent
          className="max-w-xl max-h-[90vh] overflow-y-auto"
          data-ocid="confirm-dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              {tr("extractedData")} — Confirm &amp; Save
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">
            Review and edit the extracted details below before saving to your
            medicine inventory.
          </p>
          <ConfirmForm
            initial={extracted}
            onSave={handleSave}
            onCancel={() => setShowConfirm(false)}
            isSaving={addMedicine.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
