// oxlint-disable no-await-in-loop
import type { ReleaseManifest } from "./manifest.ts"
import type { Pkg } from "./utils.ts"

import { execFileSync } from "node:child_process"
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join } from "pathe"
import { exec } from "./utils.ts"

export const PACKER = "pnpm@12.3.4"

export async function pack(pkg: Pkg): Promise<{ dir: string; tarball: string }> {
  const dir = mkdtempSync(join(tmpdir(), "zaly-pack-"))
  try {
    // pnpm's native launcher installation requires lifecycle scripts that bunx skips.
    await exec(["npx", "--yes", PACKER, "pack", "--pack-destination", dir], pkg.dir)
    const tarballs = readdirSync(dir).filter((file) => file.endsWith(".tgz"))
    if (tarballs.length !== 1) throw new Error(`Expected one tarball for ${pkg.name}`)
    return { dir, tarball: join(dir, tarballs.join("")) }
  } catch (error) {
    rmSync(dir, { force: true, recursive: true })
    throw error
  }
}

export async function packRelease(pkgs: Pkg[], opts: { dir: string; root: string }): Promise<void> {
  const packages = pkgs.filter((pkg) => !pkg.json.private)
  if (packages.length === 0) throw new Error("No publishable packages matched")
  const commit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: opts.root,
    encoding: "utf8",
  }).trim()
  mkdirSync(opts.dir, { recursive: true })
  const manifest: ReleaseManifest = { commit, packages: [] }
  for (const pkg of packages) {
    if (!pkg.json.version) throw new Error(`Missing version for ${pkg.name}`)
    const { dir, tarball } = await pack(pkg)
    try {
      const file = basename(tarball)
      copyFileSync(tarball, join(opts.dir, file))
      manifest.packages.push({ name: pkg.name, tarball: file, version: pkg.json.version })
    } finally {
      rmSync(dir, { force: true, recursive: true })
    }
  }
  writeFileSync(join(opts.dir, "manifest.json"), `${JSON.stringify(manifest, undefined, 2)}\n`)
}
