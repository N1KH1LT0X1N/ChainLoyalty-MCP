import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const eventSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  eventType: z.string(),
  walletAddress: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  clientName: z.string(),
});

const propsSchema = z.object({
  events: z.array(eventSchema),
  walletAddress: z.string(),
  filters: z.object({
    eventType: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).optional(),
  totalCount: z.number(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display loyalty events in a chronological timeline with event type badges and metadata",
  props: propsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    invoking: "Searching events...",
    invoked: "Events ready",
  },
};

type Props = z.infer<typeof propsSchema>;

const EVENT_COLORS: Record<string, string> = {
  purchase: "#10b981",
  login: "#3b82f6",
  signup: "#8b5cf6",
  referral_used: "#f59e0b",
  achievement: "#ef4444",
};

function getEventColor(type: string): string {
  return EVENT_COLORS[type] ?? "#6b7280";
}

export default function EventTimeline() {
  const { props, isPending } = useWidget<Props>();
  const theme = useWidgetTheme();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <p style={{ color: "#888" }}>Loading events...</p>
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
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>📋 Event Timeline</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.secondary }}>
              {props.totalCount} event{props.totalCount !== 1 ? "s" : ""} found
              {props.walletAddress && ` for ${props.walletAddress.slice(0, 6)}...${props.walletAddress.slice(-4)}`}
            </p>
          </div>
        </div>

        {/* Events */}
        <div style={{ padding: "12px 20px" }}>
          {props.events.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: colors.secondary }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p style={{ margin: 0 }}>No events found matching your filters</p>
            </div>
          ) : (
            <div style={{ position: "relative", paddingLeft: 24 }}>
              {/* Timeline line */}
              <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: `linear-gradient(to bottom, ${colors.accent}, ${colors.border})` }} />

              {props.events.map((event, i) => (
                <div key={event.id} style={{ position: "relative", marginBottom: 12, paddingLeft: 20 }}>
                  {/* Timeline dot */}
                  <div style={{
                    position: "absolute", left: -20, top: 8,
                    width: 12, height: 12, borderRadius: "50%",
                    backgroundColor: getEventColor(event.eventType),
                    border: `2px solid ${colors.bg}`,
                    boxShadow: `0 0 0 2px ${getEventColor(event.eventType)}40`,
                  }} />

                  {/* Event Card */}
                  <div style={{
                    backgroundColor: colors.cardBg, borderRadius: 8,
                    border: `1px solid ${colors.border}`, padding: "12px 16px",
                    transition: "border-color 0.2s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: 12,
                        fontSize: 11, fontWeight: 600, letterSpacing: "0.5px",
                        backgroundColor: `${getEventColor(event.eventType)}20`,
                        color: getEventColor(event.eventType),
                        textTransform: "uppercase",
                      }}>
                        {event.eventType}
                      </span>
                      <span style={{ fontSize: 11, color: colors.secondary }}>
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: colors.secondary }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11 }}>
                        {event.walletAddress.slice(0, 6)}...{event.walletAddress.slice(-4)}
                      </span>
                      <span style={{ margin: "0 6px" }}>•</span>
                      <span>{event.clientName}</span>
                    </div>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div style={{
                        marginTop: 8, padding: "6px 10px", borderRadius: 6,
                        backgroundColor: isDark ? "#1a1a2e" : "#f3f4f6",
                        fontSize: 11, fontFamily: "monospace", color: colors.secondary,
                        whiteSpace: "pre-wrap", wordBreak: "break-all",
                      }}>
                        {JSON.stringify(event.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </McpUseProvider>
  );
}
