import { z } from "zod";
import { widget, text, object, error } from "mcp-use/server";
import type { MCPServer } from "mcp-use/server";
import prisma from "../utils/prisma.js";
import { formatRuleType, formatRewardType, formatNumber } from "../utils/formatters.js";

export function registerRulesTools(server: MCPServer) {
  // Tool: list-rules — show all rules, optionally filtered by active status
  server.tool(
    {
      name: "list-rules",
      description:
        "List all loyalty rules. Optionally filter by active status. Shows rule names, types, conditions, and rewards.",
      schema: z.object({
        active: z
          .boolean()
          .optional()
          .describe("Filter by active status (true=active only, false=inactive only)"),
      }),
      annotations: { readOnlyHint: true },
      widget: {
        name: "rule-debugger",
        invoking: "Loading rules...",
        invoked: "Rules loaded",
      },
    },
    async ({ active }) => {
      try {
        const rules = await prisma.rule.findMany({
          where: active !== undefined ? { active } : undefined,
          include: {
            client: { select: { name: true } },
            _count: { select: { rewardLogs: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        const serialized = rules.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          eventTypes: r.eventTypes,
          conditions: r.conditions as unknown[],
          threshold: r.threshold,
          frequency: r.frequency,
          reward: r.reward as Record<string, unknown>,
          active: r.active,
          clientName: r.client.name,
          timesTriggered: r._count.rewardLogs,
          createdAt: r.createdAt.toISOString(),
        }));

        return widget({
          props: {
            rules: serialized,
            mode: "list" as const,
          },
          output: text(
            `Found ${serialized.length} rules${active !== undefined ? ` (${active ? "active" : "inactive"} only)` : ""}:\n${serialized.map((r) => `• ${r.name} [${formatRuleType(r.type)}] — ${r.active ? "✅ Active" : "❌ Inactive"} (triggered ${formatNumber(r.timesTriggered)} times)`).join("\n")}`
          ),
        });
      } catch (err) {
        console.error("list-rules error:", err);
        return error(
          `Failed to list rules: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }
  );

  // Tool: evaluate-rule — test a rule against a sample event
  server.tool(
    {
      name: "evaluate-rule",
      description:
        "Evaluate a rule against a sample event to see if it would trigger. Shows a detailed breakdown of which conditions matched.",
      schema: z.object({
        ruleId: z.string().describe("Rule ID to evaluate"),
        sampleEvent: z
          .object({
            eventType: z.string().describe("Event type to test"),
            walletAddress: z.string().optional().describe("Wallet address for context"),
            metadata: z
              .record(z.string(), z.unknown())
              .optional()
              .describe("Event metadata key-value pairs"),
          })
          .describe("Sample event data to test against the rule"),
      }),
      annotations: { readOnlyHint: true },
      widget: {
        name: "rule-debugger",
        invoking: "Evaluating rule...",
        invoked: "Evaluation complete",
      },
    },
    async ({ ruleId, sampleEvent }) => {
      try {
        const rule = await prisma.rule.findUnique({
          where: { id: ruleId },
          include: { client: { select: { name: true } } },
        });

        if (!rule) {
          return error(`Rule not found: ${ruleId}`);
        }

        // Evaluation logic
        const breakdown: Array<{
          check: string;
          passed: boolean;
          detail: string;
        }> = [];

        // Check 1: Event type match
        const eventTypeMatch = rule.eventTypes.includes(sampleEvent.eventType);
        breakdown.push({
          check: "Event Type",
          passed: eventTypeMatch,
          detail: eventTypeMatch
            ? `"${sampleEvent.eventType}" matches rule event types [${rule.eventTypes.join(", ")}]`
            : `"${sampleEvent.eventType}" not in [${rule.eventTypes.join(", ")}]`,
        });

        // Check 2: Active status
        breakdown.push({
          check: "Rule Active",
          passed: rule.active,
          detail: rule.active ? "Rule is active" : "Rule is inactive — would not trigger",
        });

        // Check 3: Threshold (if applicable)
        if (rule.type === "THRESHOLD" && rule.threshold !== null) {
          const eventCount = sampleEvent.walletAddress
            ? await prisma.event.count({
                where: {
                  walletAddress: sampleEvent.walletAddress,
                  eventType: { in: rule.eventTypes },
                },
              })
            : 0;
          const thresholdMet = eventCount >= (rule.threshold ?? 0);
          breakdown.push({
            check: "Threshold",
            passed: thresholdMet,
            detail: `${eventCount}/${rule.threshold} events (${thresholdMet ? "met" : "not met"})`,
          });
        }

        // Check 4: Conditions (if applicable)
        if (rule.type === "CONDITIONAL") {
          const conditions = rule.conditions as Array<Record<string, unknown>>;
          if (conditions.length > 0) {
            const metadataMatch = conditions.every((cond) => {
              const field = cond.field as string;
              const operator = cond.operator as string;
              const value = cond.value;
              const actual = sampleEvent.metadata?.[field];

              if (operator === "equals") return actual === value;
              if (operator === "gt") return Number(actual) > Number(value);
              if (operator === "lt") return Number(actual) < Number(value);
              if (operator === "contains")
                return String(actual).includes(String(value));
              return false;
            });
            breakdown.push({
              check: "Conditions",
              passed: metadataMatch,
              detail: metadataMatch
                ? "All conditions matched"
                : "One or more conditions failed",
            });
          }
        }

        const allPassed = breakdown.every((b) => b.passed);

        const serializedRule = {
          id: rule.id,
          name: rule.name,
          type: rule.type,
          eventTypes: rule.eventTypes,
          conditions: rule.conditions as unknown[],
          threshold: rule.threshold,
          frequency: rule.frequency,
          reward: rule.reward as Record<string, unknown>,
          active: rule.active,
          clientName: rule.client.name,
          timesTriggered: 0,
          createdAt: rule.createdAt.toISOString(),
        };

        return widget({
          props: {
            rules: [serializedRule],
            mode: "evaluate" as const,
            evaluation: {
              matched: allPassed,
              breakdown,
              sampleEvent,
              reward: allPassed ? (rule.reward as Record<string, unknown>) : null,
            },
          },
          output: text(
            `Rule "${rule.name}" ${allPassed ? "✅ WOULD trigger" : "❌ would NOT trigger"} for event "${sampleEvent.eventType}":\n${breakdown.map((b) => `${b.passed ? "✅" : "❌"} ${b.check}: ${b.detail}`).join("\n")}`
          ),
        });
      } catch (err) {
        console.error("evaluate-rule error:", err);
        return error(
          `Failed to evaluate rule: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }
  );

  // Tool: get-rule-details — detailed info for a single rule
  server.tool(
    {
      name: "get-rule-details",
      description:
        "Get detailed information about a specific rule including conditions, reward config, and trigger history.",
      schema: z.object({
        ruleId: z.string().describe("Rule ID to get details for"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ ruleId }) => {
      try {
        const rule = await prisma.rule.findUnique({
          where: { id: ruleId },
          include: {
            client: { select: { name: true } },
            rewardLogs: {
              take: 10,
              orderBy: { createdAt: "desc" },
              select: {
                walletAddress: true,
                rewardType: true,
                rewardData: true,
                createdAt: true,
              },
            },
            _count: { select: { rewardLogs: true, transactions: true } },
          },
        });

        if (!rule) {
          return error(`Rule not found: ${ruleId}`);
        }

        return object({
          rule: {
            id: rule.id,
            name: rule.name,
            type: rule.type,
            eventTypes: rule.eventTypes,
            conditions: rule.conditions,
            threshold: rule.threshold,
            frequency: rule.frequency,
            reward: rule.reward,
            active: rule.active,
            clientName: rule.client.name,
            createdAt: rule.createdAt.toISOString(),
            updatedAt: rule.updatedAt.toISOString(),
          },
          stats: {
            totalTriggers: rule._count.rewardLogs,
            totalTransactions: rule._count.transactions,
          },
          recentTriggers: rule.rewardLogs.map((rl) => ({
            walletAddress: rl.walletAddress,
            rewardType: rl.rewardType,
            rewardData: rl.rewardData,
            createdAt: rl.createdAt.toISOString(),
          })),
        });
      } catch (err) {
        console.error("get-rule-details error:", err);
        return error(
          `Failed to get rule details: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }
  );
}
