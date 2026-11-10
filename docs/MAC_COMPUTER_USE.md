# Use your Mac with the agent (optional, thin)

For iOS builds and desktop control, run work **on your Mac** — not this Linux cloud VM.

## Best lightweight computer-use (macOS)

**[hands-mcp](https://github.com/yuvitbatra/hands-mcp)** — macOS MCP with deny-lists, audit log, kill switch.

Install only on your Mac when you explicitly want GUI control. Prefer org-managed MCP (e.g. Runlayer) if available; otherwise treat third-party MCP as a local opt-in.

## Best path for Flutter iOS without GUI MCP

Run a **Cursor self-hosted / local agent on the Mac** that has Xcode. Point it at this `luxor9` repo and run:

```bash
cd apps/mobile && flutter run -d ios
```

That is thinner and safer than giving a cloud agent full desktop control.
