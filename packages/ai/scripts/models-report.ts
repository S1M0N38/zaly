import type { ModelCatalog } from "../src/models/catalog.ts"

import { formatSize } from "@zaly/shared"
import { isDeepStrictEqual } from "node:util"

type Change = { id: string; fields: string[] }
const MAX_ROWS = 80

function code(value: string): string {
  if (value.length > 160) value = `${value.slice(0, 157)}…`
  return `\`${value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("`", "&#96;")
    .replaceAll("|", String.raw`\|`)
    .replaceAll("\n", " ")}\``
}

function display(value: unknown): string {
  if (value === undefined) return "—"
  const text = JSON.stringify(value)
  return code(text.length > 100 ? `${text.slice(0, 97)}…` : text)
}

function fields(left: unknown, right: unknown, path = ""): string[] {
  if (isDeepStrictEqual(left, right)) return []
  if (
    left &&
    right &&
    typeof left === "object" &&
    typeof right === "object" &&
    !Array.isArray(left) &&
    !Array.isArray(right)
  ) {
    const l = left as Record<string, unknown>
    const r = right as Record<string, unknown>
    return [...new Set([...Object.keys(l), ...Object.keys(r)])]
      .toSorted()
      .flatMap((key) => fields(l[key], r[key], path ? `${path}.${key}` : key))
  }
  return [`${code(path)}: ${display(left)} → ${display(right)}`]
}

function models(catalog: ModelCatalog): Map<string, unknown> {
  const ret = new Map<string, unknown>()
  for (const [pid, provider] of Object.entries(catalog.$)) {
    if (!provider || !catalog.provider(pid)) continue
    for (const [mid, model] of Object.entries(provider.models)) ret.set(`${pid}/${mid}`, model)
  }
  return ret
}

function diff(left: Map<string, unknown>, right: Map<string, unknown>) {
  const added: string[] = []
  const removed: string[] = []
  const changed: Change[] = []
  for (const id of [...new Set([...left.keys(), ...right.keys()])].toSorted()) {
    if (!left.has(id)) added.push(id)
    else if (!right.has(id)) removed.push(id)
    else {
      const changes = fields(left.get(id), right.get(id))
      if (changes.length) changed.push({ id, fields: changes })
    }
  }
  return { added, changed, removed }
}

function details(title: string, rows: string[], table = false): string {
  if (!rows.length) return ""
  const shown: string[] = []
  let size = 0
  for (const row of rows) {
    size += Buffer.byteLength(row)
    if (shown.length >= MAX_ROWS || size > (table ? 14_000 : 3000)) break
    shown.push(row)
  }
  const extra =
    rows.length > shown.length
      ? `\n\n_${rows.length - shown.length} more entries omitted; see the catalog diff._`
      : ""
  return `\n<details>\n<summary>${title} (${rows.length})</summary>\n\n${table ? "| Entry | Changes |\n|---|---|\n" : ""}${shown.join("\n")}${extra}\n\n</details>\n`
}

function metadata(catalog: ModelCatalog): Map<string, unknown> {
  const ret = new Map<string, unknown>()
  for (const [id, provider] of Object.entries(catalog.$)) {
    if (!provider || !catalog.provider(id)) continue
    const { models: _, ...info } = provider
    ret.set(id, info)
  }
  return ret
}

function changeRows(items: Change[]): string[] {
  return items.map(
    ({ id, fields: changes }) =>
      `| ${code(id)} | ${changes.slice(0, 6).join("; ")}${changes.length > 6 ? `; +${changes.length - 6} other fields` : ""} |`
  )
}

export function catalogReport(
  prev: ModelCatalog,
  next: ModelCatalog,
  sizes: { previous: number; current: number }
): string {
  const changes = diff(models(prev), models(next))
  const providers = diff(metadata(prev), metadata(next))
  const adapters = new Map<string, { total: number; supported: number }>()
  for (const [id, provider] of Object.entries(next.$)) {
    if (!provider) continue
    const counts = adapters.get(provider.npm) ?? { total: 0, supported: 0 }
    counts.total++
    if (next.provider(id)) counts.supported++
    adapters.set(provider.npm, counts)
  }
  const delta = sizes.current - sizes.previous
  const providerCount = Object.keys(next.$).filter((id) => next.provider(id)).length
  return `${[
    "## Catalog changes",
    "",
    `**${changes.added.length} added · ${changes.removed.length} removed · ${changes.changed.length} changed**`,
    details(
      "Added models",
      changes.added.map((id) => `- ${code(id)}`)
    ),
    details(
      "Removed models",
      changes.removed.map((id) => `- ${code(id)}`)
    ),
    details("Changed models", changeRows(changes.changed), true),
    details(
      "Added providers",
      providers.added.map((id) => `- ${code(id)}`)
    ),
    details(
      "Removed providers",
      providers.removed.map((id) => `- ${code(id)}`)
    ),
    details("Changed provider configuration", changeRows(providers.changed), true),
    "## Adapter coverage",
    "",
    "| Adapter | Providers | Supported providers |",
    "|---|---:|---:|",
    ...[...adapters]
      .toSorted(([a], [b]) => a.localeCompare(b))
      .slice(0, MAX_ROWS)
      .map(([adapter, counts]) => `| ${code(adapter)} | ${counts.total} | ${counts.supported} |`),
    "",
    `Bundled catalog: **${providerCount} providers · ${models(next).size} models · ${formatSize(sizes.current)}** (${delta >= 0 ? "+" : "−"}${formatSize(Math.abs(delta))}).`,
    "",
    "This PR is refreshed every 6 hours against main's bundled snapshot. Review and squash-merge when useful. Releases use the checked-in catalog; publishing never fetches a new one.",
    "",
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")}\n`
}
