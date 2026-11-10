# Luxor Stack — branded capability map

User-visible Control Tower names (never show upstream step names in UI):

| Luxor surface | Status | Role |
|---|---|---|
| Command Bridge | Live | Streamed CMO chat + HITL |
| Luxor Stack hub | Live | Catalog of all capabilities |
| Coworker Hub / Pulse / Ember / Duo skins | Shell | Workspace skins on same AG-UI bot |
| Adaptive UI / Live UI / UI Atelier | Wired / Shell | Generative interface experiments |
| Field Research / Brief Spec / Agent Canvas | Live / Wired | CMO hierarchy + workflows |
| Sandbox AI / Bridge Demo | Live | Stub model + demo seed |
| Channel Bridge / Luxor Channels / Signal Tags / Scene Lab / Fast Model Lane | Planned | Post-MVP connectors & media |
| Orchestrator Graph | Live | Python multi-agent hierarchy |
| Luxor Kit | Live | Connectivity runtime + Tower |

## Must not rename (break dependencies)

- npm scopes `@copilotkit/*`, `@ag-ui/*`
- HTTP path `/api/copilotkit` (runtime basePath)
- Python packages `langgraph`, `ag-ui-langgraph`
- Agent id `luxor9_cmo`, path `/api/v1/agui/cmo`
- ADR filenames that document upstream mapping (`docs/adr/0005-…`)

Legacy `/copilot` redirects to `/command`.
