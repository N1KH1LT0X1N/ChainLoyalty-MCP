import { z } from "zod";
import { widget, text, object, error } from "mcp-use/server";
import type { MCPServer } from "mcp-use/server";
import prisma from "../utils/prisma.js";
import { clampLimit, buildDateFilter } from "../utils/validators.js";
import { formatDate, shortenAddress, formatNumber, pluralize } from "../utils/formatters.js";

export function registerEventTools(server: MCPServer) {
  // Tool: query-events — search events with filters, returns timeline widget
  server.tool(
    {
      name: "query-events",
      description:
        "Search and filter loyalty events by wallet address, event type, or date range. Returns a visual timeline of matching events.",
      schema: z.object({
        walletAddress: z
          .string()
          .optional()
          .describe("Filter by wallet address (0x...)"),
        eventType: z
          .string()
          .optional()
          .describe(
            "Event type filter: purchase, login, signup, referral_used, achievement, custom_*"
          ),
        startDate: z
          .string()
          .optional()
          .describe("ISO date string — events after this date"),
        endDate: z
          .string()
          .optional()
          .describe("ISO date string — events before this date"),
        limit: z
          .number()
          .optional()
          .describe("Max results to return (default: 50, max: 500)"),
      }),
      annotations: { readOnlyHint: true },
      widget: {
        name: "event-timeline",
        invoking: "Searching events...",
        invoked: "Events loaded",
      },
    },
    async ({ walletAddress, eventType, startDate, endDate, limit }) => {
      try {
        const take = clampLimit(limit);
        const dateFilter = buildDateFilter(startDate, endDate);

        const events = await prisma.event.findMany({
          where: {
            ...(walletAddress && { walletAddress }),
            ...(eventType && { eventType }),
            ...(dateFilter && { createdAt: dateFilter }),
          },
          take,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            eventId: true,
            eventType: true,
            walletAddress: true,
            metadata: true,
            createdAt: true,
            client: { select: { name: true } },
          },
        });

        const serialized = events.map((e) => ({
          id: e.id,
          eventId: e.eventId,
          eventType: e.eventType,
          walletAddress: e.walletAddress,
          metadata: e.metadata as Record<string, unknown>,
          createdAt: e.createdAt.toISOString(),
          clientName: e.client.name,
        }));

        return widget({
          props: {
            events: serialized,
            walletAddress: walletAddress ?? "",
            filters: { eventType, startDate, endDate },
            totalCount: serialized.length,
          },
          output: text(
            `Found ${formatNumber(serialized.length)} ${pluralize(serialized.length, "event")}${walletAddress ? ` for ${shortenAddress(walletAddress)}` : ""}${eventType ? ` of type "${eventType}"` : ""}`
          ),
        });
      } catch (err) {
        console.error("query-events error:", err);
        return error(
          `Failed to query events: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }
  );

  // Tool: get-event-types — list distinct event types with counts
  server.tool(
    {
      name: "get-event-types",
      description:
        "List all available event types with their counts. Optionally filter by wallet address.",
      schema: z.object({
        walletAddress: z
          .string()
          .optional()
          .describe("Optionally filter event types by wallet address"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ walletAddress }) => {
      try {
        const result = await prisma.event.groupBy({
          by: ["eventType"],
          _count: { id: true },
          ...(walletAddress && { where: { walletAddress } }),
          orderBy: { _count: { id: "desc" } },
        });

        const eventTypes = result.map((r) => ({
          type: r.eventType,
          count: r._count.id,
        }));

        return object({
          eventTypes,
          total: eventTypes.reduce((sum, e) => sum + e.count, 0),
        });
      } catch (err) {
        console.error("get-event-types error:", err);
        return error(
          `Failed to get event types: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }
  );

  // Tool: count-events — aggregate event counts grouped by type or day
  server.tool(
    {
      name: "count-events",
      description:
        "Get aggregate event counts, optionally grouped by event type or day.",
      schema: z.object({
        walletAddress: z
          .string()
          .optional()
          .describe("Filter by wallet address"),
        groupBy: z
          .enum(["eventType", "day"])
          .optional()
          .describe("Group results by 'eventType' or 'day'"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ walletAddress, groupBy }) => {
      try {
        if (groupBy === "eventType") {
          const result = await prisma.event.groupBy({
            by: ["eventType"],
            _count: { id: true },
            ...(walletAddress && { where: { walletAddress } }),
            orderBy: { _count: { id: "desc" } },
          });
          return object({
            groupBy: "eventType",
            breakdown: result.map((r) => ({
              eventType: r.eventType,
              count: r._count.id,
            })),
            total: result.reduce((sum, r) => sum + r._count.id, 0),
          });
        }

        // Default: total count (no grouping or day grouping via raw)
        const total = await prisma.event.count({
          ...(walletAddress && { where: { walletAddress } }),
        });

        return object({ total, walletAddress: walletAddress ?? "all" });
      } catch (err) {
        console.error("count-events error:", err);
        return error(
          `Failed to count events: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }
  );
}
