import { z } from "zod";
import { widget, text, object, error } from "mcp-use/server";
import type { MCPServer } from "mcp-use/server";
import prisma from "../utils/prisma.js";
import { clampLimit } from "../utils/validators.js";
import { shortenAddress, formatNumber, formatReferralStatus, pluralize } from "../utils/formatters.js";

export function registerReferralTools(server: MCPServer) {
  // Tool: get-referral-stats — referral stats for a wallet
  server.tool(
    {
      name: "get-referral-stats",
      description:
        "Get referral statistics for a wallet address, including referral codes, referral count, and conversion rates.",
      schema: z.object({
        walletAddress: z.string().describe("Wallet address to get referral stats for (0x...)"),
      }),
      annotations: { readOnlyHint: true },
      widget: {
        name: "referral-analytics",
        invoking: "Loading referral stats...",
        invoked: "Referral stats loaded",
      },
    },
    async ({ walletAddress }) => {
      try {
        const [codes, referralsAsReferrer, referralAsReferee] = await Promise.all([
          prisma.referralCode.findMany({
            where: { referrerWallet: walletAddress },
            include: { referrals: { orderBy: { createdAt: "desc" } } },
            orderBy: { createdAt: "desc" },
          }),
          prisma.referral.findMany({
            where: { referrerWallet: walletAddress },
            orderBy: { createdAt: "desc" },
          }),
          prisma.referral.findUnique({
            where: { refereeWallet: walletAddress },
          }),
        ]);

        const totalReferrals = referralsAsReferrer.length;
        const completed = referralsAsReferrer.filter((r) => r.status === "COMPLETED").length;
        const pending = referralsAsReferrer.filter((r) => r.status === "PENDING").length;

        return widget({
          props: {
            walletAddress,
            codes: codes.map((c) => ({
              id: c.id,
              code: c.code,
              maxUses: c.maxUses,
              currentUses: c.currentUses,
              active: c.active,
              expiresAt: c.expiresAt?.toISOString() ?? null,
              createdAt: c.createdAt.toISOString(),
            })),
            referrals: referralsAsReferrer.map((r) => ({
              id: r.id,
              refereeWallet: r.refereeWallet,
              status: r.status,
              rewardCredited: r.rewardCredited,
              createdAt: r.createdAt.toISOString(),
              qualifiedAt: r.qualifiedAt?.toISOString() ?? null,
            })),
            stats: {
              totalReferrals,
              completed,
              pending,
              expired: totalReferrals - completed - pending,
              conversionRate: totalReferrals > 0 ? Math.round((completed / totalReferrals) * 100) : 0,
            },
            referredBy: referralAsReferee
              ? {
                  referrerWallet: referralAsReferee.referrerWallet,
                  status: referralAsReferee.status,
                  code: referralAsReferee.code,
                }
              : null,
          },
          output: text(
            `${shortenAddress(walletAddress)} referral stats: ${totalReferrals} ${pluralize(totalReferrals, "referral")}, ${completed} completed, ${pending} pending`
          ),
        });
      } catch (err) {
        console.error("get-referral-stats error:", err);
        return error(`Failed to get referral stats: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  );

  // Tool: lookup-code — check referral code validity
  server.tool(
    {
      name: "lookup-code",
      description: "Check if a referral code is valid and get details about it.",
      schema: z.object({
        code: z.string().describe("Referral code to look up (e.g., REF-A7X9B2)"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ code }) => {
      try {
        const referralCode = await prisma.referralCode.findUnique({
          where: { code },
          include: { _count: { select: { referrals: true } } },
        });

        if (!referralCode) {
          return object({
            code,
            valid: false,
            reason: "Code not found",
          });
        }

        const isExpired = referralCode.expiresAt && referralCode.expiresAt < new Date();
        const isMaxed = referralCode.maxUses > 0 && referralCode.currentUses >= referralCode.maxUses;
        const valid = referralCode.active && !isExpired && !isMaxed;

        return object({
          code: referralCode.code,
          valid,
          referrerWallet: referralCode.referrerWallet,
          maxUses: referralCode.maxUses,
          currentUses: referralCode.currentUses,
          active: referralCode.active,
          expiresAt: referralCode.expiresAt?.toISOString() ?? null,
          createdAt: referralCode.createdAt.toISOString(),
          reason: !valid
            ? isExpired
              ? "Code expired"
              : isMaxed
                ? "Max uses reached"
                : "Code is inactive"
            : null,
        });
      } catch (err) {
        console.error("lookup-code error:", err);
        return error(`Failed to look up code: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  );

  // Tool: get-top-referrers — leaderboard of top referrers
  server.tool(
    {
      name: "get-top-referrers",
      description: "Get the top referrers ranked by completed referral count.",
      schema: z.object({
        limit: z.number().optional().describe("Number of top referrers to show (default: 10)"),
      }),
      annotations: { readOnlyHint: true },
      widget: {
        name: "referral-analytics",
        invoking: "Loading top referrers...",
        invoked: "Top referrers loaded",
      },
    },
    async ({ limit }) => {
      try {
        const take = clampLimit(limit, 10, 50);

        const referrers = await prisma.referral.groupBy({
          by: ["referrerWallet"],
          where: { status: "COMPLETED" },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take,
        });

        const topReferrers = referrers.map((r, i) => ({
          rank: i + 1,
          walletAddress: r.referrerWallet,
          completedReferrals: r._count.id,
        }));

        return widget({
          props: {
            walletAddress: "",
            codes: [],
            referrals: [],
            stats: { totalReferrals: 0, completed: 0, pending: 0, expired: 0, conversionRate: 0 },
            referredBy: null,
            topReferrers,
          },
          output: text(
            `Top ${topReferrers.length} referrers:\n${topReferrers.map((r) => `#${r.rank} ${shortenAddress(r.walletAddress)}: ${r.completedReferrals} completed`).join("\n")}`
          ),
        });
      } catch (err) {
        console.error("get-top-referrers error:", err);
        return error(`Failed to get top referrers: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  );
}
