const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Topic classification keywords
const topics = {
  'Gameplay Strategy': {
    keywords: ['positioning', 'economy', 'site', 'rotate', 'push', 'hold', 'execute', 'stack', 'fakes', 'strats', 'play', 'mechanical', 'insane', 'hack', 'upload', 'giantx'],
    color: '#FF6B6B'
  },
  'Memes/Spam': {
    keywords: ['lul', 'omega', 'kekw', 'pogU', 'dinodance', 'btw', 'easy', 'worst', 'spam', 'bad', 'gg'],
    color: '#4ECDC4'
  },
  'Shoutouts/Community': {
    keywords: ['go', 'love', 'thanks', 'respect', 'lets', 'wanna', 'see', 'hey'],
    color: '#FFE66D'
  },
  'Neutral/Chat': {
    keywords: [],
    color: '#95E1D3'
  }
};

async function analyzeChat(inputFile) {
  const messages = [];
  const topicCounts = {};
  const users = new Set();
  
  Object.keys(topics).forEach(t => {
    topicCounts[t] = 0;
  });

  const fileStream = fs.createReadStream(inputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    
    try {
      const msg = JSON.parse(line);
      users.add(msg.username);
      
      // Classify message
      let topic = 'Neutral/Chat';
      const msgLower = msg.message.toLowerCase();
      
      for (const [t, data] of Object.entries(topics)) {
        if (t !== 'Neutral/Chat' && data.keywords.some(kw => msgLower.includes(kw))) {
          topic = t;
          break;
        }
      }
      
      topicCounts[topic]++;
      messages.push({
        timestamp: msg.timestamp,
        username: msg.displayName || msg.username,
        message: msg.message,
        topic: topic,
        isMod: msg.isMod,
        isVip: msg.isVip
      });
    } catch (e) {
      // Skip invalid lines
    }
  }

  return { messages, topicCounts, userCount: users.size };
}

