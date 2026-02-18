const tmi = require('tmi.js');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node twitch-logger.js <username> <token> <channel1> [channel2...]');
  process.exit(1);
}

const [username, token, ...channels] = args;

if (channels.length === 0) {
  console.error('Error: Must specify at least one channel');
  process.exit(1);
}

// Create log files
const timestamp = Date.now();
const logFile = `twitch_chat_${timestamp}.log`;
const jsonFile = `twitch_chat_${timestamp}.jsonl`;

console.log(`📝 Text log: ${logFile}`);
console.log(`📊 JSON log: ${jsonFile}`);

const client = new tmi.Client({
  options: { debug: false },
  connection: {
    secure: true,
    reconnect: true
  },
  identity: {
    username: username,
    password: `oauth:${token.replace('oauth:', '')}`
  },
  channels: channels
});

client.connect().catch(err => {
  console.error('Failed to connect:', err);
  process.exit(1);
});

client.on('connected', () => {
  console.log(`✅ Connected to Twitch as ${username}`);
  console.log(`📺 Logging channels: ${channels.join(', ')}`);
  console.log('Press Ctrl+C to stop.\n');
});

client.on('message', (channel, userstate, message, self) => {
  if (self) return; // Skip own messages

  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 19);
  
  // Text log
  const logLine = `[${timestamp}] ${channel.slice(1)} | ${userstate['display-name']}: ${message}`;
  console.log(logLine);
  fs.appendFileSync(logFile, logLine + '\n');

  // JSON log (JSONL format - one per line)
  const jsonEntry = {
    timestamp: now.toISOString(),
    channel: channel.slice(1),
    userId: userstate['user-id'],
    username: userstate.username,
    displayName: userstate['display-name'],
    message: message,
    badges: userstate.badges || {},
    isBot: userstate['badge-info'] ? userstate['badge-info']['bot'] : false,
    isMod: userstate.mod || false,
    isVip: userstate.vip || false,
    isBroadcaster: userstate['room-id'] === userstate['user-id'],
    color: userstate.color,
    emotes: userstate.emotes || {},
    msgId: userstate['msg-id'],
    turbo: userstate.turbo || false
  };
  
  fs.appendFileSync(jsonFile, JSON.stringify(jsonEntry) + '\n');
});

client.on('disconnected', () => {
  console.log('\n❌ Disconnected from Twitch');
  console.log(`\n📊 Final stats:`);
  console.log(`   Text: ${logFile}`);
  console.log(`   JSON: ${jsonFile}`);
  process.exit(0);
});

client.on('error', (error) => {
  console.error('Error:', error);
});
