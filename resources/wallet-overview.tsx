import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const propsSchema = z.object({
  walletAddress: z.string(),
  points: z.object({
    balance: z.number(),
    totalEarned: z.number(),
    totalSpent: z.number(),
  }),
  badges: z.array(z.object({
    id: z.string(),
    name: z.string(),
    tier: z.string().nullable(),
    imageUrl: z.string(),
    awardedAt: z.string(),
  })),
  events: z.array(z.object({
    id: z.string(),
    eventType: z.string(),
    metadata: z.record(z.string(), z.unknown()),
    createdAt: z.string(),
  })),
  transactions: z.array(z.object({
    id: z.string(),
    amount: z.number(),
    type: z.string(),
    description: z.string().nullable(),
    balanceAfter: z.number(),
    createdAt: z.string(),
  })),
  referralSummary: z.object({
    totalCodes: z.number(),
    totalReferrals: z.number(),
    completedReferrals: z.number(),
  }).optional(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Comprehensive wallet overview showing points, badges, events, and transactions",
  props: propsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    invoking: "Loading wallet...",
    invoked: "Wallet loaded",
  },
};

type Props = z.infer<typeof propsSchema>;

const TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#e5e4e2",
};

const EVENT_COLORS: Record<string, string> = {
  purchase: "#10b981",
  login: "#3b82f6",
  signup: "#8b5cf6",
  referral_used: "#f59e0b",
  achievement: "#ef4444",
};

export default function WalletOverview() {
  const { props, isPending } = useWidget<Props>();
  const theme = useWidgetTheme();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👛</div>
          <p style={{ color: "#888" }}>Loading wallet...</p>
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
    accent: "#6366f1",
  };

  return (
    <McpUseProvider autoSize>
      <div style={{ backgroundColor: colors.bg, color: colors.text, fontFamily: "'Inter', -apple-system, sans-serif" }}>
        {/* Header */}
        <div style={{
          padding: "20px", borderBottom: `1px solid ${colors.border}`,
          background: isDark
            ? "linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%)"
            : "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 22,
              backgroundColor: `${colors.accent}20`, border: `2px solid ${colors.accent}40`,
            }}>
              👛
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Wallet Overview</h2>
              <p style={{ margin: "2px 0 0", fontSize: 13, fontFamily: "monospace", color: colors.secondary }}>
                {props.walletAddress.slice(0, 8)}...{props.walletAddress.slice(-6)}
              </p>
            </div>
          </div>
        </div>

        {/* Points Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: "16px 20px" }}>
          {[
            { label: "Balance", value: props.points.balance, icon: "💎", color: "#6366f1" },
            { label: "Earned", value: props.points.totalEarned, icon: "📈", color: "#10b981" },
            { label: "Spent", value: props.points.totalSpent, icon: "📉", color: "#ef4444" },
          ].map((card) => (
            <div key={card.label} style={{
              backgroundColor: colors.cardBg, borderRadius: 10, padding: "12px 14px",
              border: `1px solid ${colors.border}`, textAlign: "center",
            }}>
              <div style={{ fontSize: 16 }}>{card.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: card.color }}>{card.value.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: colors.secondary, textTransform: "uppercase" }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        {props.badges.length > 0 && (
          <div style={{ padding: "0 20px 16px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>🎖️ Badges ({props.badges.length})</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {props.badges.map((badge) => (
                <div key={badge.id} style={{
                  backgroundColor: colors.cardBg, borderRadius: 8, padding: "8px 12px",
                  border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    backgroundColor: TIER_COLORS[badge.tier ?? ""] ?? colors.accent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, color: "#fff", fontWeight: 700,
                  }}>
                    {badge.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{badge.name}</div>
                    {badge.tier && <div style={{ fontSize: 9, color: colors.secondary, textTransform: "capitalize" }}>{badge.tier}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Events */}
        {props.events.length > 0 && (
          <div style={{ padding: "0 20px 16px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>📋 Recent Events</h3>
            <div style={{ borderRadius: 8, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
              {props.events.slice(0, 5).map((event, i) => (
                <div key={event.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 14px", backgroundColor: colors.cardBg,
                  borderBottom: i < Math.min(props.events.length, 5) - 1 ? `1px solid ${colors.border}` : "none",
                }}>
                  <span style={{
                    padding: "2px 6px", borderRadius: 8, fontSize: 10, fontWeight: 600,
                    backgroundColor: `${EVENT_COLORS[event.eventType] ?? "#6b7280"}20`,
                    color: EVENT_COLORS[event.eventType] ?? "#6b7280",
                    textTransform: "uppercase",
                  }}>
                    {event.eventType}
                  </span>
                  <span style={{ fontSize: 10, color: colors.secondary }}>
                    {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referral Summary */}
        {props.referralSummary && (
          <div style={{ padding: "0 20px 16px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>🔗 Referrals</h3>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { label: "Codes", value: props.referralSummary.totalCodes },
                { label: "Referrals", value: props.referralSummary.totalReferrals },
                { label: "Completed", value: props.referralSummary.completedReferrals },
              ].map((s) => (
                <div key={s.label} style={{
                  flex: 1, backgroundColor: colors.cardBg, borderRadius: 8, padding: "10px 12px",
                  border: `1px solid ${colors.border}`, textAlign: "center",
                }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.accent }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: colors.secondary }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {props.points.balance === 0 && props.badges.length === 0 && props.events.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: colors.secondary }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ margin: 0 }}>No activity found for this wallet</p>
          </div>
        )}
      </div>
    </McpUseProvider>
  );
}
