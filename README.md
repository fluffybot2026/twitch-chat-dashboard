# 📺 Twitch Chat Dashboard

Real-time Twitch chat logger with automatic topic clustering and analysis. Captures messages, analyzes themes (memes, strategy, community), and generates interactive dashboards.

## Features

✅ **Live Chat Logging** — Capture Twitch chat from specific channels in real-time  
✅ **Dual Output** — Text log (.log) + JSON log (.jsonl) for easy parsing  
✅ **Topic Clustering** — Automatically categorizes messages:
  - Gameplay Strategy (positioning, economy, mechanics)
  - Memes/Spam (emotes, jokes, spam)
  - Shoutouts/Community (mentions, appreciation)
  - Neutral/Chat (general messages)

✅ **Interactive Dashboard** — Visual topic distribution, message timeline, user stats  
✅ **No Database Required** — Works entirely with JSONL + HTML

## Quick Start

### 1. Get a Twitch OAuth Token
Go to [TwitchTokenGenerator](https://twitchtokengenerator.com/) and generate a token with `chat:read` scope.

### 2. Install Dependencies
```bash
npm install tmi.js
```

### 3. Run the Logger
```bash
node twitch-logger.js YOUR_BOT_NAME YOUR_OAUTH_TOKEN channel1 channel2 channel3
```

Example:
```bash
node twitch-logger.js mybot oauth:jkws2wemjz82xy37vqn725eh9u17tf valorant_emea2 valorantesports
```

### 4. Generate Dashboard
The logger creates `.jsonl` files automatically. To build an HTML dashboard:
```bash
node build-dashboard.js
```

Output: `dashboard.html` (open in any browser)

## Output Files

- **`twitch_chat_TIMESTAMP.log`** — Human-readable text log
- **`twitch_chat_TIMESTAMP.jsonl`** — Machine-readable JSON log (one object per line)

### JSON Schema
```json
{
  "timestamp": "2026-02-18T18:51:43.912Z",
  "channel": "valorant_emea2",
  "userId": "107678043",
  "username": "frodi131",
  "displayName": "Frodi131",
  "message": "message text here",
  "badges": { "predictions": "pink-2" },
  "isMod": false,
  "isVip": false,
  "isBroadcaster": false,
  "color": "#8A2BE2",
  "emotes": { "emotesv2_dcd06b30a5c24f6eb871e8f5edbd44f7": ["5-13"] },
  "turbo": false
}
```

## Advanced Usage

### Filter by Topic
```bash
jq 'select(.message | contains("positioning"))' twitch_chat_*.jsonl
```

### Export to CSV
```bash
jq -r '[.timestamp, .displayName, .message] | @csv' twitch_chat_*.jsonl > chat.csv
```

### Find MODs
```bash
jq 'select(.isMod == true)' twitch_chat_*.jsonl
```

### Count messages per user
```bash
jq -r '.displayName' twitch_chat_*.jsonl | sort | uniq -c | sort -rn
```

## Architecture

```
twitch-logger.js
  ├─ Connects to Twitch IRC
  ├─ Captures PrivateMessage events
  └─ Writes to .log + .jsonl files

build-dashboard.js
  ├─ Reads .jsonl file
  ├─ Classifies messages by topic (keyword matching)
  ├─ Generates HTML dashboard
  └─ Outputs dashboard.html
```

## Customization

### Add Custom Topics
Edit `build-dashboard.js`:
```javascript
const topics = {
  'Your Topic': {
    keywords: ['word1', 'word2', 'word3'],
    color: '#FF6B6B'
  }
};
```

### Change Colors
Each topic has a hex color. Modify the `color` field in the topics object.

### Adjust Message Display
Edit the HTML generation section in `build-dashboard.js` to customize the dashboard layout.

## Security

⚠️ **Your OAuth token is sensitive** — treat it like a password:
- Don't commit to version control
- Regenerate after testing
- Use environment variables in production

```bash
# Option: Use env vars
node twitch-logger.js mybot $TWITCH_TOKEN valorant_emea2
```

## Requirements

- Node.js 14+
- `tmi.js` package (npm install tmi.js)

## License

MIT

## Support

For issues or questions, open a GitHub issue or reach out on Discord.

---

**Made with ❤️ for Valorant chat analysis**
