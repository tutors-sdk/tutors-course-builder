import { runWizard } from "./wizard.js";

const args = process.argv.slice(2);
const outputDirIndex = args.indexOf("--output-dir");
const outputDir = outputDirIndex !== -1 && args[outputDirIndex + 1]
  ? args[outputDirIndex + 1]
  : process.cwd();

await runWizard(outputDir);
