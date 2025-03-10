import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isNumeric(value: any): boolean {
  if (value === null || value === undefined || value === "") {
    return false
  }

  // Convert to string if it's not already
  const str = String(value).trim()

  // Check if it's a valid number
  return !isNaN(Number(str)) && !isNaN(Number.parseFloat(str))
}

