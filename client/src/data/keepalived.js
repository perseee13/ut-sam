/* Keepalived topic: high availability and VRRP — detailed step-by-step guide */
export const KEEPALIVED = {
  slug: "keepalived",
  crumb: "Keepalived",
  kicker: "High Availability topic",
  icon: "🔄",
  title: "Keepalived & VRRP High Availability",
  sum: "Eliminate single points of failure with Keepalived and VRRP. Configure a floating virtual IP (VIP) that automatically migrates to a standby server within seconds when the primary node fails.",
  meta: ["📚 4 sections", "⏱ 32 min step-by-step", "🔌 VRRP / VIP / eth0"],
  heroTerm: [
    { prompt: "master", cmd: "sudo systemctl status keepalived --no-pager" },
    { prompt: "master", cmd: "ip addr show eth0 | grep '192.168.1.100'" },
    { ok: "✓ VIP 192.168.1.100 active on master — failover ready in <2 seconds" }
  ],
  progressPrefix: "keepalived",
  lessons: [
    {
      id: "keepalived-basics",
      title: "Architecture: How VRRP High Availability Works",
      min: 8,
      sum: "Understand how Keepalived uses VRRP election packets to maintain a floating virtual IP shared between two servers.",
      blocks: [
        { t: "p", x: "**Keepalived** provides high availability (HA) for Linux services using the **VRRP** (Virtual Router Redundancy Protocol). It creates a **Virtual IP address (VIP)** that automatically floats between two servers. Clients always connect to the VIP — they are never aware which physical server is currently handling traffic." },
        {
          t: "img",
          src: "/diagrams/keepalived.svg",
          caption: "Keepalived VRRP Architecture: The MASTER server holds the Virtual IP (VIP) and sends VRRP advertisement multicast packets every second. The BACKUP listens. If the MASTER fails to advertise within the `advert_int` × `multiplier` timeout, the BACKUP promotes itself and claims the VIP — all in under 3 seconds."
        },
        { t: "h", x: "Core Keepalived Concepts" },
        {
          t: "ul",
          x: [
            "**Virtual IP (VIP)**: A shared IP address (e.g., `192.168.1.100`) that clients always connect to. It 'floats' between the MASTER and BACKUP servers.",
            "**MASTER Node**: The active server that currently holds the VIP. Sends VRRP advertisement multicast packets every `advert_int` seconds (default: 1 second).",
            "**BACKUP Node**: The standby server watching for VRRP advertisements. If the MASTER stops sending packets (goes offline, crashes, or network fails), the BACKUP promotes itself after a brief timeout.",
            "**Priority**: An integer (1–254) determining which server becomes MASTER. Higher priority wins. If two servers tie, the higher IP address wins.",
            "**virtual_router_id**: A number (1–255) identifying the VRRP group. Both nodes must use the same ID or they won't recognize each other's packets."
          ]
        },
        { t: "tip", x: "Keepalived does not replicate data between servers — it only moves the VIP. Your actual service (Nginx, HAProxy, database) must already be running and in sync on the BACKUP node. Use shared storage, database replication, or DRBD for data synchronization." }
      ]
    },
    {
      id: "keepalived-prerequisites",
      title: "Step 1: Prepare Two Servers and Install Keepalived",
      min: 6,
      sum: "Configure two servers on the same LAN subnet, install Keepalived, and verify multicast communication between nodes.",
      blocks: [
        { t: "p", x: "You need two servers on the **same Layer-2 network segment** (same VLAN/subnet). They must be able to send and receive UDP multicast packets to each other. The VIP must be in the same subnet as your server interfaces." },
        { t: "h", x: "Recommended Lab Network Layout" },
        {
          t: "code",
          lang: "bash",
          title: "Server IP planning",
          x: "# MASTER server (primary, higher priority)\n# Real IP: 192.168.1.10   Interface: eth0\n\n# BACKUP server (standby, lower priority)\n# Real IP: 192.168.1.11   Interface: eth0\n\n# Virtual IP (VIP) — shared by both nodes\n# VIP: 192.168.1.100   (clients connect to this IP)\n\n# Confirm both servers can reach each other\n# Run on MASTER:\nping -c 3 192.168.1.11\n\n# Run on BACKUP:\nping -c 3 192.168.1.10"
        },
        { t: "h", x: "Install Keepalived on Both Servers" },
        {
          t: "code",
          lang: "bash",
          title: "Install on MASTER and BACKUP (run on both)",
          x: "# Update repositories and install Keepalived\nsudo apt update && sudo apt install -y keepalived\n\n# Enable service to start at boot\nsudo systemctl enable keepalived\n\n# Check the installed version\nkeepalived --version"
        },
        { t: "warn", x: "If your servers are hosted in a **cloud environment** (AWS, GCP, Azure), VRRP multicast is typically blocked by the cloud provider's virtual network. You must use **unicast VRRP** (`unicast_src_ip` and `unicast_peer` directives) instead of the default multicast mode." }
      ]
    },
    {
      id: "keepalived-config",
      title: "Step 2: Configure MASTER and BACKUP Nodes",
      min: 10,
      sum: "Write the keepalived.conf for both servers with correct VRRP instance settings, priorities, and health-check scripts.",
      blocks: [
        { t: "p", x: "Keepalived's configuration file is `/etc/keepalived/keepalived.conf`. The MASTER and BACKUP configurations are nearly identical — only the `state` and `priority` values differ." },
        { t: "h", x: "MASTER Node Configuration" },
        {
          t: "code",
          lang: "bash",
          title: "/etc/keepalived/keepalived.conf — MASTER (192.168.1.10)",
          x: "# Global settings\nglobal_defs {\n   router_id MASTER_NODE\n   script_user root\n   enable_script_security\n}\n\n# Optional: check if Nginx is running; if not, lower priority\nvrrp_script check_nginx {\n    script \"/bin/bash -c 'systemctl is-active nginx'\"\n    interval 2      # Check every 2 seconds\n    weight -30      # Subtract 30 from priority if script fails\n}\n\nvrrp_instance VI_1 {\n    state MASTER          # This server starts as MASTER\n    interface eth0        # Network interface to bind the VIP\n    virtual_router_id 51  # MUST match on both nodes (1-255)\n    priority 100          # Higher number = preferred MASTER\n    advert_int 1          # Send VRRP advertisements every 1 second\n\n    authentication {\n        auth_type PASS    # Simple password authentication\n        auth_pass S3cur3K3y!\n    }\n\n    # The Virtual IP address\n    virtual_ipaddress {\n        192.168.1.100/24 dev eth0\n    }\n\n    # Attach health-check script\n    track_script {\n        check_nginx\n    }\n}"
        },
        { t: "h", x: "BACKUP Node Configuration" },
        {
          t: "code",
          lang: "bash",
          title: "/etc/keepalived/keepalived.conf — BACKUP (192.168.1.11)",
          x: "global_defs {\n   router_id BACKUP_NODE\n   script_user root\n   enable_script_security\n}\n\nvrrp_script check_nginx {\n    script \"/bin/bash -c 'systemctl is-active nginx'\"\n    interval 2\n    weight -30\n}\n\nvrrp_instance VI_1 {\n    state BACKUP          # This server starts as BACKUP\n    interface eth0\n    virtual_router_id 51  # Must be identical to MASTER\n    priority 90           # Lower than MASTER's 100\n    advert_int 1\n\n    authentication {\n        auth_type PASS\n        auth_pass S3cur3K3y!\n    }\n\n    virtual_ipaddress {\n        192.168.1.100/24 dev eth0\n    }\n\n    track_script {\n        check_nginx\n    }\n}"
        },
        { t: "h", x: "Start Keepalived and Verify VIP Binding" },
        {
          t: "code",
          lang: "bash",
          title: "Start keepalived and confirm VIP appears on MASTER",
          x: "# Start on both servers\nsudo systemctl restart keepalived\n\n# On MASTER — VIP should be visible on eth0\nip addr show eth0\n# Expected: inet 192.168.1.100/24 brd 192.168.1.255 scope global secondary eth0\n\n# Check Keepalived state\nsudo journalctl -u keepalived -n 20 --no-pager"
        },
        { t: "tip", x: "The `vrrp_script` + `weight -30` trick is powerful: if Nginx stops responding, the MASTER's effective priority drops from 100 to 70, which is lower than the BACKUP's 90. The BACKUP automatically promotes itself, even if the MASTER server is still online!" }
      ]
    },
    {
      id: "keepalived-failover-testing",
      title: "Step 3: Test Failover and Verify Recovery",
      min: 8,
      sum: "Simulate a MASTER failure, confirm the VIP migrates to BACKUP, and verify automatic failback when the MASTER recovers.",
      blocks: [
        { t: "p", x: "Failover testing is the most important step. Always verify your HA setup actually works **before** you need it in a real incident." },
        { t: "h", x: "Method 1: Stop Keepalived on MASTER" },
        {
          t: "code",
          lang: "bash",
          title: "Simulate primary failure and watch VIP migrate",
          x: "# On MASTER: Stop keepalived to simulate failure\nsudo systemctl stop keepalived\n\n# On BACKUP: Immediately watch for VIP takeover\nwatch -n 0.5 ip addr show eth0\n# You should see 192.168.1.100/24 appear within 3 seconds\n\n# Confirm from a third machine: ping the VIP continuously\nping 192.168.1.100\n# There should be < 3 packet drops during the transition\n\n# On MASTER: Restart keepalived to test failback\nsudo systemctl start keepalived\n# MASTER should reclaim the VIP because its priority (100) > BACKUP (90)"
        },
        { t: "h", x: "Method 2: Simulate Application Failure" },
        {
          t: "code",
          lang: "bash",
          title: "Stop Nginx on MASTER to trigger health-check failover",
          x: "# On MASTER: Stop Nginx\nsudo systemctl stop nginx\n\n# The vrrp_script will detect Nginx is down within 2 seconds\n# Priority drops: 100 - 30 = 70, which is < BACKUP's 90\n# BACKUP becomes the new MASTER automatically!\n\n# Monitor Keepalived logs in real-time\nsudo journalctl -u keepalived -f\n\n# Restart Nginx on MASTER to restore original state\nsudo systemctl start nginx"
        },
        { t: "h", x: "Viewing VRRP State Transitions in Logs" },
        {
          t: "code",
          lang: "bash",
          title: "Inspect Keepalived state changes",
          x: "# View all MASTER/BACKUP state transitions\nsudo grep 'VRRP_Instance' /var/log/syslog | tail -20\n\n# Expected log output during failover:\n# Keepalived_vrrp[1234]: VRRP_Instance(VI_1) Transition to MASTER STATE\n# Keepalived_vrrp[1234]: VRRP_Instance(VI_1) Entering MASTER STATE"
        },
        { t: "warn", x: "If BOTH servers think they are MASTER simultaneously ('split-brain'), check that both use the same `virtual_router_id` and `auth_pass`, and that UDP multicast port 112 is not blocked by a firewall between the two servers." }
      ]
    }
  ]
};
