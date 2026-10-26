/* Module 7: Shell Scripting */
window.COURSE_MODULES.push({
  id: "scripting",
  title: "Shell Scripting",
  icon: "📜",
  sum: "Turn your command line knowledge into reusable scripts with variables, control flow and honest error handling.",
  lessons: [
    {
      id: "script-basics",
      title: "Your first bash script",
      min: 10,
      sum: "Shebangs, variables, quoting and exit codes — the anatomy every good script shares.",
      blocks: [
        { t: "p", x: "The moment you type the same three commands twice, a script starts paying for itself. Bash is already installed on every server — no runtime to deploy, no excuses." },
        { t: "h", x: "A small, complete example" },
        { t: "code", lang: "bash", title: "backup-notes.sh", x: "#!/usr/bin/env bash\nset -euo pipefail        # stop on errors, unset vars, failing pipes\n\nNAME=\"demo\"\nTARGET=\"/srv/app\"\nTODAY=$(date +%F)\n\necho \"Backing up $TARGET\"\ntar -czf \"/tmp/$NAME-$TODAY.tar.gz\" \"$TARGET\"\necho \"Done: /tmp/$NAME-$TODAY.tar.gz\"" },
        { t: "h", x: "Make it runnable" },
        { t: "code", lang: "bash", x: "chmod +x backup-notes.sh   # sets the execute bit\n./backup-notes.sh          # run it\nbash backup-notes.sh       # or run without the bit\nbash -x backup-notes.sh    # trace each command as it runs (debugging)" },
        { t: "h", x: "Variables and quoting" },
        { t: "code", lang: "bash", x: "NAME='web-01'          # no spaces around the equals sign!\necho \"Hello $NAME\"     # double quotes: variable expands\necho 'Hello $NAME'     # single quotes: literal text\necho \"${NAME}_bak\"     # braces mark where the name ends\n\necho \"script: $0 · first arg: $1 · all args: $@ · count: $#\"\nreadonly LOG_DIR=/var/log" },
        { t: "h", x: "The safety header: set -euo pipefail" },
        { t: "ul", x: [
          "`set -e` — exit immediately when a command fails.",
          "`set -u` — treat undefined variables as errors (typos stop the script instead of silently doing nothing).",
          "`set -o pipefail` — a pipeline fails if **any** stage fails, not just the last one.",
          "Exit codes: `0` = success, non-zero = failure. Cron, CI and other scripts read these — end honestly."
        ] },
        { t: "tip", x: "Prefer `#!/usr/bin/env bash` over `#!/bin/bash`: the script then uses whichever bash is first on the PATH, which keeps it portable to BSD and macOS machines." },
        { t: "warn", x: "Never `eval` input you did not construct, and always quote variables: `rm -rf \"$DIR\"/` with an empty `DIR` is the classic disaster. `set -u` exists precisely for this." }
      ],
      quiz: [
        { q: "What does the `set -euo pipefail` line protect you from?", opts: ["Slow scripts", "Continuing after failures, undefined variables, and hidden pipeline errors", "Missing packages", "Permission errors, automatically fixing them"], a: 1, why: "It is the three-part seatbelt of bash: fail fast, catch typos, and don't let a pipeline hide a failing stage." },
        { q: "How does a script signal failure to whatever called it?", opts: ["Printing an error to the screen", "Exiting with a non-zero code", "Writing to a log file", "Sending a signal with kill"], a: 1, why: "The exit code is the contract. `exit 1` (or any non-zero) makes `&&` chains, cron and CI treat the run as failed." }
      ]
    },
    {
      id: "control-flow",
      title: "Conditions, loops and functions",
      min: 10,
      sum: "Make scripts think: if/else, case, loops, functions and the trap that cleans up after you.",
      blocks: [
        { t: "p", x: "Scripts become programs when they can make decisions and repeat work. That is all control flow is: conditions, loops, and a little tidying up afterwards." },
        { t: "h", x: "Conditions" },
        { t: "code", lang: "bash", x: "if [ ! -d \"$TARGET\" ]; then\n  echo \"missing: $TARGET\" >&2\n  exit 1\nfi\n\nif grep -q 'ERROR' \"$LOG\"; then\n  echo 'errors found in the log'\nelse\n  echo 'all clean'\nfi" },
        { t: "ul", x: [
          "File tests: `-f` exists and is a file · `-d` directory · `-z` string empty · `-n` string not empty.",
          "Comparisons: `[ \"$a\" = \"$b\" ]` strings · `[ \"$n\" -gt 5 ]` numbers (`-gt -lt -ge -le -eq -ne`).",
          "Combine tests with separate brackets: `[ -f \"$f\" ] && [ -r \"$f\" ]` — not `-a` inside one bracket."
        ] },
        { t: "h", x: "Loops" },
        { t: "code", lang: "bash", x: "for site in /var/www/*; do\n  echo \"site: $site ($(du -sh \"$site\" | cut -f1))\"\ndone\n\nwhile read -r host; do\n  echo \"checking $host\"\ndone < server-list.txt\n\nfor i in 1 2 3; do echo \"attempt $i\"; done" },
        { t: "h", x: "case: multi-way decisions" },
        { t: "code", lang: "bash", x: "case \"$1\" in\n  start)   systemctl start myapp ;;\n  stop)    systemctl stop myapp ;;\n  restart) systemctl restart myapp ;;\n  *)       echo \"usage: $0 {start|stop|restart}\" >&2; exit 2 ;;\nesac" },
        { t: "h", x: "Functions and traps" },
        { t: "code", lang: "bash", x: "log() { echo \"[$(date '+%F %T')] $*\"; }\n\nTMP=$(mktemp)\ncleanup() { rm -f \"$TMP\"; }\ntrap cleanup EXIT     # runs on success, failure, or Ctrl+C\n\nlog 'starting work'\n# ... your real script here" },
        { t: "tip", x: "`trap cleanup EXIT` is the mark of a careful script: temp files, lock files and partial downloads get removed no matter how the script ends — including when it crashes." },
        { t: "warn", x: "Never loop over a file with `for line in $(cat file)` — it splits on spaces, not lines. Use `while read -r line; do ... done < file` instead." }
      ],
      quiz: [
        { q: "Which test is true only when `$PATHVAR` points to an existing directory?", opts: ["`[ -f \"$PATHVAR\" ]`", "`[ -d \"$PATHVAR\" ]`", "`[ -z \"$PATHVAR\" ]`", "`[ -x \"$PATHVAR\" ]`"], a: 1, why: "`-d` tests for a directory; `-f` is for regular files; `-z` checks for an empty string." },
        { q: "How do you safely iterate over the lines of a file?", opts: ["`for line in $(cat file)`", "`while read -r line; do ...; done < file`", "`cat file | for line`", "`foreach line in file`"], a: 1, why: "`while read -r` preserves lines with spaces and special characters. `for ... $(cat file)` word-splits and mangles them." }
      ]
    },
    {
      id: "backup-project",
      title: "Project: a backup script you can keep",
      min: 12,
      sum: "Combine everything into a real script: error handling, logging, rotation, cron scheduling — and the discipline to test it.",
      blocks: [
        { t: "p", x: "Time to combine everything you have learned into one artifact: a backup script with logging, rotation and honest error handling. Copy it, change two paths, and it is yours." },
        { t: "code", lang: "bash", title: "/usr/local/bin/backup-app.sh", x: `#!/usr/bin/env bash
set -euo pipefail

SRC="/srv/app"
DEST="/backups/app"
KEEP=7
STAMP=$(date +%F_%H%M)
LOG="/var/log/backup-app.log"

log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG"; }

if [ ! -d "$SRC" ]; then
  log "ERROR: source $SRC is missing"
  exit 1
fi

mkdir -p "$DEST/$STAMP"
log "start: $SRC -> $DEST/$STAMP"

rsync -a --delete "$SRC/" "$DEST/$STAMP/"

# rotation: keep the newest $KEEP snapshots, remove the rest
ls -1dt "$DEST"/*/ | tail -n +$((KEEP + 1)) | xargs -r rm -rf

log "done: $(du -sh "$DEST/$STAMP" | cut -f1) archived"` },
        { t: "h", x: "What each piece buys you" },
        { t: "ul", x: [
          "`set -euo pipefail` plus the source check: it fails loudly instead of quietly producing a series of empty backups.",
          "`log()` with `tee -a`: every line goes to stdout **and** to the log file — cron output and a paper trail in one.",
          "A timestamped destination directory: each run is a new snapshot; nothing overwrites yesterday.",
          "Rotation: `ls -1dt` sorts by time, `tail -n +8` skips the newest seven, `xargs -r rm -rf` deletes the rest. The `-r` means do nothing on an empty list — it has prevented many disasters."
        ] },
        { t: "h", x: "Install it properly" },
        { t: "code", lang: "bash", x: "sudo install -m 755 backup-app.sh /usr/local/bin/backup-app.sh\nsudo /usr/local/bin/backup-app.sh     # run once by hand — always\n\nsudo crontab -e\n# add:\n0 3 * * * /usr/local/bin/backup-app.sh >> /var/log/backup-app.log 2>&1\n\ntail -f /var/log/backup-app.log       # watch the next run land" },
        { t: "h", x: "Level it up later" },
        { t: "ul", x: [
          "Switch to `--link-dest` snapshots (previous module) when disk space matters.",
          "Push one copy off-site daily — pull, not push, when you can.",
          "Add a heartbeat: alert when the last successful run is older than 26 hours.",
          "Run a restore drill on a scratch machine. Only then may you call it a backup system."
        ] },
        { t: "tip", x: "Put this script in version control. The backup script is the one script on your server that must still work two years from now — treat it with the respect you would give production code." },
        { t: "warn", x: "Test with a **scratch destination** the first time. A `--delete` pointed at the wrong path does not warn you; it simply makes the mistake perfectly synchronised." }
      ],
      quiz: [
        { q: "Why run the script by hand before installing the cron entry?", opts: ["To make it executable", "Because cron failures are silent — a manual run proves paths, permissions and output work", "Cron cannot run scripts that were never run manually", "To warm up the disk cache"], a: 1, why: "Cron jobs fail quietly by default. A manual run under the same user and environment catches the problems while you are watching." },
        { q: "Which line stops the snapshots from filling the disk?", opts: ["`mkdir -p \"$DEST/$STAMP\"`", "The rsync call", "The rotation line that keeps only the newest `$KEEP` folders", "`set -euo pipefail`"], a: 2, why: "Without rotation every snapshot is kept forever. The `ls -1dt | tail | xargs rm` line keeps the newest seven and discards the rest." }
      ]
    }
  ]
});
