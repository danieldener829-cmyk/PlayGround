#!/usr/bin/env bash
# ZapHost — startup.sh (pré-requisitos executados uma vez por worker)
set -euo pipefail
/usr/bin/time -p node --version
/usr/bin/time -p python3 --version
/usr/bin/time -p unzip -v | head -n 1
