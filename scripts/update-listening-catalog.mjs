import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Metadata and source links only. Audio and transcripts remain on official servers.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const feedURL = 'https://podcasts.files.bbci.co.uk/p02pc9tn.rss';
const response = await fetch(feedURL, {signal: AbortSignal.timeout(20000)});
if (!response.ok) throw new Error('BBC feed returned ' + response.status);
const xml = await response.text();
const text = value => (value || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&quot;/g, '"');
const tag = (item, name) => text(item.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)<\\/' + name + '>'))?.[1]);
const bbc = [];
for (const match of [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 8)) {
  const item = match[1], description = tag(item, 'description');
  const source = description.match(/https:\/\/www\.bbc\.co\.uk\/learningenglish\/english\/features\/6-minute-english_\d{4}\/ep-\d{6}/)?.[0];
  if (!source) continue;
  const pageResponse = await fetch(source.replace('www.bbc.co.uk', 'feeds.bbci.co.uk'), {signal: AbortSignal.timeout(20000)});
  if (!pageResponse.ok) throw new Error('BBC episode page returned ' + pageResponse.status);
  const html = await pageResponse.text();
  const audio = html.match(/https:\/\/downloads\.bbc\.co\.uk\/[^\s"<>]+_download\.mp3/)?.[0]
    || item.match(/<enclosure[^>]*url="([^"]+)/)?.[1]?.replace('http:', 'https:').replace('/proto/http/', '/proto/https/');
  const transcript = html.match(/https:\/\/downloads\.bbc\.co\.uk\/[^\s"<>]+_(?:transcript|web)\.pdf/)?.[0] || null;
  if (!audio) throw new Error('Missing official audio: ' + source);
  bbc.push({id: tag(item, 'guid').split(':').at(-1), provider: 'BBC', title: tag(item, 'title'),
    speaker: '6 Minute English', duration: Number(tag(item, 'itunes:duration')), date: new Date(tag(item, 'pubDate')).toISOString().slice(0,10), source, audio, transcript});
}
if (!bbc.length) throw new Error('No BBC episodes found');
const ted = [
  ['julian_treasure_how_to_speak_so_that_people_want_to_listen', 'How to speak so that people want to listen', 'Julian Treasure', '表达与沟通'],
  ['celeste_headlee_10_ways_to_have_a_better_conversation', '10 ways to have a better conversation', 'Celeste Headlee', '对话与倾听'],
  ['matt_walker_sleep_is_your_superpower', 'Sleep is your superpower', 'Matt Walker', '睡眠与健康'],
  ['tim_urban_inside_the_mind_of_a_master_procrastinator', 'Inside the mind of a master procrastinator', 'Tim Urban', '习惯与生活']
].map(([id,title,speaker,topic]) => ({id,provider:'TED',title,speaker,topic,source:'https://www.ted.com/talks/'+id}));
await fs.writeFile(path.join(root, 'assets/listening-catalog.json'), JSON.stringify({updatedAt: new Date().toISOString(), feedURL, episodes:[...bbc,...ted]}, null, 2) + '\n');
console.log(JSON.stringify({bbcEpisodes:bbc.length,tedTalks:ted.length,officialAudioAndDocuments:true}));
