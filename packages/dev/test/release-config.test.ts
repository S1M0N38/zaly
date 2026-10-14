import { readFileSync } from "node:fs"
import { join, relative } from "pathe"
import { expect, test } from "vitest"
import { allPkgs, workspace } from "../src/utils.ts"

type ReleaseConfig = {
  "include-component-in-tag": boolean
  packages: Record<string, { component: string; "skip-github-release"?: boolean }>
  plugins: { type: string; components: string[]; merge: boolean }[]
}

const config = JSON.parse(
  readFileSync(join(workspace, ".github/release-please-config.json"), "utf8")
) as ReleaseConfig
const manifest = JSON.parse(
  readFileSync(join(workspace, ".github/release-please-manifest.json"), "utf8")
) as Record<string, string>
const root = JSON.parse(readFileSync(join(workspace, "package.json"), "utf8")) as {
  version: string
}

async function publicPackages() {
  const packages = await allPkgs()
  return packages.filter((pkg) => !pkg.json.private)
}

test("version files match the release manifest, including the migration baseline", async () => {
  const packages = await publicPackages()
  expect(packages).toHaveLength(7)
  expect(root.version).toBe(manifest["."])
  for (const pkg of packages) {
    expect(pkg.json.version).toBe(manifest[relative(workspace, pkg.dir)])
  }
})

test("linked versions includes the named root and every public package", async () => {
  const packages = await publicPackages()
  const paths = [".", ...packages.map((pkg) => relative(workspace, pkg.dir))].toSorted()
  expect(Object.keys(config.packages).toSorted()).toEqual(paths)
  expect(Object.keys(manifest).toSorted()).toEqual(paths)
  expect(config.packages["."].component).toBe("zaly")
  expect(config["include-component-in-tag"]).toBe(true)
  expect(config.plugins).toHaveLength(1)
  expect(config.plugins[0].type).toBe("linked-versions")
  expect(config.plugins[0].merge).toBe(false)
  expect(config.plugins[0].components.toSorted()).toEqual(
    Object.values(config.packages)
      .map((pkg) => pkg.component)
      .toSorted()
  )
})

test("only the root creates a GitHub release", () => {
  const releasedPaths = Object.entries(config.packages)
    .filter(([, pkg]) => !pkg["skip-github-release"])
    .map(([path]) => path)
  expect(releasedPaths).toEqual(["."])
})
