import type { Content } from "../../src/types.ts"

import { expect, test } from "vitest"
import { createOpenAIResponses } from "../../src/providers/openai-responses.ts"
import { recordFetch, sseResponse, streamReq } from "../helpers/sse.ts"

async function toolOutput(content: Content, isError = false) {
  const { fetch, recorded } = recordFetch(sseResponse([]))
  const provider = createOpenAIResponses({ apiKey: "test", fetch })
  for await (const _ of provider.stream(
    streamReq({
      model: "test",
      messages: [
        {
          role: "tool",
          content: [{ type: "tool-result", id: "read-1", name: "read", content, isError }],
        },
      ],
    })
  )) {
    // Drain the stream to capture the serialized request.
  }
  return (recorded[0].body as { input: unknown[] }).input
}

test("Responses tool results retain image and PDF attachments", async () => {
  expect(
    await toolOutput([
      { type: "text", text: "Read attachments" },
      {
        type: "image",
        mime: "image/png",
        source: { type: "url", url: "https://example.com/image.png" },
      },
      { type: "pdf", mime: "application/pdf", source: { type: "base64", data: "JVBERi0=" } },
    ])
  ).toEqual([
    {
      type: "function_call_output",
      call_id: "read-1",
      output: [
        { type: "input_text", text: "Read attachments" },
        { type: "input_image", image_url: "https://example.com/image.png" },
        {
          type: "input_file",
          filename: "document.pdf",
          file_data: "data:application/pdf;base64,JVBERi0=",
        },
      ],
    },
  ])
})

test("Responses text-only tool results preserve strings and error prefixes", async () => {
  for (const content of ["failed", [{ type: "text" as const, text: "failed" }]]) {
    expect(await toolOutput(content, true)).toEqual([
      {
        type: "function_call_output",
        call_id: "read-1",
        output: "ERROR: failed",
      },
    ])
  }
})

test("Responses attachment-bearing errors keep their error label", async () => {
  expect(
    await toolOutput(
      [
        {
          type: "image",
          mime: "image/png",
          source: { type: "url", url: "https://example.com/image.png" },
        },
      ],
      true
    )
  ).toEqual([
    {
      type: "function_call_output",
      call_id: "read-1",
      output: [
        { type: "input_text", text: "ERROR:" },
        { type: "input_image", image_url: "https://example.com/image.png" },
      ],
    },
  ])
})
