import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const sourceRoot = join(process.cwd(), "src");
const checkedExtensions = new Set([".ts", ".tsx", ".mts"]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(path) : [path];
    }),
  );
  return nested.flat().filter((path) => checkedExtensions.has(extname(path)));
}

const files = await collectFiles(sourceRoot);
const violations = [];
const forbiddenDomainImports = [
  "react",
  "next/",
  "three",
  "@react-three/",
  "@supabase/",
];

for (const file of files) {
  const normalized = relative(process.cwd(), file).replaceAll("\\", "/");
  const source = await readFile(file, "utf8");

  if (normalized.startsWith("src/domain/")) {
    for (const forbidden of forbiddenDomainImports) {
      if (
        source.includes(`from \"${forbidden}`) ||
        source.includes(`from '${forbidden}`)
      ) {
        violations.push(
          `${normalized}: domain imports forbidden dependency ${forbidden}`,
        );
      }
    }
    if (/\b(Date\.now|Math\.random)\s*\(/u.test(source)) {
      violations.push(`${normalized}: domain reads ambient time or randomness`);
    }
  }

  if (source.includes('"use client"') || source.includes("'use client'")) {
    if (
      /from\s+["']@\/(server|persistence|projection\/private)/u.test(source)
    ) {
      violations.push(`${normalized}: client imports a private/server module`);
    }
  }
}

if (violations.length > 0) {
  console.error("Dependency boundary violations:\n" + violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Dependency boundaries OK (${files.length} source files checked).`,
  );
}
