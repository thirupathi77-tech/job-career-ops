const ROLE_SYNONYMS: Array<{ test: RegExp; extra: string[] }> = [
  { test: /\b(ai|ml|machine learning|llm|llmops|agentic|genai|generative ai)\b/i, extra: ["artificial intelligence", "machine learning", "llm", "llmops", "genai", "ai engineer", "ml engineer"] },
  { test: /\b(data|analytics|bi|business intelligence|etl|pipeline)\b/i, extra: ["data engineer", "analytics engineer", "data platform", "analytics", "etl", "bi engineer"] },
  { test: /\b(platform|infrastructure|cloud|devops|sre|observability)\b/i, extra: ["platform engineer", "cloud engineer", "devops engineer", "sre", "infrastructure"] },
  { test: /\b(product|pm|technical product)\b/i, extra: ["product manager", "technical product manager", "program manager"] },
  { test: /\b(automation|workflow|agent|orchestration)\b/i, extra: ["automation engineer", "workflow engineer", "systems engineer"] },
  { test: /\b(full stack|fullstack|backend|frontend|frontend engineer|backend engineer)\b/i, extra: ["software engineer", "full stack engineer", "backend engineer", "frontend engineer"] },
  { test: /\b(solutions architect|solution architect|customer engineer|forward deployed|fd e)\b/i, extra: ["solutions architect", "forward deployed engineer", "customer engineer"] },
  { test: /\b(research|applied research|research engineer)\b/i, extra: ["research engineer", "applied scientist", "research scientist"] },
];

function normalizeRole(role: string): string {
  return role.trim().replace(/\s+/g, " ");
}

export function expandTargetRoles(roles: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of roles) {
    const role = normalizeRole(raw);
    if (!role) continue;
    const lower = role.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      out.push(role);
    }

    for (const rule of ROLE_SYNONYMS) {
      if (!rule.test.test(lower)) continue;
      for (const extra of rule.extra) {
        const key = extra.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(extra);
      }
    }
  }

  return out.slice(0, 24);
}
