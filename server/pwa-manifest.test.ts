import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("manifesto da aplicação SIGA", () => {
  it("declara uma aplicação instalável com abertura independente", () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "client/public/manifest.webmanifest"), "utf-8"));

    expect(manifest.short_name).toBe("SIGA");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.icons).toHaveLength(1);
  });
});
