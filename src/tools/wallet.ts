import { z } from "zod";
import { widget, text, object, error } from "mcp-use/server";
import type { MCPServer } from "mcp-use/server";
import prisma from "../utils/prisma.js";
import { clampLimit } from "../utils/validators.js";
import { shortenAddress, formatNumber, pluralize } from "../utils/formatters.js";

export function registerWalletTools(server: MCPServer) {
  // Tool: check-wallet — check if wallet exists and get summary
  server.tool(
    {
      name: "check-wallet",
      description:
        "Check if a wallet address exists in the system and get a quick summary of its activity.",
      schema: z.object({
        walletAddress: z.string().describe("Wallet address to check (0x...)"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ walletAddress }) => {
      try {
        const [balance, badgeCount, lastEvent] = await Promise.all([
          prisma.pointsBalance.findUnique({ where: { walletAddress } }),
          prisma.badgeOwnership.count({ where: { walletAddress } }),
          prisma.event.findFirst({
            where: { walletAddress },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true, eventType: true },
          }),
        ]);

        const exists = !!(balance || badgeCount > 0 || lastEvent);

        return object({
          walletAddress,
          exists,
          pointsBalance: balance?.balance ?? 0,
          badgeCount,
          lastActivity: lastEvent
            ? {
                date: lastEvent.createdAt.toISOString(),
                eventType: lastEvent.eventType,
              }
            : null,
        });
      } catch (err) {
        console.error("check-wallet error:", err);
        return error(`Failed to check wallet: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  );

  // Tool: get-wallet-activity — recent activity timeline for a wallet
  server.tool(
    {
      name: "get-wallet-activity",
      description:
        "Get the recent activity timeline for a wallet address, including events and transactions.",
      schema: z.object({
        walletAddress: z.string().describe("Wallet address (0x...)"),
        limit: z.number().optional().describe("Max activities to return (default: 20)"),
      }),
      annotations: { readOnlyHint: true },
      widget: {
        name: "wallet-overview",
        invoking: "Loading wallet activity...",
        invoked: "Activity loaded",
      },
    },
    async ({ walletAddress, limit }) => {
      try {
        const take = clampLimit(limit, 20, 100);

        const [events, transactions, balance, badges] = await Promise.all([
          prisma.event.findMany({
            where: { walletAddress },
            take,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              eventType: true,
              metadata: true,
              createdAt: true,
            },
          }),
          prisma.pointsTransaction.findMany({
            where: { walletAddress },
            take: 10,
            orderBy: { createdAt: "desc" },
          }),
          prisma.pointsBalance.findUnique({ where: { walletAddress } }),
          prisma.badgeOwnership.findMany({
            where: { walletAddress },
            include: { badge: true },
            orderBy: { awardedAt: "desc" },
          }),
        ]);

        return widget({
          props: {
            walletAddress,
            points: {
              balance: balance?.balance ?? 0,
              totalEarned: balance?.totalEarned ?? 0,
              totalSpent: balance?.totalSpent ?? 0,
            },
            badges: badges.map((bo) => ({
              id: bo.badge.id,
              name: bo.badge.name,
              tier: bo.badge.tier,
              imageUrl: bo.badge.imageUrl,
              awardedAt: bo.awardedAt.toISOString(),
            })),
            events: events.map((e) => ({
              id: e.id,
              eventType: e.eventType,
              metadata: e.metadata as Record<string, unknown>,
              createdAt: e.createdAt.toISOString(),
            })),
            transactions: transactions.map((tx) => ({
              id: tx.id,
              amount: tx.amount,
              type: tx.type,
              description: tx.description,
              balanceAfter: tx.balanceAfter,
              createdAt: tx.createdAt.toISOString(),
            })),
          },
          output: text(
            `${shortenAddress(walletAddress)}: ${formatNumber(balance?.balance ?? 0)} points, ${badges.length} ${pluralize(badges.length, "badge")}, ${events.length} recent events`
          ),
        });
      } catch (err) {
        console.error("get-wallet-activity error:", err);
        return error(`Failed to get wallet activity: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  );

  // Tool: wallet-summary — comprehensive wallet overview
  server.tool(
    {
      name: "wallet-summary",
      description:
        "Get a comprehensive overview of a wallet including points, badges, referrals, and recent events.",
      schema: z.object({
        walletAddress: z.string().describe("Wallet address for full summary (0x...)"),
      }),
      annotations: { readOnlyHint: true },
      widget: {
        name: "wallet-overview",
        invoking: "Building wallet summary...",
        invoked: "Summary ready",
      },
    },
    async ({ walletAddress }) => {
      try {
        const [balance, badges, events, referrals, referralCodes] = await Promise.all([
          prisma.pointsBalance.findUnique({ where: { walletAddress } }),
          prisma.badgeOwnership.findMany({
            where: { walletAddress },
            include: { badge: true },
          }),
          prisma.event.findMany({
            where: { walletAddress },
            take: 10,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              eventType: true,
              metadata: true,
              createdAt: true,
            },
          }),
          prisma.referral.findMany({
            where: { referrerWallet: walletAddress },
            take: 5,
            orderBy: { createdAt: "desc" },
          }),
          prisma.referralCode.findMany({
            where: { referrerWallet: walletAddress },
          }),
        ]);

        const transactions = await prisma.pointsTransaction.findMany({
          where: { walletAddress },
          take: 10,
          orderBy: { createdAt: "desc" },
        });

        return widget({
          props: {
            walletAddress,
            points: {
              balance: balance?.balance ?? 0,
              totalEarned: balance?.totalEarned ?? 0,
              totalSpent: balance?.totalSpent ?? 0,
            },
            badges: badges.map((bo) => ({
              id: bo.badge.id,
              name: bo.badge.name,
              tier: bo.badge.tier,
              imageUrl: bo.badge.imageUrl,
              awardedAt: bo.awardedAt.toISOString(),
            })),
            events: events.map((e) => ({
              id: e.id,
              eventType: e.eventType,
              metadata: e.metadata as Record<string, unknown>,
              createdAt: e.createdAt.toISOString(),
            })),
            transactions: transactions.map((tx) => ({
              id: tx.id,
              amount: tx.amount,
              type: tx.type,
              description: tx.description,
              balanceAfter: tx.balanceAfter,
              createdAt: tx.createdAt.toISOString(),
            })),
            referralSummary: {
              totalCodes: referralCodes.length,
              totalReferrals: referrals.length,
              completedReferrals: referrals.filter((r) => r.status === "COMPLETED").length,
            },
          },
          output: text(
            `Full summary for ${shortenAddress(walletAddress)}:\n• ${formatNumber(balance?.balance ?? 0)} points (${formatNumber(balance?.totalEarned ?? 0)} earned, ${formatNumber(balance?.totalSpent ?? 0)} spent)\n• ${badges.length} ${pluralize(badges.length, "badge")}\n• ${events.length} recent events\n• ${referrals.length} ${pluralize(referrals.length, "referral")} (${referrals.filter((r) => r.status === "COMPLETED").length} completed)`
          ),
        });
      } catch (err) {
        console.error("wallet-summary error:", err);
        return error(`Failed to get wallet summary: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  );
}
