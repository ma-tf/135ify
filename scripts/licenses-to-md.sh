#!/usr/bin/env bash
set -euo pipefail

echo "📄 Generating NOTICE file..."
jq -n '{ prod: input, dev: input }' \
  <(pnpm licenses ls --prod --json) \
  <(pnpm licenses ls --dev --json) | jq -r '
def emit_section($heading; $data):
  ($data | to_entries | sort_by(.key)) as $groups |
  ([ $groups[] | .value | length ] | add) as $total |
  ["## \($heading) (\($total) packages)", ""] |
  . + [
    $groups[] |
    "### \(.key) (\(.value | length) packages)",
    "",
    "| Package | Version | Author | Description |",
    "|---------|---------|--------|-------------|",
    ( .value | sort_by(.name) | .[] |
      "| [\(.name)](\(.homepage // "#")) | \(.versions[0]) | \(.author // "N/A") | \(.description // "N/A") |"
    ),
    ""
  ];

["# License Report", "", "Generated from `pnpm licenses ls`.", ""] +
emit_section("Production Dependencies"; .prod) +
emit_section("Development Dependencies"; .dev)
| .[]
' > NOTICE
echo "✅ NOTICE generated."
