import type { CatalogModel } from "../src/models/catalog.ts"

import { expect, test } from "vitest"
import { catalogReport } from "../scripts/models-report.ts"
import { ModelCatalog } from "../src/models/catalog.ts"

function model(id: string, context = 128_000): CatalogModel {
  return {
    id,
    name: id,
    tool_call: true,
    modalities: { input: ["text"], output: ["text"] },
    limit: { context, output: 4096 },
  }
}

async function catalog(models: CatalogModel[], opts: { url?: string; unsupported?: boolean } = {}) {
  return await ModelCatalog.load({
    example: {
      id: "example",
      name: "Example",
      npm: "@ai-sdk/openai-compatible",
      api: opts.url ?? "https://example.com",
      doc: "https://example.com/docs",
      models: Object.fromEntries(models.map((m) => [m.id, m])),
    },
    ...(opts.unsupported
      ? {
          unsupported: {
            id: "unsupported",
            name: "Unsupported",
            npm: "unsupported-adapter",
            doc: "https://example.com/docs",
            models: { ignored: model("ignored") },
          },
        }
      : {}),
  })
}

const sizes = { previous: 1000, current: 1100 }

test("adding one model does not mark its siblings or provider as changed", async () => {
  const prev = await catalog([model("existing")])
  const next = await catalog([model("existing"), model("added")], { unsupported: true })
  const report = catalogReport(prev, next, sizes)
  expect(report).toContain("**1 added · 0 removed · 0 changed**")
  expect(report).toContain("`example/added`")
  expect(report).not.toContain("Changed provider configuration")
  expect(report).not.toContain("unsupported/ignored")
  expect(report).toContain("| `unsupported-adapter` | 1 | 0 |")
})

test("model fields and provider metadata have separate readable changes", async () => {
  const prev = await catalog([model("changed"), model("removed")])
  const next = await catalog([model("changed", 256_000)], { url: "https://new.example.com" })
  const report = catalogReport(prev, next, sizes)
  expect(report).toContain("**0 added · 1 removed · 1 changed**")
  expect(report).toContain("`limit.context`: `128000` → `256000`")
  expect(report).toContain("`example/removed`")
  expect(report).toContain("Changed provider configuration (1)")
  expect(report).toContain("https://new.example.com")
  expect(report).toContain("| Adapter | Providers | Supported providers |\n|---|---:|---:|")
})

test("identical catalogs produce an explicit zero-change summary", async () => {
  const cat = await catalog([model("existing")])
  const report = catalogReport(cat, cat, sizes)
  expect(report).toContain("**0 added · 0 removed · 0 changed**")
  expect(report).toContain("1 providers · 1 models")
  expect(report).not.toContain("<details>")
})

test("large changes are truncated to keep the PR body within GitHub limits", async () => {
  const prev = await catalog([])
  const next = await catalog(Array.from({ length: 2000 }, (_, i) => model(`model-${i}`)))
  const report = catalogReport(prev, next, sizes)
  expect(report).toContain("**2000 added · 0 removed · 0 changed**")
  expect(report).toContain("entries omitted")
  expect(Buffer.byteLength(report)).toBeLessThan(60_000)
})
