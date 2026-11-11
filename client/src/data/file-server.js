/* Linux File Server topic: Samba + NFS — detailed step-by-step guide */
export const FILE_SERVER = {
  slug: "file-server",
  crumb: "Linux File Server",
  kicker: "File Server topic",
  icon: "📂",
  title: "Linux File Server",
  sum: "Build a production-ready file server on Linux: share folders over the LAN with Samba for Windows/macOS clients and NFS for Linux-to-Linux high-speed transfers. Configure user authentication, permissions, and firewall rules.",
  meta: ["📚 5 sections", "⏱ 38 min step-by-step", "🔌 ports 445 / 2049 / 137-139"],
  heroTerm: [
    { prompt: "admin", cmd: "sudo systemctl status smbd --no-pager" },
    { prompt: "windows", cmd: "net use Z: \\\\192.168.1.10\\Fileshare /user:fileserveruser" },
    { ok: "✓ Samba share mounted as Z: — files accessible" }
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
            "**Run Both Together**: A single server can export the same directory over both Samba and NFS simultaneously — Windows users connect via SMB, Linux servers mount via NFS.",
            "**Port Requirements**: Samba needs TCP 445 (SMB), UDP 137-138 (NetBIOS name), TCP 139. NFS needs TCP/UDP 2049 plus several portmapper ports (111, 20048)."
          ]
        },
        { t: "tip", x: "Start with **Samba** if your team uses Windows or macOS. Add NFS later if you need to mount the same share from Linux servers, Docker containers, or automated backup scripts — they can coexist on the same folder without conflict." },
        { t: "warn", x: "Never expose port 445 (SMB) to the internet. The EternalBlue exploit and WannaCry ransomware both target SMB. Always restrict Samba to your LAN subnet with UFW or iptables." }
      ]
    },
    {
      id: "samba-install",
      title: "Step 1: Update the system and install Samba",
      min: 6,
      sum: "Update Debian 13, install Samba and client tools, and verify the installation.",
      blocks: [
        { t: "p", x: "First, make sure your Debian 13 is up to date, then install Samba and the necessary client tools." },
        {
          t: "code",
          lang: "bash",
          title: "Update system and install Samba",
          x: "# Update package lists and upgrade the system\nsudo apt update && sudo apt upgrade -y\n\n# Install the Samba server and client tools\nsudo apt install samba smbclient samba-common-bin -y"
        },
        { t: "tip", x: "After installation, you can verify it with `smbd --version`." }
      ]
    },
    {
      id: "share-directory-user",
      title: "Step 2: Create the share directory and a system user",
      min: 8,
      sum: "Create the shared folder, add a dedicated system user for Samba authentication, and set secure permissions.",
      blocks: [
        { t: "p", x: "Create the folder to be shared, and create a dedicated system user (this user will be used for Samba authentication later)." },
        {
          t: "code",
          lang: "bash",
          title: "Create share directory, user, and permissions",
          x: "# Create the share directory\nsudo mkdir -p /srv/fileshare\n\n# Create a system user (e.g., fileserveruser) and set a password\nsudo useradd -m fileserveruser\nsudo passwd fileserveruser\n\n# Set permissions: only the owner and group have read/write/execute\nsudo chown -R fileserveruser:fileserveruser /srv/fileshare\nsudo chmod -R 770 /srv/fileshare"
        },
        { t: "tip", x: "Here, `770` permissions mean that users other than the owner and group have no access, which is safer than open sharing." }
      ]
    },
    {
      id: "samba-config",
      title: "Step 3: Edit the Samba configuration file",
      min: 8,
      sum: "Back up smb.conf, create a custom share definition for /srv/fileshare, and allow access for fileserveruser.",
      blocks: [
        { t: "p", x: "Back up the original configuration file first, then edit it with `nano`." },
        {
          t: "code",
          lang: "bash",
          title: "Back up and edit smb.conf",
          x: "sudo cp /etc/samba/smb.conf /etc/samba/smb.conf.bak\nsudo nano /etc/samba/smb.conf"
        },
        { t: "p", x: "Scroll to the very end of the file and add the following content (a custom shared folder):" },
        {
          t: "code",
          lang: "ini",
          title: "/etc/samba/smb.conf — custom share",
          x: "[Fileshare]\n   path = /srv/fileshare\n   browseable = yes\n   writable = yes\n   valid users = fileserveruser\n   create mask = 0660\n   directory mask = 0770"
        },
        { t: "tip", x: "`valid users` specifies which users are allowed access, and `writable = yes` allows write operations." }
      ]
    },
    {
      id: "samba-password-restart",
      title: "Step 4: Set the Samba password and restart the service",
      min: 6,
      sum: "Set the Samba password for fileserveruser, restart smbd, and optionally enable it on boot.",
      blocks: [
        { t: "p", x: "The Samba password is separate from the Linux system password, so it must be set independently." },
        {
          t: "code",
          lang: "bash",
          title: "Set Samba password and restart service",
          x: "# Set the Samba password for fileserveruser (the next two inputs are the password)\nsudo smbpasswd -a fileserveruser\n\n# Restart the Samba service to apply the configuration\nsudo systemctl restart smbd\n\n# (Optional) Enable auto-start on boot\nsudo systemctl enable smbd"
        },
        { t: "warn", x: "Creating a Linux user with `useradd`/`passwd` does not automatically grant Samba access. You must run `sudo smbpasswd -a fileserveruser` for Samba authentication." }
      ]
    }
  ]
};
