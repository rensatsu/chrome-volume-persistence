#/bin/bash
set -o errexit
set -o pipefail
set -o nounset

NAME="chrome-volume-persistence.zip"

rm $NAME 2>/dev/null || true
(cd src && zip -r ../$NAME .)
