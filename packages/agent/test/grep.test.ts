import type { Content, MetaPart, TextPart } from "@zaly/ai"

import { justText } from "@zaly/ai"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "pathe"
import { afterEach, beforeEach, expect, test } from "vitest"
import { grepTool } from "../src/tools/grep.ts"

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "zaly-grep-test-"))
})
afterEach(() => rmSync(dir, { force: true, recursive: true }))

async function search(args: Record<string, unknown>) {
  const params = await grepTool.validator.validateParams({ paths: [dir], ...args })
  return (await grepTool.call(params, {})) as (MetaPart | TextPart)[]
}

async function grep(args: Record<string, unknown>) {
  return justText((await search(args)) as Content)
}

test("exposes only the six basic search parameters", () => {
  const schema = grepTool.params as unknown as { properties: Record<string, unknown> }
  expect(Object.keys(schema.properties)).toEqual([
    "pattern",
    "paths",
    "glob",
    "fixed_strings",
    "context",
    "limit",
  ])
})

test("uses smart case", async () => {
  writeFileSync(join(dir, "source.txt"), "KeepMe\nkeepme\n")
  const insensitive = await grep({ pattern: "keepme" })
  expect(insensitive).toContain("KeepMe")
  expect(insensitive).toContain("keepme")
  const sensitive = await grep({ pattern: "KeepMe" })
  expect(sensitive).toContain("KeepMe")
  expect(sensitive).not.toContain("keepme")
})

test("supports literal patterns", async () => {
  writeFileSync(join(dir, "source.txt"), "a.b\naXb\n")
  const text = await grep({ fixed_strings: true, pattern: "a.b" })
  expect(text).toContain("a.b")
  expect(text).not.toContain("aXb")
})

test("narrows searches with positive and negative globs", async () => {
  writeFileSync(join(dir, "keep.rs"), "needle\n")
  writeFileSync(join(dir, "skip.rs"), "needle\n")
  writeFileSync(join(dir, "other.txt"), "needle\n")
  const text = await grep({ glob: ["*.rs", "!skip.rs"], pattern: "needle" })
  expect(text).toContain("keep.rs")
  expect(text).not.toContain("skip.rs")
  expect(text).not.toContain("other.txt")
})

test("returns surrounding context", async () => {
  writeFileSync(join(dir, "source.txt"), "before\nneedle\nafter\n")
  const text = await grep({ context: 1, pattern: "needle" })
  expect(text).toContain("before")
  expect(text).toContain("after")
})

test.each([false, true])(
  "preserves partial matches when a path is missing (missing first: %s)",
  async (missingFirst) => {
    const source = join(dir, "source.txt")
    const missing = join(dir, "missing")
    writeFileSync(source, "needle\n")
    const parts = await search({
      paths: missingFirst ? [missing, source] : [source, missing],
      pattern: "needle",
    })
    const text = justText(parts as Content)
    expect(text).toContain("needle")
    expect(text).toContain("source.txt")
    expect(text).toContain("Warning: Search incomplete")
    expect(text).toContain(missing)
    expect(parts.find((part) => part.type === "meta")).toMatchObject({
      data: { code: 2, incomplete: true },
      tag: "grep",
    })
  }
)

test("keeps partial-search warnings visible when matches are truncated", async () => {
  const source = join(dir, "source.txt")
  const missing = join(dir, "missing")
  writeFileSync(source, "needle\n".repeat(10))
  const parts = await search({ limit: 1, paths: [source, missing], pattern: "needle" })
  const text = justText(parts as Content)
  expect(text).toContain("needle")
  expect(text).toContain("Warning: Search incomplete")
  expect(text).toContain(missing)
  expect(parts.find((part) => part.type === "meta")).toMatchObject({
    data: { code: 2, incomplete: true, truncated: true },
  })
})

test("fails when every search path is missing", async () => {
  await expect(grep({ paths: [join(dir, "missing")], pattern: "needle" })).rejects.toMatchObject({
    code: "GREP_FAILED",
    data: { code: 2 },
  })
})

test("does not report no matches when a search path failed", async () => {
  const source = join(dir, "source.txt")
  writeFileSync(source, "unrelated\n")
  await expect(
    grep({ paths: [source, join(dir, "missing")], pattern: "needle" })
  ).rejects.toMatchObject({
    code: "GREP_FAILED",
    data: { code: 2 },
  })
})

test("rejects invalid regular expressions", async () => {
  writeFileSync(join(dir, "source.txt"), "needle\n")
  await expect(grep({ pattern: "[" })).rejects.toMatchObject({
    code: "GREP_FAILED",
    data: { code: 2 },
  })
})

test("reports an empty search without failing", async () => {
  writeFileSync(join(dir, "source.txt"), "unrelated\n")
  expect(await grep({ pattern: "needle" })).toBe("No matches found.")
})
