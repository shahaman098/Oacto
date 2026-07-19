import { readFileSync, writeFileSync } from "node:fs";

const [templatePath, outputPath] = process.argv.slice(2);

if (!templatePath || !outputPath) {
  console.error("Usage: node scripts/render-do-spec.mjs <template> <output>");
  process.exit(1);
}

const template = readFileSync(templatePath, "utf8").trimEnd();

const secretKeys = [
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_AGENT_ID",
  "OPENAI_API_KEY",
  "TAVILY_API_KEY",
  "DEEPSEEK_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM_NUMBER",
].filter((key) => Boolean(process.env[key]?.trim()));

const secretEnvYaml = secretKeys
  .map((key) => [
    `      - key: ${key}`,
    `        value: ${yamlString(process.env[key])}`,
    "        scope: RUN_TIME",
    "        type: SECRET",
  ].join("\n"))
  .join("\n");

const rendered = secretEnvYaml ? `${template}\n${secretEnvYaml}\n` : `${template}\n`;

writeFileSync(outputPath, rendered, { mode: 0o600 });

function yamlString(value) {
  return JSON.stringify(String(value ?? ""));
}
