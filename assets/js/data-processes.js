/* Module 4: Processes & Services */
window.COURSE_MODULES.push({
  id: "processes",
  title: "Processes & Services",
  icon: "⚙️",
  sum: "See what the machine is actually doing, stop and start things safely, and keep long-running services alive with systemd.",
  lessons: [
    {
      id: "processes",
      title: "Processes, signals and load",
      min: 9,
      sum: "Inspect every running process, read load averages like a doctor reads an X-ray, and kill things without causing damage.",
      blocks: [
        { t: "p", x: "Every running thing on a server is a **process** with a numeric PID. When the machine feels slow or a service hangs, this is the layer you inspect first." },
        { t: "h", x: "Look at what is running" },
        { t: "code", lang: "bash", x: "ps aux                # every process, classic BSD style\nps aux | grep nginx   # the time-honoured filter\npgrep -a nginx        # PIDs plus command lines, by name\ntop                   # live view; q quits. htop is prettier\nfree -h               # memory and swap\nuptime                # uptime and load averages" },
        { t: "p", x: "**Load average** (the three numbers from `uptime` or `top`) counts processes that want CPU or are stuck in I/O, averaged over 1, 5 and 15 minutes. Compare it to the core count (`nproc`): load 2.0 on a 2-core box means fully saturated; 8.0 on an 8-core box is business as usual." },
        { t: "h", x: "Signals: ask nicely, then insist" },
        { t: "code", lang: "bash", x: "kill 1234                  # SIGTERM (15): polite request to finish\nkill -9 1234               # SIGKILL: kernel kills it — no cleanup\npkill -f 'node server.js'  # kill by command pattern\nkill -HUP 1234             # SIGHUP (1): many daemons reload their config" },
        { t: "tip", x: "Always try SIGTERM first. It lets the process flush data and close connections. SIGKILL skips all cleanup and can leave stale lock files, half-written files and corrupted state behind." },
        { t: "h", x: "Foreground, background — and why services are different" },
        { t: "code", lang: "bash", x: "./deploy.sh &        # start it in the background\njobs                 # what this shell has running\nCtrl+Z   then   bg   # suspend a foreground job, resume in background\nnohup ./sync.sh &    # keep going even if SSH drops\ndisown               # fully detach from this shell" },
        { t: "warn", x: "`nohup` and `&` are a stopgap: if the process crashes, nothing restarts it and nothing tells you. Anything that must keep running belongs in **systemd** — that is the next lesson." }
      ],
      quiz: [
        { q: "Which signal asks a process to shut down gracefully?", opts: ["`kill -9`", "SIGKILL (9)", "SIGTERM (15)", "SIGHUP (1)"], a: 2, why: "SIGTERM lets the process save state and exit cleanly. Reserve SIGKILL for processes that ignore SIGTERM." },
        { q: "`uptime` reports a load average of 6.2 on a 2-core server. What does that mean?", opts: ["Everything is fine", "The machine is heavily oversubscribed — about 3× more work than it can run", "Memory is exhausted", "The network is down"], a: 1, why: "Load roughly tracks runnable tasks; compare it with `nproc`. 6.2 on 2 cores means a long queue — usually I/O waits or CPU hogs." }
      ]
    },
    {
      id: "systemd-services",
      title: "systemd: services that survive reboots",
      min: 11,
      sum: "Start, stop, reload and enable services, then turn any long-running process into a proper systemd unit of your own.",
      blocks: [
        { t: "p", x: "Modern Linux boots with **systemd**: the init system starts as PID 1, then manages everything else as **units** — services, timers, mounts. One vocabulary for all of it." },
        { t: "h", x: "Everyday systemctl" },
        { t: "code", lang: "bash", x: "systemctl status nginx            # state + recent log lines\nsudo systemctl start nginx        # start now\nsudo systemctl stop nginx         # stop now\nsudo systemctl restart nginx      # stop + start (connections drop)\nsudo systemctl reload nginx       # re-read config, no downtime\nsudo systemctl enable --now nginx # start now AND at every boot\nsystemctl is-enabled nginx        # will it come back after reboot?" },
        { t: "p", x: "`restart` kills the process tree and starts fresh; `reload` asks the service to re-read its config while staying up — users never notice. Use reload when supported, and `reload-or-restart` when you are not sure." },
        { t: "h", x: "Poking around" },
        { t: "code", lang: "bash", x: "systemctl list-units --type=service --state=running\nsystemctl list-units --failed     # what is broken right now?\nsystemctl cat nginx               # show the unit file(s) in use\nsystemctl list-timers             # scheduled jobs (cron's sibling)" },
        { t: "h", x: "Write your own service" },
        { t: "p", x: "Any long-running process can become a real service. One unit file buys you: survives reboots, restarts on crash, logs collected automatically in the journal." },
        { t: "code", lang: "ini", title: "/etc/systemd/system/myapp.service", x: "[Unit]\nDescription=My Node API\nAfter=network.target\n\n[Service]\nUser=app\nWorkingDirectory=/srv/app\nExecStart=/usr/bin/node /srv/app/server.js\nRestart=on-failure\nEnvironment=NODE_ENV=production\n\n[Install]\nWantedBy=multi-user.target" },
        { t: "code", lang: "bash", x: "sudo systemctl daemon-reload        # re-read unit files\nsudo systemctl enable --now myapp   # start it and persist it\njournalctl -u myapp -f              # watch its output live" },
        { t: "tip", x: "Run `daemon-reload` after **every** unit file edit. Forgetting it is the number-one systemd confusion — systemd is still holding the old definition in memory." },
        { t: "warn", x: "Put your units in `/etc/systemd/system/`, never in `/usr/lib/systemd/system/` — package upgrades overwrite the latter. Local changes belong in `/etc`." }
      ],
      quiz: [
        { q: "Which command makes nginx start automatically after a reboot?", opts: ["`systemctl start nginx`", "`systemctl enable nginx`", "`systemctl reload nginx`", "`systemctl reboot nginx`"], a: 1, why: "`enable` links the unit into the boot targets; `start` only affects the current session. `enable --now` does both." },
        { q: "You edited `/etc/systemd/system/myapp.service`. What comes next?", opts: ["Reboot the server", "`systemctl daemon-reload`", "`systemctl list-timers`", "Nothing — systemd notices automatically"], a: 1, why: "systemd caches unit definitions. `daemon-reload` re-reads them, then restart (or reload) the service to apply." }
      ]
    },
    {
      id: "logs-cron",
      title: "Logs with journalctl and jobs with cron",
      min: 10,
      sum: "Read service logs like a detective, and schedule recurring jobs that actually run — and actually tell you when they fail.",
      blocks: [
        { t: "p", x: "Logs are how servers talk to you. systemd captures each service's output in the **journal**; classic text logs still live under `/var/log`. And for anything that must happen on schedule, cron has been the tool since forever." },
        { t: "h", x: "journalctl: one service at a time" },
        { t: "code", lang: "bash", x: "journalctl -u nginx -n 100        # last 100 lines for a unit\njournalctl -u myapp -f            # follow live (Ctrl+C stops)\njournalctl --since '1 hour ago'   # time window\njournalctl -p err -b              # errors since the last boot\njournalctl -u myapp --no-pager | tail -50" },
        { t: "h", x: "Classic log files" },
        { t: "code", lang: "bash", x: "ls /var/log\nsudo tail -f /var/log/auth.log        # logins + sudo (secure on RHEL)\nsudo tail -f /var/log/nginx/access.log\n# watch which logs eat disk space:\ndu -sh /var/log/* | sort -h | tail -5" },
        { t: "h", x: "cron: schedule anything" },
        { t: "code", lang: "bash", x: "crontab -e     # edit YOUR jobs  (sudo crontab -e for root's)\ncrontab -l     # list them" },
        { t: "code", lang: "bash", title: "crontab anatomy", x: "# ┌─ minute (0-59)\n# │ ┌─ hour (0-23)\n# │ │ ┌─ day of month (1-31)\n# │ │ │ ┌─ month (1-12)\n# │ │ │ │ ┌─ weekday (0-7, Sunday is 0 or 7)\n# │ │ │ │ │\n  30 3 * * *  /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1" },
        { t: "ul", x: [
          "Shortcuts exist: `@daily`, `@hourly`, `@reboot`.",
          "Job output is emailed — which in practice means **lost**. Always redirect: `>> /var/log/job.log 2>&1`.",
          "Cron runs with a minimal environment. **Use absolute paths** in jobs, scripts and configs.",
          "System-wide jobs can live in `/etc/cron.d/`, and modern replacements use systemd timers — check with `systemctl list-timers`."
        ] },
        { t: "tip", x: "Test every script by hand first, then in cron. The classic silent failure is a script that works in your shell because your interactive `PATH` was full of extras — cron's is almost empty." },
        { t: "warn", x: "A cron job that fails silently for a month is worse than no cron job. At minimum, log output with a timestamp; better still, make failures mail you or hit a heartbeat URL." }
      ],
      quiz: [
        { q: "Show the last 100 log lines for the `myapp` service:", opts: ["`tail -100 /var/log/myapp.log`", "`journalctl -u myapp -n 100`", "`systemctl logs myapp`", "`grep myapp /var/log/syslog`"], a: 1, why: "`-u` selects the unit and `-n 100` limits to the last 100 entries. Add `-f` to follow in real time." },
        { q: "Which crontab entry runs a backup every day at 03:30?", opts: ["`3 30 * * * backup.sh`", "`30 3 * * * backup.sh`", "`* * 3 30 * backup.sh`", "`@daily-3:30 backup.sh`"], a: 1, why: "Fields run minute, hour, day, month, weekday. So `30 3 * * *` means minute 30 of hour 3, every day." }
      ]
    }
  ]
});
