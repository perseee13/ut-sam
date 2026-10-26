/* Linux File Server topic: Samba + NFS — detailed step-by-step guide */
export const FILE_SERVER = {
  slug: "file-server",
  crumb: "Linux File Server",
  kicker: "File Server topic",
  icon: "📂",
  title: "Linux File Server",
  sum: "Build a production-ready file server on Linux: share folders over the LAN with Samba for Windows/macOS clients and NFS for Linux-to-Linux high-speed transfers. Configure user authentication, permissions, and firewall rules.",
  meta: ["📚 4 sections", "⏱ 38 min step-by-step", "🔌 ports 445 / 2049 / 137-139"],
  heroTerm: [
    { prompt: "admin", cmd: "sudo systemctl status smbd nmbd --no-pager" },
    { prompt: "windows", cmd: "net use Z: \\\\\\192.168.1.10\\shared /user:office" },
    { ok: "✓ Samba share mounted as Z: — all team files accessible" }
  ],
  progressPrefix: "fileserver",
  lessons: [
    {
      id: "what-is-fileserver",
      title: "Architecture: Samba vs NFS — Choosing the Right Protocol",
      min: 8,
      sum: "Understand how Samba (SMB/CIFS) and NFS work, when to use each, and how to plan your file server network layout.",
      blocks: [
        { t: "p", x: "A **Linux file server** provides centralized shared storage for an entire network. Instead of copying files via USB or email, every device mounts the same shared directory over the LAN in real time. **Samba** implements the Windows SMB/CIFS protocol for cross-platform compatibility, while **NFS** (Network File System) is the native Linux/Unix protocol for high-speed server-to-server transfers." },
        {
          t: "img",
          src: "/diagrams/file-server.svg",
          caption: "File Server Architecture: The Linux file server runs both Samba (port 445) and NFS (port 2049). Windows and macOS clients connect via Samba using username/password authentication. Linux servers and containers mount NFS exports using IP-based trust. A single physical disk is shared to all clients simultaneously through the appropriate protocol."
        },
        { t: "h", x: "Samba vs NFS: Feature Comparison" },
        {
          t: "ul",
          x: [
            "**Samba (SMB/CIFS, port 445)**: The Windows file sharing protocol. Windows, macOS, Linux, and iOS all support it natively. Uses username/password authentication. Best for: office environments, home networks with mixed OS devices, public or team shares.",
            "**NFS (port 2049)**: The native Unix/Linux file sharing protocol. No encryption or authentication by default — trust is IP-address-based. Typically 2–5× faster than Samba for Linux-to-Linux transfers. Best for: Linux servers, Docker volumes, high-speed bulk data, CI/CD build agents.",
            "**Run Both Together**: A single server can export the same `/srv/shared` directory over both Samba and NFS simultaneously — Windows users connect via SMB, Linux servers mount via NFS.",
            "**Port Requirements**: Samba needs TCP 445 (SMB), UDP 137-138 (NetBIOS name), TCP 139. NFS needs TCP/UDP 2049 plus several portmapper ports (111, 20048)."
          ]
        },
        { t: "tip", x: "Start with **Samba** if your team uses Windows or macOS. Add NFS later if you need to mount the same share from Linux servers, Docker containers, or automated backup scripts — they can coexist on the same folder without conflict." },
        { t: "warn", x: "Never expose port 445 (SMB) to the internet. The EternalBlue exploit and WannaCry ransomware both target SMB. Always restrict Samba to your LAN subnet with UFW or iptables." }
      ]
    },
    {
      id: "samba-install-share",
      title: "Step 1: Install Samba and Create a Shared Folder",
      min: 10,
      sum: "Install Samba, create a directory with correct Linux permissions, define the share in smb.conf, and add a Samba user account.",
      blocks: [
        { t: "p", x: "Samba requires three things: the **package** installed, the **folder** created with correct permissions, and the **smb.conf** configuration file describing what to share and who can access it." },
        { t: "h", x: "Install Samba and Prepare the Share Directory" },
        {
          t: "code",
          lang: "bash",
          title: "Install and prepare the shared folder",
          x: "# Install Samba server packages\nsudo apt update && sudo apt install -y samba samba-common-bin\n\n# Create the shared directory\nsudo mkdir -p /srv/shared\n\n# Create a group for all file server users\nsudo groupadd office\n\n# Set ownership and permissions\n# root owns it, 'office' group has read/write, others get nothing\nsudo chown root:office /srv/shared\nsudo chmod 2770 /srv/shared\n# The '2' (setgid bit) makes all NEW files inside inherit the 'office' group\n\n# Enable Samba and NetBIOS services at boot\nsudo systemctl enable smbd nmbd\nsudo systemctl start smbd nmbd\n\n# Verify both services are running\nsudo systemctl status smbd --no-pager"
        },
        { t: "h", x: "Define the Share in smb.conf" },
        {
          t: "code",
          lang: "bash",
          title: "Back up original config and add share definition",
          x: "# Always backup before editing Samba config\nsudo cp /etc/samba/smb.conf /etc/samba/smb.conf.original\n\n# Append the share definition at the bottom of smb.conf\nsudo tee -a /etc/samba/smb.conf << 'EOF'\n\n[shared]\n   comment = Office Shared Folder\n   path = /srv/shared\n   browseable = yes\n   read only = no\n   guest ok = no\n   valid users = @office\n   create mask = 0660\n   directory mask = 0770\n   force group = office\nEOF\n\n# Validate the configuration (should show no errors)\ntestparm --suppress-prompt"
        },
        { t: "h", x: "Add Samba User Accounts" },
        {
          t: "code",
          lang: "bash",
          title: "Create Linux user and set Samba password",
          x: "# IMPORTANT: Samba has its OWN separate password database\n# A Linux system account must exist, THEN you add it to Samba\n\n# Create the Linux system account (no login shell, no home directory)\nsudo useradd -M -s /usr/sbin/nologin alice\nsudo useradd -M -s /usr/sbin/nologin bob\n\n# Add both users to the 'office' group\nsudo usermod -aG office alice\nsudo usermod -aG office bob\n\n# Set Samba passwords (can differ from Linux password)\nsudo smbpasswd -a alice  # Prompts for Samba password\nsudo smbpasswd -a bob\n\n# Enable the Samba accounts\nsudo smbpasswd -e alice\nsudo smbpasswd -e bob\n\n# Reload Samba to apply all changes\nsudo systemctl reload smbd"
        },
        { t: "tip", x: "The `valid users = @office` directive in smb.conf uses the `@` prefix to mean 'Linux group named office'. This is more maintainable than listing individual usernames — simply add new users to the `office` group and they immediately gain access without editing smb.conf." },
        { t: "warn", x: "Adding a Linux account (`useradd`) does NOT automatically give Samba access. You must run `smbpasswd -a <username>` separately for each user. This is a very common mistake when setting up Samba for the first time." }
      ]
    },
    {
      id: "connecting-clients",
      title: "Step 2: Connect Clients from Windows, macOS, and Linux",
      min: 8,
      sum: "Mount the Samba share from Windows Explorer, macOS Finder, and Linux command line. Configure firewall rules and troubleshoot common connection issues.",
      blocks: [
        { t: "p", x: "Once the Samba share is configured and users are added, clients can connect using their native OS tools. The server IP in the examples below is `192.168.1.10`." },
        { t: "h", x: "Connect from Windows" },
        {
          t: "code",
          lang: "bash",
          title: "Windows — Map network drive via CMD or File Explorer",
          x: "# Method 1: Command Prompt — map as drive letter Z:\nnet use Z: \\\\192.168.1.10\\shared /user:alice /persistent:yes\n\n# Method 2: Windows File Explorer\n# Press Win+R, type: \\\\192.168.1.10\\shared\n# Enter username: alice\n# Enter password: (the Samba password you set)\n\n# To disconnect\nnet use Z: /delete"
        },
        { t: "h", x: "Connect from macOS" },
        {
          t: "code",
          lang: "bash",
          title: "macOS — Connect via Finder",
          x: "# In Finder: Go → Connect to Server (⌘K)\n# Type: smb://192.168.1.10/shared\n# Click Connect, enter alice + Samba password\n\n# macOS Terminal — mount via command line\nmkdir -p ~/mnt/shared\nmount_smbfs //alice@192.168.1.10/shared ~/mnt/shared"
        },
        { t: "h", x: "Connect from Linux (cifs-utils)" },
        {
          t: "code",
          lang: "bash",
          title: "Linux — Mount Samba share with credentials file",
          x: "# Install CIFS utilities\nsudo apt install -y cifs-utils\n\n# Create a secure credentials file (not in /tmp!)\nsudo tee /etc/samba-credentials-alice << 'EOF'\nusername=alice\npassword=YourSambaPassword\ndomain=WORKGROUP\nEOF\nsudo chmod 600 /etc/samba-credentials-alice\n\n# Mount manually\nsudo mkdir -p /mnt/office-shared\nsudo mount -t cifs //192.168.1.10/shared /mnt/office-shared \\\n  -o credentials=/etc/samba-credentials-alice,uid=1000,gid=1000,iocharset=utf8\n\n# Mount automatically at boot — add to /etc/fstab:\n//192.168.1.10/shared  /mnt/office-shared  cifs  credentials=/etc/samba-credentials-alice,uid=1000,gid=1000,_netdev  0  0"
        },
        { t: "h", x: "Configure UFW Firewall for LAN-Only Access" },
        {
          t: "code",
          lang: "bash",
          title: "Restrict Samba ports to your LAN subnet",
          x: "# Allow Samba from LAN only (change 192.168.1.0/24 to your subnet)\nsudo ufw allow from 192.168.1.0/24 to any port 445 proto tcp comment 'Samba SMB'\nsudo ufw allow from 192.168.1.0/24 to any port 139 proto tcp comment 'Samba NetBIOS'\nsudo ufw allow from 192.168.1.0/24 to any port 137 proto udp comment 'Samba NBT'\nsudo ufw allow from 192.168.1.0/24 to any port 138 proto udp comment 'Samba NBT'\nsudo ufw status numbered"
        },
        { t: "tip", x: "If Windows cannot find the server by name (e.g., `\\\\fileserver\\shared`), try connecting by IP address (`\\\\192.168.1.10\\shared`) instead. NetBIOS name resolution often fails across VLANs or when the server is on a different subnet." }
      ]
    },
    {
      id: "nfs-export",
      title: "Step 3: Set Up NFS for High-Speed Linux-to-Linux Sharing",
      min: 12,
      sum: "Configure NFS exports on the server, specify per-client access options, mount shares on Linux clients, and set up automounting for reliability.",
      blocks: [
        { t: "p", x: "NFS provides higher throughput than Samba for Linux-to-Linux transfers because it avoids the SMB protocol overhead. It is the preferred choice for mounting storage on CI/CD agents, backup servers, and Docker nodes." },
        { t: "h", x: "Install and Configure NFS Server" },
        {
          t: "code",
          lang: "bash",
          title: "Install NFS server packages and create export directory",
          x: "# Install NFS server\nsudo apt update && sudo apt install -y nfs-kernel-server\n\n# Create an NFS export directory (can be same as Samba or separate)\nsudo mkdir -p /srv/nfs-export\nsudo chown nobody:nogroup /srv/nfs-export\nsudo chmod 0775 /srv/nfs-export\n\n# Enable NFS server at boot\nsudo systemctl enable nfs-kernel-server"
        },
        { t: "h", x: "Define Exports in /etc/exports" },
        {
          t: "code",
          lang: "bash",
          title: "/etc/exports — NFS access control rules",
          x: "# Add to /etc/exports:\n# Format: /path  client(options)\n\n# Allow entire LAN (192.168.1.0/24) with read-write access\n/srv/nfs-export  192.168.1.0/24(rw,sync,no_subtree_check)\n\n# Restrict to a SPECIFIC trusted server only (e.g., backup server)\n/srv/nfs-export  192.168.1.25(rw,sync,no_subtree_check,no_root_squash)\n\n# Export read-only to a CI/CD agent\n/srv/nfs-export  192.168.1.50(ro,sync,no_subtree_check)\n\n# Apply the exports without restarting the server\nsudo exportfs -a\n\n# Verify active exports\nsudo exportfs -v"
        },
        {
          t: "code",
          lang: "bash",
          title: "Start NFS server and open firewall",
          x: "sudo systemctl restart nfs-kernel-server\nsudo systemctl status nfs-kernel-server --no-pager\n\n# Open NFS port only to LAN\nsudo ufw allow from 192.168.1.0/24 to any port 2049 proto tcp comment 'NFS'\nsudo ufw allow from 192.168.1.0/24 to any port 2049 proto udp comment 'NFS'\nsudo ufw allow from 192.168.1.0/24 to any port 111 proto tcp comment 'RPC portmapper'"
        },
        { t: "h", x: "Mount NFS Share on a Linux Client" },
        {
          t: "code",
          lang: "bash",
          title: "Manual mount and /etc/fstab automount",
          x: "# Install NFS client tools on the client machine\nsudo apt install -y nfs-common\n\n# List available exports from the server\nshowmount -e 192.168.1.10\n\n# Mount manually\nsudo mkdir -p /mnt/nfs-storage\nsudo mount -t nfs 192.168.1.10:/srv/nfs-export /mnt/nfs-storage\n\n# Verify mount and test write speed\ndf -h | grep nfs\ndd if=/dev/zero of=/mnt/nfs-storage/testfile bs=1M count=512 oflag=direct\n\n# Persistent automount — add to /etc/fstab:\n192.168.1.10:/srv/nfs-export  /mnt/nfs-storage  nfs  defaults,_netdev,rw,timeo=14  0  0"
        },
        { t: "tip", x: "The `no_root_squash` option grants the NFS client's root user full root permissions on the export. Use this ONLY for trusted backup or admin servers. For most clients, the default `root_squash` (maps root to `nobody`) is safer." },
        { t: "warn", x: "NFS has **no built-in encryption** — data travels in plaintext over the network. For sensitive data, either use NFS over a VPN (WireGuard/OpenVPN) or use Samba with Kerberos authentication and SMB encryption enabled." }
      ]
    }
  ]
};
