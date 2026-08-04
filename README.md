# mcp-epss

FIRST.org EPSS (Exploit Prediction Scoring System) MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_epss` | EPSS exploit-probability for one or more CVEs. Returns each CVE's EPSS score (0-1 = probability it will be exploited in the wild in the next 30 days) and percentile (how it ranks vs all CVEs). Use to gauge real-world exploit likelihood and prioritize patching — complements CVSS severity (a high-severity CVE with low EPSS may be lower urgency than a moderate-severity one with high EPSS). |
| `top_exploited` | List the CVEs most likely to be exploited, ranked by EPSS score descending. Answers "which vulnerabilities are most likely to be exploited right now" so you can prioritize patching. EPSS is the probability (0-1) a CVE will be exploited in the wild in the next 30 days; this complements CVSS severity rather than replacing it. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "epss": {
      "url": "https://gateway.pipeworx.io/epss/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Epss data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
