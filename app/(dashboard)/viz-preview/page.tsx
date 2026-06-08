"use client";

// Temporary chooser: shows the four candidate profile visualizations so we can
// pick a direction. Visit /viz-preview while signed in.

import { VIZ_OPTIONS } from "@/components/profile/viz-previews";

export default function VizPreviewPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-24">
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold">Profile visualization — pick a style</h1>
        <p className="text-sm text-muted mt-1">
          Four live mini-previews of how your “type of person” could look. Tell me which number you like and I’ll build it out in full 3D.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {VIZ_OPTIONS.map(({ id, n, title, desc, Comp }) => (
          <div key={id} className="bg-surface border border-border rounded-2xl p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{n}</span>
              <h2 className="text-sm font-semibold">{title}</h2>
            </div>
            <div className="h-48 rounded-xl bg-background/60 border border-border/60 overflow-hidden">
              <Comp />
            </div>
            <p className="text-xs text-muted leading-relaxed mt-3">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