async function generateDashboard() {
  const jsonlFile = fs.readdirSync('/Users/Fluffy/twitch-chat-dashboard')
    .filter(f => f.startsWith('twitch_chat_') && f.endsWith('.jsonl'))
    .sort()
    .pop();
  
  if (!jsonlFile) {
    console.error('No JSONL file found');
    process.exit(1);
  }

  const fullPath = path.join('/Users/Fluffy/twitch-chat-dashboard', jsonlFile);
  const { messages, topicCounts, userCount } = await analyzeChat(fullPath);
  
  const topicColors = {};
  Object.keys(topics).forEach(t => {
    topicColors[t] = topics[t].color;
  });

  // Generate topic items HTML
  let topicItemsHTML = '<div class="topic-item" style="opacity: 0.6"><div class="topic-name">Topic</div><div class="topic-bar"></div><div class="topic-count">Count</div></div>';
  
  Object.entries(topicCounts).forEach(([topic, count]) => {
    const max = Math.max(...Object.values(topicCounts));
    const percentage = max > 0 ? (count / max) * 100 : 0;
    const barFill = percentage > 10 ? Math.round(percentage) + '%' : '';
    topicItemsHTML += `
        <div class="topic-item">
          <div class="topic-name">${topic}</div>
          <div class="topic-bar">
            <div class="topic-bar-fill" style="width: ${percentage}%; background-color: ${topicColors[topic]}">
              ${barFill}
            </div>
          </div>
          <div class="topic-count">${count}</div>
        </div>`;
  });

  // Generate messages HTML - most recent first
  let messagesHTML = '';
  messages.slice().reverse().forEach(msg => {
    const modBadge = msg.isMod ? '<span class="badge badge-mod">MOD</span>' : '';
    const vipBadge = msg.isVip ? '<span class="badge badge-vip">VIP</span>' : '';
    const time = new Date(msg.timestamp).toLocaleTimeString();
    messagesHTML += `
          <div class="message-item" style="border-left-color: ${topicColors[msg.topic]}">
            <div class="message-header">
              <span class="message-user">
                ${msg.username}
                ${modBadge}
                ${vipBadge}
              </span>
              <span class="message-topic" style="background-color: ${topicColors[msg.topic]}">${msg.topic}</span>
            </div>
            <div class="message-text">"${msg.message}"</div>
            <div class="message-time">${time}</div>
          </div>`;
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Twitch Chat Dashboard - valorant_emea2 LIVE</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    header {
      background: rgba(255, 255, 255, 0.95);
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    .subtitle {
      color: #666;
      font-size: 1.1em;
    }
    .live-badge {
      display: inline-block;
      background: #FF6B6B;
      color: white;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.8em;
      font-weight: 600;
      margin-left: 10px;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-number {
      font-size: 2.5em;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 0.9em;
      opacity: 0.9;
    }
    .content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: white;
      border-radius: 10px;
      padding: 25px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    .card h2 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.5em;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    .topic-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .topic-item:last-child {
      border-bottom: none;
    }
    .topic-name {
      font-weight: 600;
      color: #333;
      flex: 1;
    }
    .topic-bar {
      flex: 2;
      height: 30px;
      background: #f0f0f0;
      border-radius: 15px;
      margin: 0 15px;
      overflow: hidden;
    }
    .topic-bar-fill {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 10px;
      color: white;
      font-weight: 600;
      font-size: 0.9em;
    }
    .topic-count {
      min-width: 40px;
      text-align: right;
      font-weight: 600;
      color: #667eea;
    }
    .messages {
      max-height: 600px;
      overflow-y: auto;
    }
    .message-item {
      padding: 12px;
      margin-bottom: 10px;
      border-left: 4px solid #ddd;
      border-radius: 4px;
      background: #f9f9f9;
      font-size: 0.95em;
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
    }
    .message-user {
      font-weight: 600;
      color: #333;
    }
    .message-topic {
      font-size: 0.8em;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      color: white;
    }
    .message-text {
      color: #555;
      margin-bottom: 5px;
      word-wrap: break-word;
    }
    .message-time {
      font-size: 0.8em;
      color: #999;
    }
    .badge {
      display: inline-block;
      font-size: 0.7em;
      padding: 2px 6px;
      border-radius: 3px;
      margin-left: 5px;
      font-weight: 600;
    }
    .badge-mod {
      background: #FF6B6B;
      color: white;
    }
    .badge-vip {
      background: #FFD93D;
      color: #333;
    }
    .refresh-info {
      text-align: center;
      color: #666;
      font-size: 0.9em;
      margin-top: 20px;
      padding: 15px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 5px;
    }
    @media (max-width: 1024px) {
      .content {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📺 Twitch Chat Dashboard <span class="live-badge">● LIVE</span></h1>
      <p class="subtitle">valorant_emea2 | Topic Clustering & Real-Time Analysis</p>
      <div class="stats">
        <div class="stat-card">
          <div class="stat-number">${messages.length}</div>
          <div class="stat-label">Messages Captured</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${userCount}</div>
          <div class="stat-label">Unique Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${Object.keys(topicCounts).filter(t => topicCounts[t] > 0).length}</div>
          <div class="stat-label">Topics Detected</div>
        </div>
      </div>
    </header>

    <div class="content">
      <div class="card">
        <h2>📊 Message Distribution by Topic</h2>
        ${topicItemsHTML}
      </div>

      <div class="card">
        <h2>💬 Live Messages (Latest First)</h2>
        <div class="messages">
          ${messagesHTML}
        </div>
      </div>
    </div>

    <div class="refresh-info">
      ⚙️ Auto-refresh the page to see new messages • Logging to <code>twitch_chat_${jsonlFile.replace('twitch_chat_', '').replace('.jsonl', '')}.jsonl</code>
    </div>
  </div>
  <script>
    // Auto-refresh every 30 seconds
    setTimeout(() => location.reload(), 30000);
  </script>
</body>
</html>`;

  fs.writeFileSync('/Users/Fluffy/twitch-chat-dashboard/live-dashboard.html', html);
  console.log('✅ Live dashboard created: live-dashboard.html');
  console.log(`📊 Analyzed ${messages.length} messages from ${userCount} users`);
  console.log('Topics:', topicCounts);
}

generateDashboard().catch(console.error);
