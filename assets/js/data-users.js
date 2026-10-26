/* Module 3: Users, Groups & Permissions */
window.COURSE_MODULES.push({
  id: "users",
  title: "Users, Groups & Permissions",
  icon: "👥",
  sum: "Know who exists on the machine, escalate to root the professional way, and give every file exactly the access it needs.",
  lessons: [
    {
      id: "users-groups",
      title: "Users and groups: who is on this machine?",
      min: 10,
      sum: "Account types, the three files that define them, and how to create, inspect and remove users the right way.",
      blocks: [
        { t: "p", x: "Every process runs **as some user**. Server security starts with knowing who can log in, and which account each service runs as." },
        { t: "h", x: "Who is here?" },
        { t: "code", lang: "bash", x: "whoami            # current user\nid                # uid, gid and group memberships\nw                 # who is logged in right now\nlast -n 5         # the five most recent logins\ncat /etc/passwd   # every account on the system" },
        { t: "h", x: "The three files behind it all" },
        { t: "ul", x: [
          "`/etc/passwd` — one line per account: `name:x:uid:gid:info:home:shell`. World-readable by design.",
          "`/etc/shadow` — password hashes and expiry rules. Root-only, and that is the point.",
          "`/etc/group` — group names plus members that are not the primary group.",
          "uid `0` is root. Service accounts like `www-data` or `nobody` usually have `/usr/sbin/nologin` as their shell: they run services, humans cannot log in."
        ] },
        { t: "h", x: "Create and manage a user" },
        { t: "code", lang: "bash", x: "sudo useradd -m -s /bin/bash ana   # home directory + bash shell\nsudo passwd ana                    # set the password\nsudo usermod -aG sudo ana          # add to sudo group (wheel on RHEL family)\ngroups ana                         # verify memberships\nsudo userdel -r ana                # remove user and home directory" },
        { t: "tip", x: "Always use `usermod -aG`. The `-a` means **append**: typing `-G` on its own replaces the entire group list and silently locks people out of things they could do yesterday." },
        { t: "tip", x: "Give every service its own unprivileged user. If the web app is compromised, the blast radius stops at what that one account can touch." }
      ],
      quiz: [
        { q: "Where are password hashes stored?", opts: ["`/etc/passwd`", "`/etc/shadow`", "`/etc/group`", "`/var/log/auth.log`"], a: 1, why: "`/etc/shadow` holds the hashes and is readable only by root. `/etc/passwd` contains account metadata but the password field just says `x`." },
        { q: "Add existing user ana to the sudo group on Ubuntu, without touching her other groups:", opts: ["`usermod -G sudo ana`", "`usermod -aG sudo ana`", "`groupadd sudo ana`", "`useradd -G ana`"], a: 1, why: "`-aG` appends. Plain `-G` replaces the whole group list — a classic way to break access by accident." }
      ]
    },
    {
      id: "sudo-root",
      title: "Root and sudo: power without bad habits",
      min: 8,
      sum: "Why you should not live as root, how sudo leaves receipts, and how to grant narrow powers instead of full control.",
      blocks: [
        { t: "p", x: "root (uid 0) can do anything: read every file, change every setting, kill every process. That is exactly why professionals do not live as root — they **escalate per command** with sudo." },
        { t: "h", x: "Sudo: borrowed power, with receipts" },
        { t: "code", lang: "bash", x: "sudo apt update            # run one command as root\nsudo -i                    # start a root shell (know why, before you do)\nsudo -u www-data whoami    # run as another user instead\nsudo -l                    # what am I allowed to run?" },
        { t: "ul", x: [
          "Every sudo use is logged — usually in `/var/log/auth.log` (or `/var/log/secure` on RHEL family).",
          "Sudo credentials are cached for a few minutes, so consecutive admin commands do not re-prompt.",
          "`visudo` checks syntax **before** saving. Use it for every sudoers edit; a broken sudoers file can lock you out of admin rights entirely."
        ] },
        { t: "h", x: "Grant narrow powers instead of full root" },
        { t: "code", lang: "bash", title: "spot the difference", x: "sudo visudo -f /etc/sudoers.d/deploy\n\n# full root — convenient, terrifying:\ndeploy ALL=(ALL) ALL\n\n# narrow and auditable — restart ONE service, no password prompt:\ndeploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx" },
        { t: "tip", x: "Automation (CI jobs, deploy scripts) needs `NOPASSWD` for a specific command — that is fine. Humans get a password prompt. Resist the urge to give both the same rule." },
        { t: "warn", x: "`sudo -i` out of habit is how wrong-window `rm -rf` stories happen: a root shell ignores every file permission safety net, and there is no trail of individual commands, just one root shell." }
      ],
      quiz: [
        { q: "How should an administrator do daily work on a server?", opts: ["Always log in as root to save time", "Log in as an unprivileged user and use sudo per command", "Use root only on Fridays", "Share the root password with the team"], a: 1, why: "Least privilege with per-command escalation: every action is logged, and accidents stay small." },
        { q: "Where should you edit sudo rules?", opts: ["With any editor directly on /etc/sudoers", "With `visudo`, which syntax-checks before saving", "In /etc/passwd", "With `chmod 777 /etc/sudoers` first"], a: 1, why: "`visudo` (and files in `/etc/sudoers.d/`) validates the syntax, so a typo cannot break sudo system-wide." }
      ]
    },
    {
      id: "chmod-chown",
      title: "chmod, chown and the permission model",
      min: 11,
      sum: "Read any permission string at a glance, set exactly the access a file needs, and understand umask, owners and groups.",
      blocks: [
        { t: "p", x: "Linux permissions answer one question per file: **who can do what**. Get this model right once and you will debug 'permission denied' in seconds instead of reinstalling things." },
        { t: "h", x: "Reading `ls -l`" },
        { t: "code", lang: "text", x: "-rwxr-xr--  1 deploy  www-data  4096 Oct  4 22:10 deploy.sh\n│└┬┘└┬┘└┬┘    └owner  └group\n│ │  │  └── others: r--\n│ │  └───── group:  r-x\n│ └──────── owner:  rwx\n└────────── type: - file, d directory, l symlink" },
        { t: "ul", x: [
          "**r**ead = 4, **w**rite = 2, e**x**ecute = 1. Add them per role: `7` = rwx, `6` = rw-, `5` = r-x, `4` = r--.",
          "Three digits = owner / group / others. `644` means owner reads and writes; everyone else only reads."
        ] },
        { t: "h", x: "chmod in both styles" },
        { t: "code", lang: "bash", x: "chmod 644 index.html         # rw-r--r--  typical file\nchmod 755 deploy.sh          # rwxr-xr-x  scripts and directories\nchmod 600 ~/.ssh/id_ed25519  # only I may read my private key\nchmod +x backup.sh           # symbolic: add execute\nchmod u+x,g-w notes.txt      # owner +execute, group -write" },
        { t: "h", x: "chown and chgrp: change who owns it" },
        { t: "code", lang: "bash", x: "sudo chown deploy:www-data -R /srv/app\nsudo chgrp www-data /srv/app/uploads" },
        { t: "p", x: "A typical web setup: files owned by the deploy user, group-owned by `www-data` (the account nginx or apache runs as), directories `755`, files `644`, secrets `600`, and your `.ssh` directory `700`." },
        { t: "h", x: "umask: the defaults for new files" },
        { t: "p", x: "New files start from `666` minus the umask, new directories from `777` minus the umask. A umask of `022` produces the familiar 644/755 pair; a stricter `027` keeps the group from writing and others out entirely." },
        { t: "code", lang: "bash", x: "umask        # show the current mask\numask 027    # for this session — put it in ~/.profile to keep it" },
        { t: "warn", x: "`chmod -R 777` is not a fix — it is a confession. World-writable files let any process rewrite your application. Find the right owner and group instead." }
      ],
      quiz: [
        { q: "In symbolic form, `755` is:", opts: ["`rw-r--r--`", "`rwxr-xr-x`", "`rwxrwxrwx`", "`rwxr--r--`"], a: 1, why: "7 = rwx, 5 = r-x. So 755 expands to rwxr-xr-x: the owner can do everything, group and others can read and execute." },
        { q: "Set the owner of /srv/app to deploy and the group to www-data, recursively:", opts: ["`chmod deploy:www-data /srv/app -R`", "`chgrp deploy:www-data /srv/app`", "`chown deploy:www-data -R /srv/app`", "`usermod -G www-data -R /srv/app`"], a: 2, why: "`chown owner:group path` changes both. `chmod` only changes permission bits, never ownership." }
      ]
    }
  ]
});
