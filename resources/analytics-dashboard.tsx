import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const propsSchema = z.object({
  kpis: z.object({
    totalUsers: z.number(),
    totalEvents: z.number(),
    totalBadges: z.number(),
    totalRules: z.number(),
    activeRules: z.number(),
    totalReferrals: z.number(),
    totalPointsDistributed: z.number(),
    totalPointsSpent: z.number(),
    totalPointsInCirculation: z.number(),
  }),
  eventDistribution: z.array(z.object({
    eventType: z.string(),
    count: z.number(),
  })),
  trends: z.object({
    days: z.number(),
    chartData: z.array(z.object({
      date: z.string(),
      count: z.number(),
    })),
    totalEvents: z.number(),
    avgDaily: z.number(),
  }).optional(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Platform analytics dashboard with KPI cards, event distribution, and engagement trends",
  props: propsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    invoking: "Loading analytics...",
    invoked: "Analytics loaded",
  },
};

type Props = z.infer<typeof propsSchema>;

export default function AnalyticsDashboard() {
  const { props, isPending } = useWidget<Props>();
  const theme = useWidgetTheme();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
          <p style={{ color: "#888" }}>Loading analytics...</p>
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
    barBg: isDark ? "#333355" : "#e5e7eb",
  };

  const maxEventCount = Math.max(
    ...props.eventDistribution.map((e) => e.count),
    1
  );

  const maxChartCount = props.trends
    ? Math.max(...props.trends.chartData.map((d) => d.count), 1)
    : 1;

  return (
    <McpUseProvider autoSize>
      <div style={{ backgroundColor: colors.bg, color: colors.text, fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}` }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>📊 Platform Analytics</h2>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: "16px 20px" }}>
          {[
            { label: "Users", value: props.kpis.totalUsers, icon: "👥", color: "#6366f1" },
            { label: "Events", value: props.kpis.totalEvents, icon: "📋", color: "#10b981" },
            { label: "Badges", value: props.kpis.totalBadges, icon: "🎖️", color: "#f59e0b" },
            { label: "Active Rules", value: props.kpis.activeRules, icon: "⚙️", color: "#8b5cf6" },
            { label: "Referrals", value: props.kpis.totalReferrals, icon: "🔗", color: "#3b82f6" },
            { label: "Points Distributed", value: props.kpis.totalPointsDistributed, icon: "💎", color: "#ef4444" },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              backgroundColor: colors.cardBg, borderRadius: 10, padding: "12px 14px",
              border: `1px solid ${colors.border}`, textAlign: "center",
            }}>
              <div style={{ fontSize: 16 }}>{kpi.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: kpi.color, margin: "2px 0" }}>
                {kpi.value.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: colors.secondary, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                {kpi.label}
              </div>
            </div>
          ))}
        </div>

        {/* Event Distribution */}
        {props.eventDistribution.length > 0 && (
          <div style={{ padding: "0 20px 16px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>📈 Event Distribution</h3>
            <div style={{ borderRadius: 8, border: `1px solid ${colors.border}`, padding: 14, backgroundColor: colors.cardBg }}>
              {props.eventDistribution.map((event) => (
                <div key={event.eventType} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ textTransform: "capitalize" }}>{event.eventType}</span>
                    <span style={{ color: colors.secondary }}>{event.count.toLocaleString()}</span>
                  </div>
                  <div style={{
                    height: 6, borderRadius: 3, backgroundColor: colors.barBg, overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%", borderRadius: 3,
                      width: `${(event.count / maxEventCount) * 100}%`,
                      background: `linear-gradient(90deg, ${colors.accent}, #8b5cf6)`,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trends Chart */}
        {props.trends && props.trends.chartData.length > 0 && (
          <div style={{ padding: "0 20px 16px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
              📉 Engagement Trends ({props.trends.days} days)
            </h3>
            <div style={{
              borderRadius: 8, border: `1px solid ${colors.border}`, padding: 14,
              backgroundColor: colors.cardBg,
            }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.accent }}>
                    {props.trends.totalEvents.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: colors.secondary }}>Total Events</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>
                    ~{props.trends.avgDaily.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: colors.secondary }}>Daily Average</div>
                </div>
              </div>

              {/* Simple bar chart */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 80 }}>
                {props.trends.chartData.map((d, i) => (
                  <div
                    key={d.date}
                    style={{
                      flex: 1, minWidth: 2,
                      height: `${Math.max((d.count / maxChartCount) * 100, 2)}%`,
                      backgroundColor: d.count > 0 ? colors.accent : colors.barBg,
                      borderRadius: "2px 2px 0 0",
                      opacity: 0.7 + (d.count / maxChartCount) * 0.3,
                    }}
                    title={`${d.date}: ${d.count} events`}
                  />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 9, color: colors.secondary }}>
                  {props.trends.chartData[0]?.date}
                </span>
                <span style={{ fontSize: 9, color: colors.secondary }}>
                  {props.trends.chartData[props.trends.chartData.length - 1]?.date}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </McpUseProvider>
  );
}
