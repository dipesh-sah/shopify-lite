"use client";

import React from "react";

export function WelcomeSection() {
  return (
    <section className="w-full bg-white">
      {/* Lime Green Top Bar */}
      <div className="bg-[#94c94d] py-3 text-center">
        <div className="container px-4">
          <p className="text-white font-bold text-xs sm:text-sm md:text-base tracking-wide">
            The Future of Healing and Health Starts Here — Backed by Science, Trusted by Researchers.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 md:py-16">
        <div className="container px-4 md:px-8 max-w-5xl">
          <div className="space-y-6 text-[#444] leading-relaxed text-sm md:text-[15px]">
            <p>
              Welcome to <span className="font-bold">Alkaline Peptides</span> — your trusted source for premium amino acid blends and research peptide solutions.
            </p>

            <p>
              We provide <span className="font-bold">high-quality, rigorously tested products</span> designed to support innovation in health, recovery, and performance science. Our focus is on <span className="font-bold">purity, reliability, and transparency</span>, so you can feel confident in every order.
            </p>

            <p className="font-bold text-[#222]">
              Order today and experience the confidence of research-grade quality delivered to your door.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
