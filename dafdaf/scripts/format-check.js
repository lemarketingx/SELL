"use strict";

const fs = require("node:fs");
const path = require("node:path");

const roots = ["api", "js", "scripts", "test"];
const failures = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (/\.(js|json|md|html|css)$/.test(entry.name)) {
      const lines = fs.readFileSync(fullPath, "utf8").split("\n");
      lines.forEach((line, index) => {
        if (/[ \t]+$/.test(line)) failures.push(`${fullPath}:${index + 1} trailing whitespace`);
      });
    }
  }
}

roots.forEach(walk);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Formatting checks passed.");
