"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";

interface PricingModalContextType {
  isPricingModalOpen: boolean;
  openPricingModal: () => void;
  closePricingModal: () => void;
}

const PricingModalContext = createContext<PricingModalContextType | undefined>(
  undefined
);

export function usePricingModal() {
  const context = useContext(PricingModalContext);
  if (context === undefined) {
    throw new Error(
      "usePricingModal must be used within a PricingModalProvider"
    );
  }
  return context;
}

interface PricingModalProviderProps {
  children: React.ReactNode;
}

export function PricingModalProvider({ children }: PricingModalProviderProps) {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const openPricingModal = useCallback(() => {
    setIsPricingModalOpen(true);
  }, []);

  const closePricingModal = useCallback(() => {
    setIsPricingModalOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isPricingModalOpen,
      openPricingModal,
      closePricingModal,
    }),
    [isPricingModalOpen, openPricingModal, closePricingModal]
  );

  return (
    <PricingModalContext.Provider value={value}>
      {children}
    </PricingModalContext.Provider>
  );
}
