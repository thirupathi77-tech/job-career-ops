#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

import { loadProviders, resolveProvider } from './providers/_registry.mjs';

const ATS_HOST = /(?:[a-z0-9-]+\.)+(?:myworkdayjobs\.com|myworkdaysite\.com|oraclecloud\.com|greenhouse\.io|lever\.co|ashbyhq\.com|smartrecruiters\.com|icims\.com|successfactors\.com|phenompeople\.com|avature\.net|jibeapply\.com|jobvite\.com|recruitee\.com|teamtailor\.com|personio\.(?:de|com)|workable\.com|rippling\.com|salesforce-sites\.com|taleo\.net|hirebridge\.com|eightfold\.ai)/i;

function extractUrls(text, base) {
  const normalized = String(text || '')
    .replaceAll('\\u002F', '/')
    .replaceAll('\\/', '/')
    .replaceAll('&amp;', '&');
  const found = new Set();
  for (const match of normalized.matchAll(/https?:\/\/[^\s"'<>\\]+/gi)) {
    try {
      const url = new URL(match[0].replace(/[),.;]+$/, ''), base);
      if (ATS_HOST.test(url.hostname)) found.add(url.href);
    } catch {
      // Ignore malformed strings embedded in scripts.
    }
  }
  return [...found];
}

const config = yaml.load(readFileSync('portals.yml', 'utf8')) || {};
const providers = await loadProviders(path.resolve('providers'));
const unresolved = (config.tracked_companies || []).filter((entry) => {
  if (!entry || entry.enabled === false || !entry.careers_url) return false;
  const resolved = resolveProvider(entry, providers);
  return !resolved || resolved.error;
});

const results = [];
for (const entry of unresolved) {
  const row = { name: entry.name, source: entry.careers_url, finalUrl: '', candidates: [], error: '' };
  try {
    const response = await fetch(entry.careers_url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: { 'user-agent': 'Mozilla/5.0 career-ops ATS discovery', accept: 'text/html' },
    });
    row.finalUrl = response.url;
    const html = await response.text();
    const candidates = new Set(extractUrls(html, response.url));
    try {
      const final = new URL(response.url);
      if (ATS_HOST.test(final.hostname)) candidates.add(final.href);
    } catch {
      // The response URL should be valid, but keep one bad site isolated.
    }
    row.candidates = [...candidates];
    if (!response.ok) row.error = `HTTP ${response.status}`;
  } catch (error) {
    row.error = error instanceof Error ? error.message : String(error);
  }
  results.push(row);
}

if (process.argv.includes('--summary')) {
  for (const row of results) {
    const canonical = new Set();
    for (const raw of row.candidates) {
      let url;
      try { url = new URL(raw); } catch { continue; }
      const host = url.hostname.toLowerCase();
      if (host.endsWith('.myworkdayjobs.com')) {
        const parts = url.pathname.split('/').filter(Boolean);
        const site = parts[0]?.match(/^[a-z]{2}-[A-Z]{2}$/) ? parts[1] : parts[0];
        if (site && !['login', 'introduceYourself'].includes(site)) canonical.add(`${url.origin}/${site}`);
      } else if (host === 'wd1.myworkdaysite.com' && url.pathname.startsWith('/recruiting/')) {
        canonical.add(`${url.origin}${url.pathname.replace(/\/$/, '')}`);
      } else if (host.endsWith('.oraclecloud.com') && /\/hcmUI\/CandidateExperience\//i.test(url.pathname)) {
        canonical.add(`${url.origin}${url.pathname}`);
      } else if (host === 'boards.greenhouse.io' || host === 'job-boards.greenhouse.io') {
        const slug = url.searchParams.get('for') || url.pathname.split('/').filter(Boolean)[0];
        if (slug && slug !== 'embed') canonical.add(`https://job-boards.greenhouse.io/${slug}`);
      } else if (host.endsWith('.icims.com') && /\/jobs\//.test(url.pathname) && !/\/(?:login|dashboard)/.test(url.pathname)) {
        canonical.add(`${url.origin}/jobs/search?ss=1&in_iframe=1`);
      } else if (host === 'jobs.jobvite.com') {
        const slug = url.pathname.split('/').filter(Boolean)[0];
        if (slug && slug !== 'api') canonical.add(`${url.origin}/${slug}`);
      }
    }
    const hosts = row.candidates.map((raw) => { try { return new URL(raw).hostname.toLowerCase(); } catch { return ''; } });
    if (canonical.size === 0 && hosts.some((host) => host.endsWith('.phenompeople.com'))) {
      canonical.add(`provider:phenom ${row.source}`);
    }
    if (canonical.size === 0 && hosts.some((host) => host.endsWith('.successfactors.com'))) {
      canonical.add(`provider:successfactors ${row.source}`);
    }
    console.log(`${row.name}\t${[...canonical].join(' ; ') || '-'}\t${row.error || 'ok'}`);
  }
} else {
  console.log(JSON.stringify({ inspected: unresolved.length, results }, null, 2));
}
