"use client";

import React from "react";

export function WelcomeSection() {
  return (
    <section className="w-full bg-white">
      {/* Main Content */}
      <div className="py-12 md:py-16 border-t border-gray-100">
        <div className="container px-4 md:px-8 max-w-5xl">
          <div className="space-y-6 text-[#444] leading-[1.8] text-[15px] md:text-base">
            <p>
              Welcome to <span className="font-semibold text-[#111]">Alkaline Peptides</span> — your trusted source for premium amino acid blends and research peptide solutions.
            </p>

            <p>
              We provide <span className="font-semibold text-[#111]">high-quality, rigorously tested products</span> designed to support innovation in health, recovery, and performance science. Our focus is on <span className="font-semibold text-[#111]">purity, reliability, and transparency</span>, so you can feel confident in every order.
            </p>

            <p className="font-bold text-[#111] text-[16px] md:text-[17px] pt-2">
              Order today and experience the confidence of research-grade quality delivered to your door.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
