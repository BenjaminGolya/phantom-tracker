"use client";

import { useState } from "react";
import { Share2, Download, X, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/context";

export function ShareProgress({
  streak,
  completions,
  rate,
  level,
}: {
  streak: number;
  completions: number;
  rate: number;
  level: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const url = `/api/share?streak=${streak}&completions=${completions}&rate=${rate}&level=${encodeURIComponent(level)}`;

  async function getBlob() {
    const res = await fetch(url);
    return res.blob();
  }

  async function download() {
    setBusy(true);
    try {
      const blob = await getBlob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "phantom-tracker-progress.png";
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setBusy(false);
    }
  }

  async function nativeShare() {
    setBusy(true);
    try {
      const blob = await getBlob();
      const file = new File([blob], "phantom-tracker-progress.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My habit progress", text: "Build habits that actually stick — phantomtracker.io" });
      } else {
        await download();
      }
    } catch {
      /* user cancelled share */
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-surface border border-border hover:border-primary/40 text-sm font-medium rounded-xl transition-colors"
      >
        <Share2 size={15} className="text-primary" /> {t("share.button")}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" />
          <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-5 z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{t("share.title")}</h3>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-white transition-colors"><X size={16} /></button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Progress card" className="w-full rounded-xl border border-border" />
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={nativeShare}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary hover:bg-primary-dim text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-60"
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />} {t("share.share")}
              </button>
              <button
                onClick={download}
                disabled={busy}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 border border-border text-sm font-medium text-muted hover:text-white hover:border-primary/40 rounded-lg transition-colors disabled:opacity-60"
              >
                <Download size={15} /> {t("share.download")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
