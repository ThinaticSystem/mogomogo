#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

script_dir="$(realpath "$(dirname "${BASH_SOURCE[0]}")")"

# Execute custom post-create script
if [ -f "$script_dir/post-create-custom.sh" ]; then
	# shellcheck disable=SC1091
	. "$script_dir/post-create-custom.sh"
fi
