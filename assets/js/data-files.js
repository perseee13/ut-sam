/* Module 2: Files & Text Power Tools */
window.COURSE_MODULES.push({
  id: "files",
  title: "Files & Text Power Tools",
  icon: "🗂️",
  sum: "Create, read, search and delete files safely — then glue small commands together with pipes like a proper sysadmin.",
  lessons: [
    {
      id: "file-ops",
      title: "Files and directories: the core moves",
      min: 9,
      sum: "Create, copy, move, read and (carefully) delete files, plus symlinks, file types and sizes.",
      blocks: [
        { t: "p", x: "Most server work is creating, reading, moving and deleting files. Own these few commands and everything else gets easier." },
        { t: "h", x: "Create and organise" },
        { t: "code", lang: "bash", x: "mkdir -p /srv/app/{logs,data}    # nested directories in one shot\ntouch /srv/app/.env               # create an empty file\ncp -r /srv/app /srv/app-backup    # recursive copy\nmv old-name.txt new-name.txt      # rename (instant, same filesystem)\nmv notes.txt /tmp/                # move to another directory" },
        { t: "h", x: "Read without opening an editor" },
        { t: "code", lang: "bash", x: "cat /etc/hostname            # print the whole file\nless /etc/nginx/nginx.conf   # scroll; q quits, / searches\nhead -n 20 /var/log/syslog   # first 20 lines\ntail -n 50 /var/log/syslog   # last 50 lines\ntail -f /var/log/syslog      # follow live; Ctrl+C stops" },
        { t: "h", x: "Delete carefully" },
        { t: "code", lang: "bash", x: "rm notes.txt\nrm -r old-project/    # directory and everything in it\nrm -i important.txt   # ask before each deletion" },
        { t: "warn", x: "**There is no recycle bin.** `rm -rf` deletes recursively, without prompts, no matter how tired you are. Check the path with `pwd` and `ls` first, and dry-run destructive helpers (`find ... -print` before `-delete`)." },
        { t: "h", x: "Links, types and sizes" },
        { t: "code", lang: "bash", x: "ln -s /opt/app/releases/2026-10-04 /opt/app/current  # symlink\nls -l            # first char:  - file, d directory, l symlink\nfile archive.bin # what is this really?\nstat report.pdf  # size, owner, timestamps\ndu -sh /var/log  # disk used by a whole tree" },
        { t: "tip", x: "Symlinks are how deployments flip versions with zero downtime: point `current` at the new release folder, then restart the service. A broken symlink shows up clearly in `ls -l`." }
      ],
      quiz: [
        { q: "Which command creates `/srv/app/logs` even though `/srv/app` does not exist yet?", opts: ["`mkfolder /srv/app/logs`", "`mkdir -p /srv/app/logs`", "`touch -r /srv/app/logs`", "`ln -s /srv/app/logs`"], a: 1, why: "`-p` creates missing parent directories and stays quiet if the target already exists." },
        { q: "What does `rm -rf build/` do when `build/` is the wrong directory?", opts: ["It asks for confirmation first", "It moves the directory to a trash folder", "It deletes everything under it immediately and permanently", "It fails unless you are root"], a: 2, why: "-r recurses, -f never prompts. There is no undo — always verify the path before pressing Enter." }
      ]
    },
    {
      id: "search-find",
      title: "Find anything: files with find, text with grep",
      min: 10,
      sum: "Answer where is it? and where is it mentioned? for any file on the machine — and act on the results safely.",
      blocks: [
        { t: "p", x: "Two tools cover almost every search on a server: **find** for files, **grep** for the text inside them. Learn the four or five flags you will actually use." },
        { t: "h", x: "find: locate files by almost anything" },
        { t: "code", lang: "bash", x: "find /var/log -name '*.log' -size +10M     # logs bigger than 10 MB\nfind /srv -type f -name '*.conf'            # files only, by name\nfind /srv/app -type f -mtime -7             # changed in the last 7 days\nfind /tmp -type f -mtime +30 -print         # older than 30 days: preview first\nfind /srv/app -type f -exec chown app:app {} +  # run a command per hit" },
        { t: "ul", x: [
          "`-type f` files, `-type d` directories.",
          "`-size +10M` bigger than 10 MB; `-size -1k` smaller than 1 KB; `+1G` gigabytes.",
          "`-mtime -7` modified less than 7 days ago; `+7` more than 7 days ago.",
          "`-iname` is the case-insensitive version of `-name`."
        ] },
        { t: "warn", x: "Always run the search first (the default `-print`) and eyeball the list **before** adding `-delete` or a destructive `-exec`. `find` is a chainsaw that hides its blade until you add an action." },
        { t: "h", x: "grep: find text inside files" },
        { t: "code", lang: "bash", x: "grep -rin 'timeout' /etc/nginx/   # recursive, ignore case, line numbers\ngrep -c 'ERROR' app.log           # count matching lines\ngrep -v '^#' nginx.conf           # hide comments (invert the match)\ngrep -E '50[0-9] ' access.log     # extended regex: 500 to 509" },
        { t: "h", x: "The killer combination" },
        { t: "code", lang: "bash", x: "grep -rl 'old-domain.com' /etc              # which config files mention it?\nfind /srv -name '*.conf' -exec grep -l 'listen' {} +   # find, then filter by content" },
        { t: "tip", x: "`grep -rl` (recursive, list file names only) is usually the fastest path to the answer — it stops you from dumping megabytes of log lines into the terminal." },
        { t: "warn", x: "`grep -r /` will happily crawl your whole disk and take minutes. Narrow the path to the directory you suspect — `/etc/nginx`, not `/`." }
      ],
      quiz: [
        { q: "Which command finds log files larger than 10 MB in /var/log?", opts: ["`find /var/log -name '*.log' -size +10M`", "`find /var/log -name '*.log' -bigger 10`", "`ls -big /var/log/*.log`", "`grep -size +10M /var/log`"], a: 0, why: "`find -size +10M` means strictly larger than 10 MB. Prefix `+` means greater than, `-` smaller than." },
        { q: "Search for 'timeout' anywhere under /etc, ignoring case, printing line numbers:", opts: ["`grep -rin 'timeout' /etc`", "`find /etc -timeout`", "`grep -v timeout /etc`", "`cat /etc/*timeout*`"], a: 0, why: "-r recurses, -i ignores case, -n prints line numbers. That trio covers most real-world greps." }
      ]
    },
    {
      id: "pipes-redirect",
      title: "Pipes and redirection: the superpower",
      min: 10,
      sum: "stdout, stderr, pipes and exit codes — the plumbing that turns small commands into one-liners that feel like magic.",
      blocks: [
        { t: "p", x: "The Unix philosophy in one sentence: **small tools that do one thing, connected by pipes**. Once you see I/O as plumbing, the command line becomes a Lego set." },
        { t: "h", x: "Three streams: stdin, stdout, stderr" },
        { t: "ul", x: [
          "**stdin** (0) — input, usually your keyboard.",
          "**stdout** (1) — normal output.",
          "**stderr** (2) — errors. Keeping errors separate is what keeps logs readable."
        ] },
        { t: "code", lang: "bash", x: "ls /var/log > listing.txt     # stdout to a file (overwrite)\nls /var/log >> listing.txt    # append instead of overwrite\nmycmd 2> errors.log           # send stderr to its own file\nmycmd > all.log 2>&1          # both streams into one file\nmycmd > /dev/null 2>&1        # discard everything (handy in cron)" },
        { t: "h", x: "Pipes: stdout of one command becomes stdin of the next" },
        { t: "code", lang: "bash", title: "The classic one-liner", x: "awk '{print $1}' access.log | sort | uniq -c | sort -nr | head -5\n# extract column 1 (IPs) → sort → count duplicates → rank → top 5" },
        { t: "p", x: "Read it as a pipeline: `awk` pulls the first column, `sort` groups equal values together, `uniq -c` counts each run, `sort -nr` ranks numerically, `head -5` keeps the winners. Five tiny tools, one answer: **your five noisiest visitors**." },
        { t: "h", x: "Handy companions" },
        { t: "ul", x: [
          "`wc -l` — count lines.",
          "`sort -h` — sort by human sizes (1K, 2M, 3G...).",
          "`cut -d: -f1 /etc/passwd` — print the first colon-separated field.",
          "`tr 'A-Z' 'a-z'` — lowercase everything passing through.",
          "`tee disk.txt` — write to a file **and** pass the data on: `df -h | tee disk.txt`."
        ] },
        { t: "h", x: "Exit codes, && and ||" },
        { t: "p", x: "Every command exits with a number: `0` means success, anything else is a failure. `$?` holds the last one — and the shell operators read it for you." },
        { t: "code", lang: "bash", x: "apt update && apt upgrade -y       # upgrade only if update succeeded\nsystemctl is-active nginx || echo 'nginx is DOWN'\necho $?                             # exit code of the previous command" },
        { t: "tip", x: "`grep -q pattern file` searches quietly: no output, only the exit code. Perfect for `&&` chains and scripts." },
        { t: "warn", x: "`>` opens (and truncates!) the target file **before** the command runs. `sort big.log > big.log` sorts an empty file. Use a new name or a temp file when input and output might be the same." }
      ],
      quiz: [
        { q: "What is the difference between `>` and `>>`?", opts: ["`>` appends, `>>` overwrites", "`>` overwrites the file, `>>` appends to it", "They are identical", "`>>` works only with sudo"], a: 1, why: "`>` truncates the target first — one wrong path and the old contents are gone. `>>` adds to the end." },
        { q: "In `mycmd > all.log 2>&1`, where does stderr end up?", opts: ["Discarded", "In the terminal only", "In all.log, together with stdout", "In /var/log/syslog"], a: 2, why: "`2>&1` points stream 2 (stderr) at stream 1 (stdout), which is already going to all.log — so both land in the file." }
      ]
    },
    {
      id: "editors-archives",
      title: "Survival editing and tar archives",
      min: 9,
      sum: "Edit config files with nano or vim without panicking, and bundle files for backup or transfer with tar.",
      blocks: [
        { t: "p", x: "Sooner or later you must edit a config file and bundle some files for transfer. This is the survival kit for both — no IDE required." },
        { t: "h", x: "nano: the friendly editor" },
        { t: "code", lang: "bash", x: "sudo nano /etc/nginx/sites-available/default\n# Ctrl+O = save  ·  Ctrl+X = exit  ·  Ctrl+W = search" },
        { t: "h", x: "vim: worth ten minutes of your life" },
        { t: "ul", x: [
          "`i` enters insert mode (you can type). `Esc` returns to normal mode.",
          "`:w` saves · `:q` quits · `:wq` saves and quits · `:q!` quits and throws changes away.",
          "`/text` searches, `n` jumps to the next hit. `dd` deletes a line, `u` undoes.",
          "Run `vimtutor` on any server — a guided half-hour that pays for itself forever."
        ] },
        { t: "tip", x: "Before editing a config by hand, copy it: `sudo cp nginx.conf nginx.conf.bak`. After editing, validate it: `sudo nginx -t` or `sudo sshd -t`. A syntax check beats an outage at 2 AM." },
        { t: "h", x: "tar: bundle files the server way" },
        { t: "code", lang: "bash", x: "tar -czvf backup.tar.gz /srv/app          # create · gzip · verbose · file\ntar -tzf backup.tar.gz                     # list contents, no extraction\ntar -xzvf backup.tar.gz -C /restore        # extract into a directory\ntar -xzvf backup.tar.gz srv/app/index.html # extract a single file\nzip -r site.zip site/                      # zip, when Windows users are involved" },
        { t: "ul", x: [
          "Letter mnemonic: `c` create, `x` extract, `t` list, `z` gzip, `v` talkative, `f` file. Order barely matters (`-zxvf` works fine)."
        ] },
        { t: "warn", x: "`tar` writes paths relative to the extraction directory. Extracting a crafted archive as root in `/` can overwrite system files. Always extract with `-C` into a scratch directory first and look at what came out." }
      ],
      quiz: [
        { q: "Which command extracts `backup.tar.gz` into `/restore`?", opts: ["`tar -czvf backup.tar.gz /restore`", "`tar -xzvf backup.tar.gz -C /restore`", "`tar -tzf backup.tar.gz /restore`", "`gzip -d backup.tar.gz /restore`"], a: 1, why: "`-x` extracts, `-z` handles gzip, `-C` changes to the target directory before unpacking." },
        { q: "In vim, how do you quit **without** saving changes?", opts: ["`:wq`", "Ctrl+X", "`:q!`", "`Esc` twice"], a: 2, why: "`:q!` forces a quit and discards modifications. `:wq` would save them, which is usually the opposite of what you want mid-edit." }
      ]
    }
  ]
});
