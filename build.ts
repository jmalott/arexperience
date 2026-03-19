import tailwind from "bun-plugin-tailwind";
import { Glob } from "bun";

const result = await Bun.build({
  entrypoints: ["./index.html"],
  outdir: "./dist",
  minify: true,
  plugins: [tailwind],
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

// Copy public/ files to dist/
const glob = new Glob("**/*");
for await (const path of glob.scan("./public")) {
  await Bun.write(`./dist/${path}`, Bun.file(`./public/${path}`));
}

console.log(`Built ${result.outputs.length} files to dist/`);
