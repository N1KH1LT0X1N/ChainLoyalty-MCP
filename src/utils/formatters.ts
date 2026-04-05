/**
 * Output formatting utilities for ChainLoyalty MCP tools
 */

/** Format a Date to a readable string */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format a wallet address: 0x1234...5678 */
export function shortenAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Format a number with commas: 1,234,567 */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/** Pluralize a word based on count */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/** Safely stringify JSON metadata for display */
export function formatMetadata(meta: unknown): string {
  if (!meta || (typeof meta === "object" && Object.keys(meta as object).length === 0)) {
    return "—";
  }
  try {
    return JSON.stringify(meta, null, 2);
  } catch {
    return String(meta);
  }
}

/** Format a rule type for display */
export function formatRuleType(type: string): string {
  const labels: Record<string, string> = {
    THRESHOLD: "Threshold",
    FREQUENCY: "Frequency (Streak)",
    CONDITIONAL: "Conditional",
  };
  return labels[type] ?? type;
}

/** Format a reward type for display */
export function formatRewardType(type: string): string {
  const labels: Record<string, string> = {
    POINTS: "Points",
    BADGE: "Badge",
    PROBABILISTIC: "Probabilistic (Lootbox)",
  };
  return labels[type] ?? type;
}

/** Format a transaction type for display */
export function formatTransactionType(type: string): string {
  const labels: Record<string, string> = {
    EARNED: "Earned",
    SPENT: "Spent",
    REFERRAL: "Referral Bonus",
    BONUS: "Bonus",
    ADJUSTMENT: "Adjustment",
  };
  return labels[type] ?? type;
}

/** Format a referral status for display */
export function formatReferralStatus(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    COMPLETED: "Completed",
    EXPIRED: "Expired",
  };
  return labels[status] ?? status;
}
