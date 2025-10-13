"use client";

import React, {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  ClipboardEvent,
} from "react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function PinInput({
  value,
  onChange,
  length = 8,
  disabled = false,
  error = false,
  className,
}: PinInputProps) {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Focus first empty input on mount
  useEffect(() => {
    if (!disabled && value.length === 0) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [disabled]);

  const handleInputChange = (index: number, newValue: string) => {
    if (disabled) return;

    // Only allow alphanumeric characters and convert to uppercase
    const sanitizedValue = newValue.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    if (sanitizedValue.length > 1) {
      // Handle paste or multiple characters
      handlePaste(sanitizedValue, index);
      return;
    }

    // Update the value at the specific index
    const newPin = value.split("");
    newPin[index] = sanitizedValue;

    // Pad with empty strings to maintain length
    while (newPin.length < length) {
      newPin.push("");
    }

    const updatedValue = newPin.join("").slice(0, length);
    onChange(updatedValue);

    // Move to next input if character was entered
    if (sanitizedValue && index < length - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      e.preventDefault();

      const currentPin = value.split("");

      if (currentPin[index]) {
        // Clear current field
        currentPin[index] = "";
      } else if (index > 0) {
        // Move to previous field and clear it
        currentPin[index - 1] = "";
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 10);
      }

      const updatedValue = currentPin
        .join("")
        .padEnd(length, "")
        .slice(0, length);
      onChange(updatedValue.replace(/\s+$/, "")); // Remove trailing spaces
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (pastedText: string, startIndex: number = 0) => {
    if (disabled) return;

    const sanitized = pastedText.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const currentPin = value.split("");

    // Fill from the current index
    for (let i = 0; i < sanitized.length && startIndex + i < length; i++) {
      currentPin[startIndex + i] = sanitized[i];
    }

    // Pad with empty strings
    while (currentPin.length < length) {
      currentPin.push("");
    }

    const updatedValue = currentPin.join("").slice(0, length);
    onChange(updatedValue);

    // Focus the next empty input or the last filled input
    const nextEmptyIndex = Math.min(startIndex + sanitized.length, length - 1);
    setTimeout(() => {
      inputRefs.current[nextEmptyIndex]?.focus();
    }, 10);
  };

  const handleInputPaste = (
    index: number,
    e: ClipboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    handlePaste(pastedText, index);
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(-1);
  };

  const pins = value.split("");
  while (pins.length < length) {
    pins.push("");
  }

  return (
    <div
      className={cn(
        "flex gap-1.5 sm:gap-2 md:gap-3 justify-center flex-wrap",
        className
      )}
    >
      {pins.slice(0, length).map((pin, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          maxLength={1}
          value={pin}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handleInputPaste(index, e)}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            // Base styles - mobile first approach
            "w-10 h-10 text-center text-lg font-mono font-semibold rounded-lg border-2 transition-all duration-200",
            // Small screens and up
            "sm:w-12 sm:h-12 sm:text-xl sm:rounded-xl",
            // Medium screens and up
            "md:w-14 md:h-14 md:text-2xl",
            // Large screens and up
            "lg:w-16 lg:h-16",
            // Background and text
            "bg-zinc-800 text-white placeholder:text-zinc-500",
            // Border states
            "border-zinc-700",
            focusedIndex === index &&
              "border-white ring-1 sm:ring-2 ring-white/20",
            error && "border-red-500",
            // Hover states
            !disabled && "hover:border-zinc-600",
            // Disabled states
            disabled && "opacity-50 cursor-not-allowed",
            // Focus styles
            "focus:outline-none focus:border-white focus:ring-1 sm:focus:ring-2 focus:ring-white/20"
          )}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
        />
      ))}
    </div>
  );
}
