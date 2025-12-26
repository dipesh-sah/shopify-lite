"use client";

import React from "react";
import Loading from "@/components/ui/Loading";

export default function LoadingDemoPage() {
  return (
    <div className="p-8 space-y-12 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Modern Loading Animation</h1>
        <p className="text-muted-foreground mt-2">Featuring LottieFiles for a rich, tech-focused experience.</p>
      </header>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Size Variations</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 items-center justify-items-center border rounded-2xl p-8 bg-card/50">
          <div className="text-center space-y-2">
            <Loading variant="inline" size="sm" text="Small" />
          </div>
          <div className="text-center space-y-2">
            <Loading variant="centered" size="md" text="Medium" />
          </div>
          <div className="text-center space-y-2">
            <Loading variant="centered" size="lg" text="Large" />
          </div>
          <div className="text-center space-y-2">
            <Loading variant="centered" size="xl" text="Extra Large" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Centered Overlay (Container)</h2>
        <div className="relative h-96 border border-dashed border-muted-foreground/20 rounded-2xl overflow-hidden bg-muted/5">
          <Loading variant="centered" text="Configuring secure environment..." />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Inline Usage (Buttons/Badges)</h2>
        <div className="flex gap-4">
          <button disabled className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground flex items-center gap-3 font-medium opacity-80">
            <Loading variant="inline" size="sm" />
            Processing
          </button>
          <div className="px-4 py-2 border rounded-full flex items-center gap-2 text-sm text-muted-foreground">
            <Loading variant="inline" size="sm" />
            Syncing data
          </div>
        </div>
      </section>
    </div>
  );
}
