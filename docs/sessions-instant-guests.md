# Sessions helper synchronization

Shared server helpers now support host-only audio muting and explicit minimal
waiting/removed admission responses. Shared invitation links use canonical
`/workspace/sessions/meeting/[id]`, preserving `source=campus`.
The Workspace-only guest flag is neither inserted nor editable through Campus.
No anonymous guest access to academic classes or existing course RLS was enabled.

Workspace implements the instant Start call handoff and device preview in the
shared meeting interface. Its guest RLS migrations apply ONLY to Workspace project
`zguejzlseldovdssiumn`; no hosted Campus changes were applied.

Existing Campus project `pftbpimhyophitfuzcxn` remains inaccessible
to the connected Supabase integration.
The response is “You do not have permission to perform this action”.
Hosted instructor/student class and published-notes acceptance remain unverified.
No replacement project or invented course records were used.

Lint, strict TypeScript, 19 unit/database tests, production build, native WebSocket
build smoke and two setup/mobile browser tests passed. Keep PR #8 and Workspace
PR #4 in draft until real media and Campus acceptance passes.
See the [Workspace guest/calling report](https://github.com/tahirmahm/syrka-workspace/blob/feature/sessions-notes/docs/sessions-instant-guests.md).

Workspace hosted Start call creation and real Qwen audio-to-notes regression passed
on application source `4384384`. Actual two-client LiveKit media remained blocked
at ICE 701 in default/relay probes, and actual account-free guest Auth returned
`anonymous_provider_disabled` (422). UI fixtures and SQL tests do not establish
physical or guest media acceptance. Campus remains a separate hosted access gate.
See linked Workspace machine-readable evidence; production remains unchanged.
