"use client";

import React from "react";
import { AppSidebar } from "@/components/black-swan/app-sidebar";
import { PricingModal } from "@/components/black-swan/pricing-modal";
import { usePricingModal } from "@/contexts/pricing-modal";

interface LayoutContentProps {
  children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
  const { isPricingModalOpen, closePricingModal } = usePricingModal();

  return (
    <div className="flex min-h-screen w-full bg-black">
      <AppSidebar />
      <div className="flex-1">{children}</div>
      <PricingModal isOpen={isPricingModalOpen} onClose={closePricingModal} />
    </div>
  );
}
