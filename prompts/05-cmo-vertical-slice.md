# Prompt 05 — First LUXOR9 CMO vertical slice

Implement one complete read-only research workflow before any external execution capability.

User objective example:
"Analyze the Dubai residential property market, identify competitor positioning opportunities, and prepare a launch strategy for a premium residential development."

Input schema should accept, when known: development type, location, target segment, price band, amenities, launch horizon, customer-provided documents and research constraints. Missing essential inputs should be represented as unknown or requested; do not fabricate them.

Build:
1. typed workflow input and output contracts;
2. durable LangGraph workflow with checkpointing;
3. market research adapter using approved sources;
4. competitor research adapter;
5. evidence source and evidence item records;
6. claim-to-evidence associations;
7. unsupported/conflicting/stale claim flags;
8. launch strategy assembler;
9. evaluation dataset and deterministic checks;
10. Control Tower workflow status, evidence and report views.

Keep research tools read-only. No customer outreach, ad publishing, budget spending or CRM writes. Treat retrieved page content and uploaded documents as untrusted data. Record collection time and source dates. Cite sources in output. Build tests for missing data, conflicting sources, provider outage, partial research and checkpoint resume.

Do not add all seven specialist agents as independent processes. Use a small number of well-defined task nodes and extract specialist agents only when the workflow proves the need.
