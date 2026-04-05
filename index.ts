import { MCPServer } from "mcp-use/server";
import { registerEventTools } from "./src/tools/events.js";
import { registerRewardsTools } from "./src/tools/rewards.js";
import { registerRulesTools } from "./src/tools/rules.js";
import { registerReferralTools } from "./src/tools/referrals.js";
import { registerWalletTools } from "./src/tools/wallet.js";
import { registerAnalyticsTools } from "./src/tools/analytics.js";

const server = new MCPServer({
  name: "chainloyalty",
  title: "ChainLoyalty Intelligence Platform",
  version: "1.0.0",
  description:
    "AI-powered loyalty platform management — query events, analyze rewards, debug rules, track referrals, and monitor platform analytics with interactive widgets.",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "favicon.ico",
  websiteUrl: "https://chainloyalty.com",
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"],
    },
  ],
});

// ─── Register all tool modules ──────────────────────────────────────────

// Phase 2: Core tools (Priority 1)
registerEventTools(server);       // query-events, get-event-types, count-events
registerRewardsTools(server);     // get-rewards, get-leaderboard, get-badge-owners
registerRulesTools(server);       // list-rules, evaluate-rule, get-rule-details

// Phase 3: Advanced tools (Priority 2)
registerReferralTools(server);    // get-referral-stats, lookup-code, get-top-referrers
registerWalletTools(server);      // check-wallet, get-wallet-activity, wallet-summary
registerAnalyticsTools(server);   // platform-stats, active-users, engagement-trends

// ─── Start server ───────────────────────────────────────────────────────

server.listen().then(() => {
  console.log(`✅ ChainLoyalty MCP Server running`);
  console.log(`   Inspector: http://localhost:3000/inspector`);
  console.log(`   Tools: 18 registered (6 modules)`);
  console.log(`   Widgets: 6 registered`);
});

