import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return "";
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if the date is today
  const today = new Date();
  if (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  ) {
    return "Today";
  }
  
  // Format based on how recent the date is
  const diffTime = Math.abs(today.getTime() - dateObj.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) {
    // For dates within the last week, show the day name
    const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } else if (dateObj.getFullYear() === today.getFullYear()) {
    // For dates in the current year, show month and day
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } else {
    // For older dates, include the year
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + "...";
}

export function getTagColorClasses(color: string): string {
  // Map of color hex to Tailwind class pairs for both light and dark mode
  const colorMap: Record<string, { bg: string, text: string }> = {
    "#10b981": { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400" }, // green
    "#3b82f6": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },    // blue
    "#8b5cf6": { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" }, // purple
    "#f59e0b": { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-600 dark:text-yellow-400" }, // yellow
    "#6366f1": { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400" }, // indigo
    "#ef4444": { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400" },         // red
    // Add more colors as needed
  };
  
  // Default to blue if color not found in map
  const colorClasses = colorMap[color] || { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" };
  
  return `${colorClasses.bg} ${colorClasses.text}`;
}
