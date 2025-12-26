"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "fullscreen" | "centered" | "inline";
  text?: string;
}

const Loading = ({
  className,
  size = "md",
  variant = "fullscreen",
  text,
}: LoadingProps) => {
  const sizeMap = {
    sm: 20,
    md: 80,
    lg: 160,
    xl: 240,
  };

  const containerClasses = {
    fullscreen: "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md",
    centered: "flex flex-col items-center justify-center min-h-[200px] w-full",
    inline: "inline-flex items-center gap-2",
  };

  return (
    <div className={cn(containerClasses[variant], className)} role="status" aria-label="Loading">
      <div className="relative flex items-center justify-center">
        <DotLottieReact
          src="/lottiefiles.json"
          autoplay
          loop
          style={{ width: sizeMap[size], height: sizeMap[size] }}
          className="transition-opacity duration-300"
        />

        {/* Subtle Glow Effect behind Lottie */}
        <div
          className="absolute inset-0 m-auto bg-primary/20 rounded-full blur-2xl animate-pulse -z-10"
          style={{ width: sizeMap[size] * 0.6, height: sizeMap[size] * 0.6 }}
        />
      </div>

      {text && (
        <p className={cn(
          "mt-4 text-sm font-medium tracking-tight text-muted-foreground animate-pulse",
          size === "sm" && "mt-0 ml-1 text-xs"
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

export default Loading;
