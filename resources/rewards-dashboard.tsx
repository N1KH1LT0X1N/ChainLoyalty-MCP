import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const badgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string(),
  tier: z.string().nullable(),
  awardedAt: z.string(),
});

const transactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  type: z.string(),
  description: z.string().nullable(),
  balanceAfter: z.number(),
  createdAt: z.string(),
});

const leaderboardSchema = z.object({
  rank: z.number(),
  walletAddress: z.string(),
  balance: z.number(),
  totalEarned: z.number(),
});

const propsSchema = z.object({
  points: z.object({
    balance: z.number(),
    totalEarned: z.number(),
    totalSpent: z.number(),
  }),
  badges: z.array(badgeSchema),
  transactions: z.array(transactionSchema),
  walletAddress: z.string(),
  leaderboard: z.array(leaderboardSchema).optional(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display rewards overview: points balance, badges, transactions, and leaderboard",
  props: propsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    invoking: "Loading rewards...",
    invoked: "Rewards loaded",
  },
};

type Props = z.infer<typeof propsSchema>;

const TX_COLORS: Record<string, string> = {
  EARNED: "#10b981",
  SPENT: "#ef4444",
  REFERRAL: "#f59e0b",
  BONUS: "#8b5cf6",
  ADJUSTMENT: "#6b7280",
};

const TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#e5e4e2",
};

export default function RewardsDashboard() {
  const { props, isPending } = useWidget<Props>();
  const theme = useWidgetTheme();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
          <p style={{ color: "#888" }}>Loading rewards...</p>
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

  const showLeaderboard = props.leaderboard && props.leaderboard.length > 0;

  return (
    <McpUseProvider autoSize>
      <div style={{ backgroundColor: colors.bg, color: colors.text, fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}` }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🏆 Rewards Dashboard</h2>
          {props.walletAddress && (
            <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.secondary, fontFamily: "monospace" }}>
              {props.walletAddress.slice(0, 6)}...{props.walletAddress.slice(-4)}
            </p>
          )}
        </div>

        {/* Points Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: "16px 20px" }}>
          {[
            { label: "Balance", value: props.points.balance, color: "#6366f1", icon: "💎" },
            { label: "Total Earned", value: props.points.totalEarned, color: "#10b981", icon: "📈" },
            { label: "Total Spent", value: props.points.totalSpent, color: "#ef4444", icon: "📉" },
          ].map((card) => (
            <div key={card.label} style={{
              backgroundColor: colors.cardBg, borderRadius: 10, padding: "14px 16px",
              border: `1px solid ${colors.border}`, textAlign: "center",
            }}>
              <div style={{ fontSize: 20 }}>{card.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: card.color, margin: "4px 0" }}>
                {card.value.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: colors.secondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Badges */}
        {props.badges.length > 0 && (
          <div style={{ padding: "0 20px 16px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: colors.text }}>
              🎖️ Badges ({props.badges.length})
            </h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {props.badges.map((badge) => (
                <div key={badge.id} style={{
                  backgroundColor: colors.cardBg, borderRadius: 8, padding: "10px 14px",
                  border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: 10,
                  minWidth: 180,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    backgroundColor: TIER_COLORS[badge.tier ?? ""] ?? colors.accent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, color: "#fff", fontWeight: 700,
                  }}>
                    {badge.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{badge.name}</div>
                    {badge.tier && (
                      <div style={{ fontSize: 10, color: TIER_COLORS[badge.tier] ?? colors.secondary, textTransform: "capitalize" }}>
                        {badge.tier}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions */}
        {props.transactions.length > 0 && (
          <div style={{ padding: "0 20px 16px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: colors.text }}>
              💳 Recent Transactions
            </h3>
            <div style={{ borderRadius: 8, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
              {props.transactions.map((tx, i) => (
                <div key={tx.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", backgroundColor: colors.cardBg,
                  borderBottom: i < props.transactions.length - 1 ? `1px solid ${colors.border}` : "none",
                }}>
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                      color: TX_COLORS[tx.type] ?? colors.secondary, letterSpacing: "0.5px",
                    }}>
                      {tx.type}
                    </span>
                    {tx.description && (
                      <div style={{ fontSize: 12, color: colors.secondary, marginTop: 2 }}>{tx.description}</div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: 14, fontWeight: 700,
                      color: tx.amount >= 0 ? "#10b981" : "#ef4444",
                    }}>
                      {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: colors.secondary }}>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {showLeaderboard && (
          <div style={{ padding: "0 20px 16px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: colors.text }}>
              🏅 Leaderboard
            </h3>
            <div style={{ borderRadius: 8, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
              {props.leaderboard!.map((entry, i) => (
                <div key={entry.walletAddress} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                  backgroundColor: colors.cardBg,
                  borderBottom: i < props.leaderboard!.length - 1 ? `1px solid ${colors.border}` : "none",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", display: "flex",
                    alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12,
                    backgroundColor: entry.rank <= 3
                      ? ["#ffd700", "#c0c0c0", "#cd7f32"][entry.rank - 1]
                      : colors.border,
                    color: entry.rank <= 3 ? "#1a1a1a" : colors.text,
                  }}>
                    {entry.rank}
                  </div>
                  <div style={{ flex: 1, fontFamily: "monospace", fontSize: 12 }}>
                    {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                  </div>
                  <div style={{ fontWeight: 700, color: colors.accent }}>
                    {entry.balance.toLocaleString()} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {props.badges.length === 0 && props.transactions.length === 0 && !showLeaderboard && props.points.balance === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: colors.secondary }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌟</div>
            <p style={{ margin: 0 }}>No rewards data found for this wallet</p>
          </div>
        )}
      </div>
    </McpUseProvider>
  );
}
