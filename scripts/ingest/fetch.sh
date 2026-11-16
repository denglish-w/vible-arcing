#!/bin/sh
# Download the 27 MACULA Greek SBLGNT lowfat book files at the pinned commit.
#
#   sh scripts/ingest/fetch.sh <dir>
#
# <dir> should be outside the repository: the XML is source input for
# ingest.py and is never committed. A URL at a commit SHA does not change, and
# re-running the ingest shows any difference in its output.
set -eu

COMMIT=8423afe47b9e8f24b7772e808af45c7159a6fe7e
BASE="https://raw.githubusercontent.com/Clear-Bible/macula-greek/$COMMIT/SBLGNT/lowfat"
FILES="01-matthew.xml 02-mark.xml 03-luke.xml 04-john.xml 05-acts.xml 06-romans.xml
07-1corinthians.xml 08-2corinthians.xml 09-galatians.xml 10-ephesians.xml
11-philippians.xml 12-colossians.xml 13-1thessalonians.xml 14-2thessalonians.xml
15-1timothy.xml 16-2timothy.xml 17-titus.xml 18-philemon.xml 19-hebrews.xml
20-james.xml 21-1peter.xml 22-2peter.xml 23-1john.xml 24-2john.xml 25-3john.xml
26-jude.xml 27-revelation.xml"

if [ "$#" -ne 1 ]; then
  echo "usage: sh scripts/ingest/fetch.sh <dir>" >&2
  exit 2
fi
dir=$1
mkdir -p "$dir"

for name in $FILES; do
  if ! curl -sSfL -o "$dir/$name" "$BASE/$name"; then
    echo "error: could not download $name" >&2
    exit 1
  fi
done

echo "downloaded 27 book files to $dir"
echo "MACULA commit: $COMMIT"
