"use client";

import Link from "next/link";

export function HeroBanner() {
  return (
    <section className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/uploads/1766469745914_Healing-Performance-banner_1_50396423-0fcc-47bc-a3ec-8e2b16863bca.webp")',
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content Container */}
      <div className="container relative h-full flex flex-col justify-center px-4 md:px-8">
        <div className="max-w-xl animate-in fade-in slide-in-from-left-4 duration-1000">
          <p className="text-white text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-4 drop-shadow-md">
            EXPLORE OUR HIGH-QUALITY PEPTIDE SOLUTIONS
          </p>

          <Link
            href="/shop"
            className="inline-block bg-[#94c94d] hover:bg-[#86b845] text-[#222] font-medium px-8 py-3 rounded-md transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg text-sm md:text-base font-outfit"
          >
            Shop now
          </Link>
        </div>
      </div>

      {/* Bottom accent line (matching the green) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#94c94d]" />
    </section>
  );
}
