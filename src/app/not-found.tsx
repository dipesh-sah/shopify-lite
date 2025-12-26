"use client";

import Link from "next/link";
import { MoveLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Lottie Animation Container */}
        <div className="relative w-full aspect-square max-w-[400px] mx-auto">
          <DotLottieReact
            src="/404 error.json"
            autoplay
            loop
            className="w-full h-full"
          />
          {/* Subtle Glow Effect */}
          <div className="absolute inset-0 m-auto bg-primary/10 rounded-full blur-3xl -z-10 w-2/3 h-2/3 animate-pulse" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
            Page Not Found
          </h1>
          <p className="text-muted-foreground text-lg max-w-[300px] mx-auto">
            Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            asChild
            variant="default"
            size="lg"
            className="w-full sm:w-auto gap-2 h-12 px-8 text-base shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <Link href="/">
              <Home className="w-5 h-5" />
              Go Back Home
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto gap-2 h-12 px-8 text-base transition-all hover:bg-accent hover:scale-105 active:scale-95"
          >
            <button onClick={() => window.history.back()}>
              <MoveLeft className="w-5 h-5" />
              Return to Previous
            </button>
          </Button>
        </div>

        <div className="pt-8">
          <p className="text-sm text-muted-foreground/60 italic">
            Error 404 • Shopify Lite
          </p>
        </div>
      </div>
    </div>
  );
}
