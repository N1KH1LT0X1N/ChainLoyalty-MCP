import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const codeSchema = z.object({
  id: z.string(),
  code: z.string(),
  maxUses: z.number(),
  currentUses: z.number(),
  active: z.boolean(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
});

const referralSchema = z.object({
  id: z.string(),
  refereeWallet: z.string(),
  status: z.string(),
  rewardCredited: z.boolean(),
  createdAt: z.string(),
  qualifiedAt: z.string().nullable(),
});

const topReferrerSchema = z.object({
  rank: z.number(),
  walletAddress: z.string(),
  completedReferrals: z.number(),
});

const propsSchema = z.object({
  walletAddress: z.string(),
  codes: z.array(codeSchema),
  referrals: z.array(referralSchema),
  stats: z.object({
    totalReferrals: z.number(),
    completed: z.number(),
    pending: z.number(),
    expired: z.number(),
    conversionRate: z.number(),
  }),
  referredBy: z.object({
    referrerWallet: z.string(),
    status: z.string(),
    code: z.string(),
  }).nullable(),
  topReferrers: z.array(topReferrerSchema).optional(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display referral analytics: stats, codes, referral list, and top referrers",
  props: propsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    invoking: "Loading referral data...",
    invoked: "Referral data loaded",
  },
};

type Props = z.infer<typeof propsSchema>;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  COMPLETED: "#10b981",
  EXPIRED: "#6b7280",
};

export default function ReferralAnalytics() {
  const { props, isPending } = useWidget<Props>();
  const theme = useWidgetTheme();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔗</div>
          <p style={{ color: "#888" }}>Loading referral data...</p>
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

  const showTopReferrers = props.topReferrers && props.topReferrers.length > 0;

  return (
    <McpUseProvider autoSize>
      <div style={{ backgroundColor: colors.bg, color: colors.text, fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}` }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🔗 Referral Analytics</h2>
          {props.walletAddress && (
            <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.secondary, fontFamily: "monospace" }}>
              {props.walletAddress.slice(0, 6)}...{props.walletAddress.slice(-4)}
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: "16px 20px" }}>
          {[
            { label: "Total", value: props.stats.totalReferrals, color: colors.accent },
            { label: "Completed", value: props.stats.completed, color: "#10b981" },
            { label: "Pending", value: props.stats.pending, color: "#f59e0b" },
            { label: "Conversion", value: `${props.stats.conversionRate}%`, color: "#8b5cf6" },
          ].map((card) => (
            <div key={card.label} style={{
              backgroundColor: colors.cardBg, borderRadius: 8, padding: "12px 14px",
              border: `1px solid ${colors.border}`, textAlign: "center",
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: 10, color: colors.secondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Referred By */}
        {props.referredBy && (
          <div style={{ padding: "0 20px 16px" }}>
            <div style={{
              padding: "10px 14px", borderRadius: 8,
              backgroundColor: `${colors.accent}10`, border: `1px solid ${colors.accent}30`,
              fontSize: 12,
            }}>
              📨 Referred by <strong style={{ fontFamily: "monospace" }}>
                {props.referredBy.referrerWallet.slice(0, 6)}...{props.referredBy.referrerWallet.slice(-4)}
              </strong> via code <strong>{props.referredBy.code}</strong>
            </div>
          </div>
        )}

        {/* Referral Codes */}
        {props.codes.length > 0 && (
          <div style={{ padding: "0 20px 16px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>📋 Referral Codes</h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {props.codes.map((code) => (
                <div key={code.id} style={{
                  backgroundColor: colors.cardBg, borderRadius: 8, padding: "10px 14px",
                  border: `1px solid ${colors.border}`, minWidth: 160,
                }}>
                  <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: colors.accent }}>
                    {code.code}
                  </div>
                  <div style={{ fontSize: 11, color: colors.secondary, marginTop: 4 }}>
                    {code.currentUses}/{code.maxUses === 0 ? "∞" : code.maxUses} uses
                    <span style={{ marginLeft: 8, color: code.active ? "#10b981" : "#ef4444" }}>
                      {code.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referral List */}
        {props.referrals.length > 0 && (
          <div style={{ padding: "0 20px 16px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>👥 Referrals</h3>
            <div style={{ borderRadius: 8, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
              {props.referrals.map((ref, i) => (
                <div key={ref.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", backgroundColor: colors.cardBg,
                  borderBottom: i < props.referrals.length - 1 ? `1px solid ${colors.border}` : "none",
                }}>
                  <div>
                    <span style={{ fontFamily: "monospace", fontSize: 12 }}>
                      {ref.refereeWallet.slice(0, 6)}...{ref.refereeWallet.slice(-4)}
                    </span>
                    <div style={{ fontSize: 10, color: colors.secondary, marginTop: 2 }}>
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{
                    padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600,
                    backgroundColor: `${STATUS_COLORS[ref.status] ?? "#6b7280"}20`,
                    color: STATUS_COLORS[ref.status] ?? "#6b7280",
                  }}>
                    {ref.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Referrers */}
        {showTopReferrers && (
          <div style={{ padding: "0 20px 16px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>🏅 Top Referrers</h3>
            <div style={{ borderRadius: 8, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
              {props.topReferrers!.map((ref, i) => (
                <div key={ref.walletAddress} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                  backgroundColor: colors.cardBg,
                  borderBottom: i < props.topReferrers!.length - 1 ? `1px solid ${colors.border}` : "none",
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
                    backgroundColor: ref.rank <= 3 ? ["#ffd700", "#c0c0c0", "#cd7f32"][ref.rank - 1] : colors.border,
                    color: ref.rank <= 3 ? "#1a1a1a" : colors.text,
                  }}>
                    {ref.rank}
                  </div>
                  <span style={{ flex: 1, fontFamily: "monospace", fontSize: 12 }}>
                    {ref.walletAddress.slice(0, 6)}...{ref.walletAddress.slice(-4)}
                  </span>
                  <span style={{ fontWeight: 700, color: colors.accent }}>{ref.completedReferrals}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </McpUseProvider>
  );
}
