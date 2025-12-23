"use client";

import { MapPin, Headset, HelpCircle } from "lucide-react";
import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="bg-[#f5f5f5] text-[#555] text-[11px] py-1.5 border-b">
      <div className="container flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-medium">Kostenloser Versand ab 75 € innerh. DE</span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <Link href="#" className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <MapPin className="h-3 w-3" />
            <span>Zu den Filialen</span>
          </Link>
          <Link href="#" className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <Headset className="h-3 w-3" />
            <span>Service</span>
          </Link>
          <Link href="#" className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <HelpCircle className="h-3 w-3" />
            <span>Hilfe</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
