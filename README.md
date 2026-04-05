# ChainLoyalty Intelligence Platform — MCP Server

AI-powered loyalty platform management server built with **mcp-use**. Query events, analyze rewards, debug rules, track referrals, and monitor platform analytics with interactive widgets.

## Quick Start

```bash
# 1. Install dependencies
npm install --ignore-scripts --force

# 2. Generate Prisma client
npx prisma generate

# 3. Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# 4. Run dev server
npx mcp-use dev
```

Inspector: [http://localhost:3000/inspector](http://localhost:3000/inspector)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Neon) |
| `MCP_URL` | ❌ | Server base URL (default: `http://localhost:3000`) |
| `NODE_ENV` | ❌ | Environment (default: `development`) |

## Tools (18 total)

### Events (3 tools)
| Tool | Description | Widget |
|------|-------------|--------|
| `query-events` | Search events by wallet/type/date | event-timeline |
| `get-event-types` | List event types with counts | — |
| `count-events` | Aggregate event counts | — |

### Rewards (3 tools)
| Tool | Description | Widget |
|------|-------------|--------|
| `get-rewards` | Full rewards overview for a wallet | rewards-dashboard |
| `get-leaderboard` | Top users by points | rewards-dashboard |
| `get-badge-owners` | Users who own a specific badge | — |

### Rules (3 tools)
| Tool | Description | Widget |
|------|-------------|--------|
| `list-rules` | Show all loyalty rules | rule-debugger |
| `evaluate-rule` | Test rule against sample event | rule-debugger |
| `get-rule-details` | Detailed rule info with triggers | — |

### Referrals (3 tools)
| Tool | Description | Widget |
|------|-------------|--------|
| `get-referral-stats` | Referral stats for a wallet | referral-analytics |
| `lookup-code` | Check referral code validity | — |
| `get-top-referrers` | Top referrers leaderboard | referral-analytics |

### Wallet (3 tools)
| Tool | Description | Widget |
|------|-------------|--------|
| `check-wallet` | Wallet existence & summary | — |
| `get-wallet-activity` | Recent activity timeline | wallet-overview |
| `wallet-summary` | Comprehensive wallet overview | wallet-overview |

### Analytics (3 tools)
| Tool | Description | Widget |
|------|-------------|--------|
| `platform-stats` | Overall platform metrics | analytics-dashboard |
| `active-users` | Active user counts by period | — |
| `engagement-trends` | Engagement over time | analytics-dashboard |

## Widgets (6)

1. **event-timeline** — Chronological event display with color-coded badges
2. **rewards-dashboard** — Points cards, badge grid, transactions, leaderboard
3. **rule-debugger** — Rule list & evaluation breakdown with pass/fail indicators
4. **referral-analytics** — Referral stats, codes, conversion funnel, top referrers
5. **wallet-overview** — Complete wallet profile with points, badges, events
6. **analytics-dashboard** — KPI cards, event distribution bars, engagement trends chart

## Project Structure

```
packages/ChainLoyalty/
├── index.ts                      # Server entry — registers all tools
├── src/
│   ├── tools/
│   │   ├── events.ts             # Event query tools
│   │   ├── rewards.ts            # Rewards & leaderboard tools
│   │   ├── rules.ts              # Rules engine & debugger tools
│   │   ├── referrals.ts          # Referral tracking tools
│   │   ├── wallet.ts             # Wallet inspection tools
│   │   └── analytics.ts          # Platform analytics tools
│   └── utils/
│       ├── prisma.ts             # Prisma client singleton
│       ├── validators.ts         # Input validation helpers
│       └── formatters.ts         # Output formatting helpers
├── resources/
│   ├── event-timeline.tsx        # Event timeline widget
│   ├── rewards-dashboard.tsx     # Rewards dashboard widget
│   ├── rule-debugger.tsx         # Rule debugger widget
│   ├── referral-analytics.tsx    # Referral analytics widget
│   ├── wallet-overview.tsx       # Wallet overview widget
│   ├── analytics-dashboard.tsx   # Analytics dashboard widget
│   └── styles.css                # Global widget styles
├── prisma/
│   └── schema.prisma             # Database schema (10 tables)
├── .env                          # Environment variables
└── package.json                  # Dependencies
```

## Deployment

### Manufact Cloud
```bash
npm run deploy
```

### ChatGPT Integration
1. Deploy to Manufact Cloud
2. Open ChatGPT Settings → Beta Features
3. Enable "ChatGPT Apps" / "MCP Integration"
4. Add server URL: `https://[deployment-id].deploy.mcp-use.com/mcp`

## Database

Uses PostgreSQL (Neon) with Prisma ORM. 10 tables:
- `Client`, `Event`, `PointsBalance`, `PointsTransaction`
- `Badge`, `BadgeOwnership`
- `Rule`, `RewardLog`
- `ReferralCode`, `Referral`, `WalletSession`
