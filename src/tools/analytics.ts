import { z } from "zod";
import { widget, text, object, error } from "mcp-use/server";
import type { MCPServer } from "mcp-use/server";
import prisma from "../utils/prisma.js";
import { formatNumber, pluralize } from "../utils/formatters.js";

export function registerAnalyticsTools(server: MCPServer) {
  // Tool: platform-stats — overall platform metrics
  server.tool(
    {
      name: "platform-stats",
      description:
        "Get overall platform statistics including total users, events, points distributed, and active rules.",
      schema: z.object({}),
      annotations: { readOnlyHint: true },
      widget: {
        name: "analytics-dashboard",
        invoking: "Loading platform stats...",
        invoked: "Stats loaded",
      },
    },
    async () => {
      try {
        const [
          totalUsers,
          totalEvents,
          totalBadges,
          totalRules,
          activeRules,
          totalReferrals,
          pointsAgg,
          recentEventTypes,
        ] = await Promise.all([
          prisma.pointsBalance.count(),
          prisma.event.count(),
          prisma.badge.count(),
          prisma.rule.count(),
          prisma.rule.count({ where: { active: true } }),
          prisma.referral.count(),
          prisma.pointsBalance.aggregate({
            _sum: { totalEarned: true, totalSpent: true, balance: true },
          }),
          prisma.event.groupBy({
            by: ["eventType"],
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 10,
          }),
        ]);

        return widget({
          props: {
            kpis: {
              totalUsers,
              totalEvents,
              totalBadges,
              totalRules,
              activeRules,
              totalReferrals,
              totalPointsDistributed: pointsAgg._sum.totalEarned ?? 0,
              totalPointsSpent: pointsAgg._sum.totalSpent ?? 0,
              totalPointsInCirculation: pointsAgg._sum.balance ?? 0,
            },
            eventDistribution: recentEventTypes.map((e) => ({
              eventType: e.eventType,
              count: e._count.id,
            })),
          },
          output: text(
            `Platform Stats:\n• ${formatNumber(totalUsers)} users\n• ${formatNumber(totalEvents)} events\n• ${formatNumber(totalBadges)} ${pluralize(totalBadges, "badge")}\n• ${activeRules}/${totalRules} active rules\n• ${formatNumber(totalReferrals)} referrals\n• ${formatNumber(pointsAgg._sum.totalEarned ?? 0)} total points distributed`
          ),
        });
      } catch (err) {
        console.error("platform-stats error:", err);
        return error(`Failed to get platform stats: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  );

  // Tool: active-users — count of active users by period
  server.tool(
    {
      name: "active-users",
      description:
        "Get the count of active users (users with events) in a given time period.",
      schema: z.object({
        period: z
          .enum(["day", "week", "month"])
          .optional()
          .describe("Time period to check (default: 'week')"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ period = "week" }) => {
      try {
        const now = new Date();
        const startDate = new Date(now);

        if (period === "day") {
          startDate.setDate(startDate.getDate() - 1);
        } else if (period === "week") {
          startDate.setDate(startDate.getDate() - 7);
        } else {
          startDate.setMonth(startDate.getMonth() - 1);
        }

        const activeWallets = await prisma.event.findMany({
          where: { createdAt: { gte: startDate } },
          distinct: ["walletAddress"],
          select: { walletAddress: true },
        });

        // Get previous period for comparison
        const prevStart = new Date(startDate);
        if (period === "day") {
          prevStart.setDate(prevStart.getDate() - 1);
        } else if (period === "week") {
          prevStart.setDate(prevStart.getDate() - 7);
        } else {
          prevStart.setMonth(prevStart.getMonth() - 1);
        }

        const prevActiveWallets = await prisma.event.findMany({
          where: { createdAt: { gte: prevStart, lt: startDate } },
          distinct: ["walletAddress"],
          select: { walletAddress: true },
        });

        const current = activeWallets.length;
        const previous = prevActiveWallets.length;
        const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;

        return object({
          period,
          activeUsers: current,
          previousPeriod: previous,
          changePercent: change,
          trend: change > 0 ? "up" : change < 0 ? "down" : "flat",
        });
      } catch (err) {
        console.error("active-users error:", err);
        return error(`Failed to get active users: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  );

  // Tool: engagement-trends — engagement over time
  server.tool(
    {
      name: "engagement-trends",
      description:
        "Get engagement metrics over a time period, showing daily event counts and trends.",
      schema: z.object({
        days: z
          .number()
          .optional()
          .describe("Number of past days to analyze (default: 30, max: 90)"),
      }),
      annotations: { readOnlyHint: true },
      widget: {
        name: "analytics-dashboard",
        invoking: "Analyzing trends...",
        invoked: "Trends loaded",
      },
    },
    async ({ days = 30 }) => {
      try {
        const numDays = Math.min(Math.max(days, 1), 90);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - numDays);

        const events = await prisma.event.findMany({
          where: { createdAt: { gte: startDate } },
          select: { createdAt: true, eventType: true },
          orderBy: { createdAt: "asc" },
        });

        // Group by day
        const dailyCounts: Record<string, number> = {};
        for (let i = 0; i < numDays; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          dailyCounts[d.toISOString().split("T")[0]] = 0;
        }

        for (const e of events) {
          const day = e.createdAt.toISOString().split("T")[0];
          if (dailyCounts[day] !== undefined) {
            dailyCounts[day]++;
          }
        }

        const chartData = Object.entries(dailyCounts).map(([date, count]) => ({
          date,
          count,
        }));

        const totalEvents = events.length;
        const avgDaily = Math.round(totalEvents / numDays);

        return widget({
          props: {
            kpis: {
              totalUsers: 0,
              totalEvents: totalEvents,
              totalBadges: 0,
              totalRules: 0,
              activeRules: 0,
              totalReferrals: 0,
              totalPointsDistributed: 0,
              totalPointsSpent: 0,
              totalPointsInCirculation: 0,
            },
            eventDistribution: [],
            trends: {
              days: numDays,
              chartData,
              totalEvents,
              avgDaily,
            },
          },
          output: text(
            `Engagement trends (last ${numDays} days): ${formatNumber(totalEvents)} events, ~${formatNumber(avgDaily)}/day average`
          ),
        });
      } catch (err) {
        console.error("engagement-trends error:", err);
        return error(`Failed to get engagement trends: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  );
}
