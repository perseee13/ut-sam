/* Module 1: Linux Essentials */
window.COURSE_MODULES.push({
  id: "essentials",
  title: "Linux Essentials",
  icon: "🐧",
  sum: "Understand what Linux actually is, log in for the first time, and learn your way around the filesystem of a fresh server.",
  lessons: [
    {
      id: "what-is-linux",
      title: "What is Linux (and why servers love it)",
      min: 9,
      sum: "Kernel vs distribution, the big distro families, and how to pick a server operating system you can live with.",
      blocks: [
        { t: "p", x: "A **Linux server** is just a computer you reach over the network: no monitor, no mouse, and instead of a desktop you get a shell. This course is about being fluent in that environment." },
        { t: "h", x: "Kernel vs distribution" },
        { t: "p", x: "Strictly speaking, Linux is only the **kernel** — the piece that talks to hardware, schedules processes and manages memory. What you actually install is a **distribution**: the kernel plus a package manager, shells, libraries and tools, packaged and maintained together." },
        { t: "ul", x: [
          "**Debian family** — Debian, Ubuntu, Mint. Package manager: `apt`. The most common choice for beginners and web servers.",
          "**Red Hat family** — RHEL, Fedora, AlmaLinux, Rocky. Package manager: `dnf`. Common in enterprises.",
          "**SUSE family** — openSUSE, SUSE Linux Enterprise. Package manager: `zypper`.",
          "**Others** — Alpine (tiny; huge in containers), Arch (rolling release, build-it-yourself)."
        ] },
        { t: "h", x: "Why the internet runs on Linux servers" },
        { t: "ul", x: [
          "Free and open source — you can inspect it, script it and ship it.",
          "Stable: years of uptime is normal, not newsworthy.",
          "Remote-first: SSH and a shell are enough to run everything.",
          "Automation-friendly: every task is a command you can repeat and schedule.",
          "Scales from a Raspberry Pi to server farms with thousands of machines."
        ] },
        { t: "h", x: "Which distro should you learn on?" },
        { t: "p", x: "Pick one and stay with it for a while. For a first server, an **Ubuntu LTS** or **Debian stable** machine is the safest choice — enormous community, tutorials everywhere. Everything you learn transfers to the other distros." },
        { t: "code", lang: "bash", title: "See what you're running", x: "cat /etc/os-release   # distribution name and version\nuname -r              # kernel version" },
        { t: "tip", x: "This course uses Debian/Ubuntu commands (`apt`, `ufw`, `/var/log/syslog`). When something differs on the Red Hat family, a note will tell you — e.g. `dnf` instead of `apt`." },
        { t: "warn", x: "Don't judge Linux by a desktop you tried once. Server Linux is a much calmer world: text files, services and logs — and nobody will ever ask you to install printer drivers." }
      ],
      quiz: [
        { q: "What does a distribution add on top of the Linux kernel?", opts: ["Device drivers only", "A package manager, shells, libraries and user-space tools", "A graphical desktop, always", "Nothing — the words mean the same thing"], a: 1, why: "The kernel drives the hardware; the distribution is everything around it: package manager, core utilities, init system, documentation and default services." },
        { q: "Which command prints the distribution name and version?", opts: ["`uname -r`", "`cat /etc/os-release`", "`ls /`", "`top`"], a: 1, why: "`/etc/os-release` describes the distribution. `uname -r` shows only the kernel version." }
      ]
    },

    {
      id: "first-login",
      title: "Your first login: reading the shell",
      min: 8,
      sum: "What the prompt is really telling you, how to size up a machine in ten seconds, and how to get help without leaving the terminal.",
      blocks: [
        { t: "p", x: "You will meet a server through a **shell** — nearly always `bash` — over an SSH connection. The first skill is not typing commands, it is understanding what the screen already tells you." },
        { t: "code", lang: "bash", title: "First contact", x: "ssh deploy@203.0.113.10\n\nWelcome to Ubuntu LTS\nLast login: Sun Oct  4 21:58:12 2026 from 198.51.100.7\ndeploy@web-01:~$" },
        { t: "h", x: "Anatomy of the prompt" },
        { t: "ul", x: [
          "`deploy` — the user you are logged in as.",
          "`web-01` — the hostname. **Check it** before anything destructive; production looks exactly like staging.",
          "`~` — your current directory; `~` is shorthand for your home directory.",
          "`$` — a normal user. A `#` here means **root**, where every typo is a loaded weapon."
        ] },
        { t: "h", x: "Sizing up the machine in ten seconds" },
        { t: "code", lang: "bash", x: "whoami    # which user am I?\nhostname  # which machine is this?\nuptime    # uptime and load averages\nuname -a  # kernel and architecture\ncat /etc/os-release" },
        { t: "h", x: "Getting help without leaving the terminal" },
        { t: "ul", x: [
          "`man grep` — the manual page. `q` quits, `/` searches inside the page.",
          "`grep --help` — quick summary of flags.",
          "`man 5 crontab` — the number picks a manual section; section 5 is file formats.",
          "`apropos 'copy files'` — search manuals by keyword when you forget a command name."
        ] },
        { t: "tip", x: "Live in the shell and it will love you back: **Tab** completes command and file names, the **up arrow** replays history, and `history | grep ssh` finds that command from last week." },
        { t: "warn", x: "Copy-pasting commands from the internet is how servers get compromised. Read every command before running it — especially anything containing `sudo`, `curl | sh` or `rm`." }
      ],
      quiz: [
        { q: "The prompt ends with `#` instead of `$`. What does that mean?", opts: ["The server is broken", "You are in a read-only directory", "You are root — commands can modify anything", "You are connected through a proxy"], a: 2, why: "`#` is the traditional root prompt. Slow down and double-check paths when you see it." },
        { q: "Which key lists suggestions and completes names as you type?", opts: ["Ctrl+C", "Tab", "Alt+F4", "Only the up arrow"], a: 1, why: "Tab completion works for commands, paths and many arguments. Press it twice when unsure." }
      ]
    },
    {
      id: "filesystem-tour",
      title: "A tour of the filesystem",
      min: 10,
      sum: "What lives where: a map of /, absolute vs relative paths, and moving around a server without getting lost.",
      blocks: [
        { t: "p", x: "On a Linux server **everything is a file**, and there is a single tree that starts at `/`. Extra disks do not get drive letters — they get **mounted** into that tree." },
        { t: "h", x: "The directories you will actually use" },
        { t: "ul", x: [
          "`/etc` — configuration. Nearly every service keeps its settings here.",
          "`/var` — variable data: logs in `/var/log`, mail, caches, databases.",
          "`/home` — one directory per human user.",
          "`/root` — the root user's home directory (not `/home/root`).",
          "`/usr` — installed programs, libraries and documentation.",
          "`/opt` — add-on software installed as a bundle.",
          "`/tmp` — scratch space, wiped on reboot. Never store anything you love here.",
          "`/proc`, `/sys`, `/dev` — virtual files that expose the kernel, hardware and devices."
        ] },
        { t: "h", x: "Moving around" },
        { t: "code", lang: "bash", x: "pwd                 # where am I?\nls -lah /var/log    # all files, sizes, long format\ncd /etc/nginx       # absolute path\ncd ..               # up one level\ncd -                # back to the previous directory\ncd ~                # home" },
        { t: "h", x: "Absolute vs relative paths" },
        { t: "p", x: "A path starting with `/` is **absolute**: it means the same thing from anywhere. Anything else is **relative** to your current directory. Scripts should always use absolute paths, so they behave the same no matter who runs them." },
        { t: "tip", x: "`ls -lat /var/log` (newest first) is the fastest way to see what changed recently. `ls -lah` reveals hidden dotfiles and shows sizes in KB/MB instead of bytes." },
        { t: "warn", x: "Wildcards are expanded by the **shell** before the command even runs. `rm *.log` deletes whatever matches in *that* directory — run `ls *.log` first and look at the list before you delete it." }
      ],
      quiz: [
        { q: "Where do most system and service logs live?", opts: ["`/etc/log`", "`/var/log`", "`/home/log`", "`/log`"], a: 1, why: "`/var` holds variable data, and `/var/log` is the traditional home of logs — one of the first places to look when something misbehaves." },
        { q: "Which of these is an absolute path?", opts: ["`../etc/hosts`", "`nginx/nginx.conf`", "`/etc/hosts`", "`~etc`"], a: 2, why: "Only a leading `/` anchors the path to the root of the tree. Everything else depends on where you currently are." }
      ]
    }
  ]
});
