import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const ruleSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  eventTypes: z.array(z.string()),
  conditions: z.array(z.unknown()),
  threshold: z.number().nullable(),
  frequency: z.number().nullable(),
  reward: z.record(z.string(), z.unknown()),
  active: z.boolean(),
  clientName: z.string(),
  timesTriggered: z.number(),
  createdAt: z.string(),
});

const evaluationSchema = z.object({
  matched: z.boolean(),
  breakdown: z.array(z.object({
    check: z.string(),
    passed: z.boolean(),
    detail: z.string(),
  })),
  sampleEvent: z.object({
    eventType: z.string(),
    walletAddress: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
  reward: z.record(z.string(), z.unknown()).nullable(),
}).optional();

const propsSchema = z.object({
  rules: z.array(ruleSchema),
  mode: z.enum(["list", "evaluate"]),
  evaluation: evaluationSchema,
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display and debug loyalty rules with condition visualization and simulation results",
  props: propsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    invoking: "Loading rules...",
    invoked: "Rules loaded",
  },
};

type Props = z.infer<typeof propsSchema>;

const RULE_TYPE_ICONS: Record<string, string> = {
  THRESHOLD: "🎯",
  FREQUENCY: "🔄",
  CONDITIONAL: "🔀",
};

export default function RuleDebugger() {
  const { props, isPending } = useWidget<Props>();
  const theme = useWidgetTheme();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚙️</div>
          <p style={{ color: "#888" }}>Loading rules...</p>
        </div>
      </McpUseProvider>
    );
  }

  const isDark = theme === "dark";
  const colors = {
    bg: isDark ? "#1a1a2e" : "#ffffff",
    text: isDark ? "#e0e0e0" : "#1a1a1a",
    secondary: isDark ? "#a0a0b0" : "#666",
    border: isDark ? "#2a2a3e" : "#e5e7eb",
    cardBg: isDark ? "#222240" : "#f9fafb",
    success: "#10b981",
    error: "#ef4444",
    accent: "#6366f1",
  };

  return (
    <McpUseProvider autoSize>
      <div style={{ backgroundColor: colors.bg, color: colors.text, fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}` }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            ⚙️ {props.mode === "evaluate" ? "Rule Evaluation" : "Rules Engine"}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.secondary }}>
            {props.rules.length} rule{props.rules.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Evaluation Result */}
        {props.mode === "evaluate" && props.evaluation && (
          <div style={{ padding: "16px 20px" }}>
            <div style={{
              padding: "14px 18px", borderRadius: 10,
              backgroundColor: props.evaluation.matched ? `${colors.success}15` : `${colors.error}15`,
              border: `1px solid ${props.evaluation.matched ? colors.success : colors.error}40`,
              marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>{props.evaluation.matched ? "✅" : "❌"}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: props.evaluation.matched ? colors.success : colors.error }}>
                  {props.evaluation.matched ? "Rule WOULD trigger" : "Rule would NOT trigger"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: colors.secondary }}>
                Testing event type: <strong>{props.evaluation.sampleEvent.eventType}</strong>
              </div>
            </div>

            {/* Breakdown */}
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Evaluation Breakdown</h3>
            <div style={{ borderRadius: 8, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
              {props.evaluation.breakdown.map((step, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  backgroundColor: colors.cardBg,
                  borderBottom: i < props.evaluation!.breakdown.length - 1 ? `1px solid ${colors.border}` : "none",
                }}>
                  <span style={{ fontSize: 16 }}>{step.passed ? "✅" : "❌"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{step.check}</div>
                    <div style={{ fontSize: 11, color: colors.secondary }}>{step.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reward info */}
            {props.evaluation.reward && (
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, backgroundColor: `${colors.accent}15`, border: `1px solid ${colors.accent}40` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.accent }}>Reward</div>
                <div style={{ fontSize: 11, color: colors.secondary, marginTop: 4, fontFamily: "monospace" }}>
                  {JSON.stringify(props.evaluation.reward, null, 2)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rules List */}
        <div style={{ padding: "0 20px 16px" }}>
          {props.mode === "list" && (
            <div style={{ marginTop: 12 }}>
              {props.rules.map((rule) => (
                <div key={rule.id} style={{
                  backgroundColor: colors.cardBg, borderRadius: 10,
                  border: `1px solid ${colors.border}`, padding: "14px 18px",
                  marginBottom: 10,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{RULE_TYPE_ICONS[rule.type] ?? "📋"}</span>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{rule.name}</span>
                    </div>
                    <span style={{
                      padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600,
                      backgroundColor: rule.active ? `${colors.success}20` : `${colors.error}20`,
                      color: rule.active ? colors.success : colors.error,
                    }}>
                      {rule.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11, color: colors.secondary }}>
                    <span>Type: <strong>{rule.type}</strong></span>
                    <span>Events: <strong>{rule.eventTypes.join(", ")}</strong></span>
                    {rule.threshold !== null && <span>Threshold: <strong>{rule.threshold}</strong></span>}
                    {rule.frequency !== null && <span>Frequency: <strong>{rule.frequency} days</strong></span>}
                    <span>Triggered: <strong>{rule.timesTriggered}x</strong></span>
                  </div>

                  {rule.reward && (
                    <div style={{
                      marginTop: 8, padding: "6px 10px", borderRadius: 6,
                      backgroundColor: isDark ? "#1a1a2e" : "#f3f4f6",
                      fontSize: 11, fontFamily: "monospace", color: colors.secondary,
                    }}>
                      Reward: {JSON.stringify(rule.reward)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {props.rules.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: colors.secondary }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
              <p style={{ margin: 0 }}>No rules found</p>
            </div>
          )}
        </div>
      </div>
    </McpUseProvider>
  );
}
