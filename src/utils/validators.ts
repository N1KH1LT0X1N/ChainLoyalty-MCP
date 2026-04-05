/**
 * Input validation utilities for ChainLoyalty MCP tools
 */

/** Validate Ethereum wallet address format */
export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/** Clamp a limit value between 1 and max (default 500) */
export function clampLimit(limit: number | undefined, defaultVal = 50, max = 500): number {
  if (limit === undefined) return defaultVal;
  return Math.max(1, Math.min(limit, max));
}

/** Parse an ISO date string or return undefined */
export function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return undefined;
  return d;
}

/** Build a Prisma date filter from start/end date strings */
export function buildDateFilter(
  startDate?: string,
  endDate?: string
): Record<string, Date> | undefined {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start && !end) return undefined;

  const filter: Record<string, Date> = {};
  if (start) filter.gte = start;
  if (end) filter.lte = end;

  return filter;
}
