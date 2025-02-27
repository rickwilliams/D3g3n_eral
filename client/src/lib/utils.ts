import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";

/**
 * Combines multiple class names, merging Tailwind CSS classes properly
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

dayjs.extend(localizedFormat);

export const moment = dayjs;

export const formatAgentName = (name: string) => {
    return name.substring(0, 2);
};
