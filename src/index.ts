interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * FIRST.org EPSS (Exploit Prediction Scoring System) MCP.
 *
 * EPSS gives each CVE a score 0-1 = the probability it will be exploited in the
 * wild within the next 30 days, plus a percentile (rank vs all CVEs). It
 * complements CVSS (severity): a high-CVSS bug with low EPSS may not need urgent
 * patching, while a high-EPSS one does. Keyless, public API.
 */


const BASE = 'https://api.first.org/data/v1';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'get_epss',
    description:
      'EPSS exploit-probability for one or more CVEs. Returns each CVE\'s EPSS score (0-1 = probability it will be exploited in the wild in the next 30 days) and percentile (how it ranks vs all CVEs). Use to gauge real-world exploit likelihood and prioritize patching — complements CVSS severity (a high-severity CVE with low EPSS may be lower urgency than a moderate-severity one with high EPSS).',
    inputSchema: {
      type: 'object',
      properties: {
        cve: {
          type: 'string',
          description: 'A CVE id like "CVE-2021-44228", or several comma-separated (e.g. "CVE-2021-44228,CVE-2014-0160").',
        },
      },
      required: ['cve'],
    },
  },
  {
    name: 'top_exploited',
    description:
      'List the CVEs most likely to be exploited, ranked by EPSS score descending. Answers "which vulnerabilities are most likely to be exploited right now" so you can prioritize patching. EPSS is the probability (0-1) a CVE will be exploited in the wild in the next 30 days; this complements CVSS severity rather than replacing it.',
    inputSchema: {
      type: 'object',
      properties: {
        min_score: {
          type: 'number',
          description: 'EPSS threshold 0-1; only CVEs with a score greater than this are returned. Default 0.9.',
        },
        limit: { type: 'number', description: 'Max CVEs to return (default 30, max 100).' },
      },
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_epss': {
      const cve = reqStr(args, 'cve', '"CVE-2021-44228"');
      const data = await epssGet(`/epss?cve=${encodeURIComponent(cve)}`);
      if ('error' in data) return data;
      return {
        results: (data.data || []).map((d) => ({
          cve: d.cve,
          epss_score: d.epss,
          percentile: d.percentile,
          date: d.date,
          interpretation: d.epss
            ? Number(d.epss) >= 0.5
              ? 'high exploitation likelihood'
              : Number(d.epss) >= 0.1
                ? 'moderate'
                : 'low'
            : null,
        })),
      };
    }
    case 'top_exploited': {
      const minScore = typeof args.min_score === 'number' ? args.min_score : 0.9;
      const limit = Math.min(typeof args.limit === 'number' ? args.limit : 30, 100);
      const data = await epssGet(`/epss?epss-gt=${minScore}&limit=${limit}&order=!epss`);
      if ('error' in data) return data;
      return {
        count: (data.data || []).length,
        cves: (data.data || []).map((d) => ({
          cve: d.cve,
          epss_score: d.epss,
          percentile: d.percentile,
          date: d.date,
        })),
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

interface EpssRow {
  cve: string;
  epss: string;
  percentile: string;
  date: string;
}
interface EpssOk {
  status: 'OK';
  data: EpssRow[];
  total: number;
}
interface EpssErr {
  error: string;
  message: string;
}

async function epssGet(path: string): Promise<EpssOk | EpssErr> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = undefined;
  }
  const status = (body as { status?: string } | undefined)?.status;
  if (!res.ok || status !== 'OK') {
    return { error: status ?? String(res.status), message: text.slice(0, 300) };
  }
  return body as EpssOk;
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
