import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function for conditionally joining classNames
 * Combines clsx and tailwind-merge for optimal class management
 * 
 * @param {...any} inputs - Class names to merge
 * @returns {string} Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
