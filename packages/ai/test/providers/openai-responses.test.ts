import { describe, expect, test } from "vitest"
import { createOpenAIResponses } from "../../src/providers/openai-responses.ts"
import { recordFetch, sseResponse, streamReq } from "../helpers/sse.ts"

// ── Session headers ──────────────────────────────────────────────────────
// OpenCode Go requires `x-opencode-session` (plus a client user agent)
// on every request — its Responses-endpoint models reject session-less
// requests with `MissingSessionID`. Tmp fix: always send when the
// caller provides a session id.

describe("openai-responses: session headers", () => {
  test("sends x-opencode-session and zaly user agent when sessionId is set", async () => {
    const { fetch, recorded } = recordFetch(sseResponse([completed()]))
    const provider = createOpenAIResponses({ apiKey: "test", fetch })
    await drain(
      provider.stream(
        streamReq({
          messages: [{ content: "hi", role: "user" }],
          model: "muse-spark-1.3-contributor",
          sessionId: "ses_123",
        })
      )
    )

    expect(recorded).toHaveLength(1)
    expect(recorded[0].headers["x-opencode-session"]).toBe("ses_123")
    expect(recorded[0].headers["user-agent"]).toMatch(/^zaly \(/)
  })

  test("omits x-opencode-session when no sessionId is set", async () => {
    const { fetch, recorded } = recordFetch(sseResponse([completed()]))
    const provider = createOpenAIResponses({ apiKey: "test", fetch })
    await drain(
      provider.stream(
        streamReq({
          messages: [{ content: "hi", role: "user" }],
          model: "muse-spark-1.3-contributor",
        })
      )
    )

    expect(recorded).toHaveLength(1)
    expect(recorded[0].headers["x-opencode-session"]).toBeUndefined()
    expect(recorded[0].headers["user-agent"]).toMatch(/^zaly \(/)
  })
})

// ── helpers ──────────────────────────────────────────────────────────────

async function drain<T>(stream: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = []
  for await (const ev of stream) out.push(ev)
  return out
}

function completed() {
  return { response: { status: "completed" }, type: "response.completed" }
}
