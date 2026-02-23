#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

script_dir="$(realpath "$(dirname "${BASH_SOURCE[0]}")")"

node "$script_dir/backend/index.ts"
