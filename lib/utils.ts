// Lightweight class name merge helper to avoid adding new dependencies.
export function cn(...inputs: Array<string | undefined | false | null>) {
  return inputs.filter(Boolean).join(" ");
}
