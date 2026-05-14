import axios from 'axios';
import db from '../db.js';
import { config } from '../config.js';

function detectTheme(url, messageText) {
  const themes = db.prepare('SELECT id, name FROM themes').all();
  for (const theme of themes) {
    if (messageText.toLowerCase().includes(theme.name.toLowerCase()) ||
        url.toLowerCase().includes(theme.name.toLowerCase().replace(/ /g, ''))) {
      return theme.id;
    }
  }
  return null;
}

function detectPlatform(url) {
  if (url.includes('zid.store') || url.includes('myzid.com')) return 'Zid';
  return 'Salla';
}

export async function importDiscordLinks() {
  if (!config.discordBotToken || config.discordChannelIds.length === 0) {
    console.log(' Discord not configured');
    return { success: false, error: 'Discord not configured' };
  }
  let allLinks = [];
  for (const channelId of config.discordChannelIds) {
    try {
      const response = await axios.get(`https://discord.com/api/v10/channels/${channelId}/messages?limit=100`, {
        headers: { Authorization: `Bot ${config.discordBotToken}` }
      });
      const messages = response.data;
      for (const msg of messages) {
        const urls = msg.content.match(/https?:\/\/[^\s]+/g) || [];
        for (const url of urls) {
          if (!url.includes('discord.com') && !url.includes('cdn.discordapp.com')) {
            const platform = detectPlatform(url);
            const themeId = detectTheme(url, msg.content);
            allLinks.push({ url, platform, themeId });
          }
        }
      }
    } catch (err) {
      console.error(`Discord error: ${err.message}`);
    }
  }
  const uniqueMap = new Map();
  for (const item of allLinks) uniqueMap.set(item.url, item);
  const unique = Array.from(uniqueMap.values());
  let newCount = 0;
  for (const item of unique) {
    const existing = db.prepare('SELECT id FROM pending_links WHERE raw_url = ?').get(item.url);
    if (!existing) {
      db.prepare(`INSERT INTO pending_links (raw_url, platform, detected_theme_name, assigned_theme_id, status) VALUES (?, ?, ?, ?, 'pending')`)
        .run(item.url, item.platform, item.themeId ? db.prepare('SELECT name FROM themes WHERE id = ?').get(item.themeId)?.name : null, item.themeId);
      newCount++;
    }
  }
  console.log(` Discord import: ${newCount} new links`);
  return { success: true, newLinks: newCount, total: unique.length };
}