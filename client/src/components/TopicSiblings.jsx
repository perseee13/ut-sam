import { Link } from "react-router-dom";

/* Topic cards used by the "Keep exploring" block. group: which section a card belongs to. */
export const TOPIC_CARDS = [
  { slug: "forward-proxy", to: "/squid-proxy/forward-proxy", group: "squid", icon: "➡️", title: "Forward Proxy", sum: "Classic caching proxy on :3128 for your LAN." },
  { slug: "reverse-proxy", to: "/squid-proxy/reverse-proxy", group: "squid", icon: "🔁", title: "Reverse Proxy", sum: "Squid in front of your apps on :80 / :443." },
  { slug: "transparent-proxy", to: "/squid-proxy/transparent-proxy", group: "squid", icon: "👻", title: "Transparent Proxy", sum: "Zero client setup via gateway NAT redirect." },
  { slug: "intercept-ssl-bump", to: "/squid-proxy/intercept-ssl-bump", group: "squid", icon: "🔒", title: "Intercept & SSL Bump", sum: "HTTPS filtering with your own CA." },
  { slug: "docker-containers", to: "/docker-containers", group: "server", icon: "📦", title: "Docker Containers", sum: "Package any app into a lightweight container that runs the same everywhere." },
  { slug: "keepalived", to: "/keepalived", group: "features", icon: "🔄", title: "Keepalived", sum: "High availability with VRRP and floating virtual IPs." },
  { slug: "mqtt", to: "/mqtt", group: "features", icon: "📡", title: "MQTT Messaging", sum: "Lightweight publish/subscribe messaging for IoT devices." },
  { slug: "lxd", to: "/lxd", group: "features", icon: "🐧", title: "LXD Containers", sum: "System containers with snapshots, profiles, and live migration." },
  { slug: "file-server", to: "/file-server", group: "server", icon: "📂", title: "File Server", sum: "Share folders over the LAN with Samba and NFS." },
  { slug: "mail-server", to: "/mail-server", group: "server", icon: "📧", title: "Mail Server", sum: "Run your own email with Postfix and Dovecot." },
  { slug: "nextcloud", to: "/nextcloud", group: "features", icon: "☁", title: "Nextcloud", sum: "Self-hosted file storage and collaboration — your own private cloud." },
];

/* Cross-topic "Keep exploring" grid. Excludes the current topic. */
export default function TopicSiblings({ current, sub }) {
  const all = TOPIC_CARDS.filter(function (t) { return t.slug !== current; });
  return (
    <section className="topic-siblings" aria-label="Keep exploring">
      <h2>Keep exploring</h2>
      <p className="topic-siblings-sub">{sub || "More server setups to try next."}</p>
      <div className="topic-sibling-grid">
        {all.map(function (t) {
          return (
            <Link className="topic-sibling" key={t.slug} to={t.to}>
              <span className="topic-sibling-icon" aria-hidden="true">{t.icon}</span>
              <strong>{t.title}</strong>
              <p>{t.sum}</p>
              <span className="topic-sibling-go">Open →</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
