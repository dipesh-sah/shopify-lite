"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div className="bg-[#111827] text-white text-[13px] py-2.5 border-b border-white/5">
      <div className="container flex justify-center items-center">
        <Link
          href="/wholesaler"
          className="flex items-center gap-2 hover:text-white/80 transition-all group font-medium tracking-wide"
        >
          <span>Login as a WHOLESALER for Volume Pricing and Discounted Rates</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
