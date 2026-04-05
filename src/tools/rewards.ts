import { z } from "zod";
import { widget, text, object, error } from "mcp-use/server";
import type { MCPServer } from "mcp-use/server";
import prisma from "../utils/prisma.js";
import { clampLimit } from "../utils/validators.js";
import {
  formatNumber,
  shortenAddress,
  formatTransactionType,
  pluralize,
} from "../utils/formatters.js";

export function registerRewardsTools(server: MCPServer) {
  // Tool: get-rewards — full rewards overview for a wallet
  server.tool(
    {
      name: "get-rewards",
      description:
        "Get a complete rewards overview for a wallet: points balance, badges earned, and recent transactions.",
      schema: z.object({
        walletAddress: z
          .string()
          .describe("Wallet address to look up rewards for (0x...)"),
      }),
      annotations: { readOnlyHint: true },
      widget: {
        name: "rewards-dashboard",
        invoking: "Loading rewards...",
        invoked: "Rewards loaded",
      },
    },
    async ({ walletAddress }) => {
      try {
        const [balance, badges, transactions] = await Promise.all([
          prisma.pointsBalance.findUnique({
            where: { walletAddress },
          }),
          prisma.badgeOwnership.findMany({
            where: { walletAddress },
            include: { badge: true },
            orderBy: { awardedAt: "desc" },
          }),
          prisma.pointsTransaction.findMany({
            where: { walletAddress },
            take: 20,
            orderBy: { createdAt: "desc" },
          }),
        ]);

        const serialized = {
          points: {
            balance: balance?.balance ?? 0,
            totalEarned: balance?.totalEarned ?? 0,
            totalSpent: balance?.totalSpent ?? 0,
          },
          badges: badges.map((bo) => ({
            id: bo.badge.id,
            name: bo.badge.name,
            description: bo.badge.description,
            imageUrl: bo.badge.imageUrl,
            tier: bo.badge.tier,
            awardedAt: bo.awardedAt.toISOString(),
          })),
          transactions: transactions.map((tx) => ({
            id: tx.id,
            amount: tx.amount,
            type: tx.type,
            description: tx.description,
            balanceAfter: tx.balanceAfter,
            createdAt: tx.createdAt.toISOString(),
          })),
          walletAddress,
        };

        return widget({
          props: serialized,
          output: text(
            `${shortenAddress(walletAddress)}: ${formatNumber(serialized.points.balance)} points, ${serialized.badges.length} ${pluralize(serialized.badges.length, "badge")}, ${serialized.transactions.length} recent transactions`
          ),
        });
      } catch (err) {
        console.error("get-rewards error:", err);
        return error(
          `Failed to get rewards: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }
  );

  // Tool: get-leaderboard — top users by points
  server.tool(
    {
      name: "get-leaderboard",
      description:
        "Get the top users ranked by points balance. Shows a leaderboard of the highest earners.",
      schema: z.object({
        limit: z
          .number()
          .optional()
          .describe("Number of top users to show (default: 10, max: 50)"),
      }),
      annotations: { readOnlyHint: true },
      widget: {
        name: "rewards-dashboard",
        invoking: "Loading leaderboard...",
        invoked: "Leaderboard loaded",
      },
    },
    async ({ limit }) => {
      try {
        const take = clampLimit(limit, 10, 50);

        const topUsers = await prisma.pointsBalance.findMany({
          take,
          orderBy: { balance: "desc" },
        });

        const leaderboard = topUsers.map((u, i) => ({
          rank: i + 1,
          walletAddress: u.walletAddress,
          balance: u.balance,
          totalEarned: u.totalEarned,
        }));

        return widget({
          props: {
            points: { balance: 0, totalEarned: 0, totalSpent: 0 },
            badges: [],
            transactions: [],
            walletAddress: "",
            leaderboard,
          },
          output: text(
            `Top ${leaderboard.length} users by points:\n${leaderboard.map((u) => `#${u.rank} ${shortenAddress(u.walletAddress)}: ${formatNumber(u.balance)} pts`).join("\n")}`
          ),
        });
      } catch (err) {
        console.error("get-leaderboard error:", err);
        return error(
          `Failed to get leaderboard: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }
  );

  // Tool: get-badge-owners — users who own a specific badge
  server.tool(
    {
      name: "get-badge-owners",
      description: "Get all users who own a specific badge by badge ID.",
      schema: z.object({
        badgeId: z.string().describe("Badge ID to look up owners for"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ badgeId }) => {
      try {
        const badge = await prisma.badge.findUnique({
          where: { id: badgeId },
          include: {
            ownerships: {
              select: {
                walletAddress: true,
                awardedAt: true,
              },
              orderBy: { awardedAt: "desc" },
            },
          },
        });

        if (!badge) {
          return error(`Badge not found: ${badgeId}`);
        }

        return object({
          badge: {
            id: badge.id,
            name: badge.name,
            description: badge.description,
            tier: badge.tier,
            imageUrl: badge.imageUrl,
          },
          owners: badge.ownerships.map((o) => ({
            walletAddress: o.walletAddress,
            awardedAt: o.awardedAt.toISOString(),
          })),
          totalOwners: badge.ownerships.length,
        });
      } catch (err) {
        console.error("get-badge-owners error:", err);
        return error(
          `Failed to get badge owners: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }
  );
}
