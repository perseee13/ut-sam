/* Playful CSS-drawn hero: sun, clouds, mountains, server racks, penguin. */
import ShinyText from "../bits/ShinyText.jsx";
import TypingTerminal from "./TypingTerminal.jsx";

export default function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <svg viewBox="0 0 560 400" preserveAspectRatio="xMidYMid slice" role="img">
        <circle cx="400" cy="105" r="62" fill="#fbbf24" />
        <circle cx="400" cy="105" r="86" fill="#fbbf24" opacity="0.45" />
        <g fill="#6366f1">
          <ellipse cx="120" cy="92" rx="52" ry="20" />
          <ellipse cx="160" cy="80" rx="40" ry="18" />
          <ellipse cx="455" cy="60" rx="44" ry="16" />
        </g>
        <g>
          <polygon points="40,300 170,150 300,300" fill="#4f46e5" />
          <polygon points="120,300 170,150 220,300" fill="#6366f1" />
          <polygon points="200,300 330,130 460,300" fill="#4338ca" />
          <polygon points="285,300 330,130 375,300" fill="#5b21b6" />
        </g>
        <g>
          <ellipse cx="280" cy="330" rx="250" ry="52" fill="#1e1b4b" />
          <ellipse cx="280" cy="322" rx="250" ry="50" fill="#312e81" />
          <ellipse cx="150" cy="315" rx="90" ry="20" fill="#4338ca" />
        </g>
        {/* server racks */}
        <g>
          <rect x="330" y="120" width="95" height="180" rx="10" fill="#22344f" />
          <rect x="330" y="120" width="95" height="180" rx="10" fill="none" stroke="#101d33" strokeWidth="4" />
          {[0, 1, 2, 3, 4, 5].map(function (i) {
            return (
              <g key={"a" + i}>
                <rect x="340" y={134 + i * 28} width="75" height="18" rx="4" fill="#31496e" />
                <circle cx="348" cy={143 + i * 28} r="3" fill="#4ade80" />
                <circle cx="357" cy={143 + i * 28} r="3" fill="#38bdf8" />
                <rect x="368" y={140 + i * 28} width="38" height="6" rx="3" fill="#5b789f" />
              </g>
            );
          })}
          <rect x="425" y="140" width="95" height="170" rx="10" fill="#2b4062" />
          <rect x="425" y="140" width="95" height="170" rx="10" fill="none" stroke="#101d33" strokeWidth="4" />
          {[0, 1, 2, 3, 4].map(function (i) {
            return (
              <g key={"b" + i}>
                <rect x="435" y={154 + i * 30} width="75" height="18" rx="4" fill="#3b557d" />
                <circle cx="443" cy={163 + i * 28 + i * 2} r="3" fill="#4ade80" />
                <rect x="452" y={160 + i * 30} width="38" height="6" rx="3" fill="#6c8ab0" />
              </g>
            );
          })}
        </g>
        {/* penguin */}
        <g>
          <ellipse cx="215" cy="285" rx="52" ry="58" fill="#101d33" />
          <ellipse cx="215" cy="292" rx="34" ry="44" fill="#ffffff" />
          <circle cx="215" cy="238" r="30" fill="#101d33" />
          <ellipse cx="215" cy="244" rx="20" ry="22" fill="#ffffff" />
          <circle cx="206" cy="236" r="4.5" fill="#fff" />
          <circle cx="224" cy="236" r="4.5" fill="#fff" />
          <circle cx="206" cy="236" r="2" fill="#101d33" />
          <circle cx="224" cy="236" r="2" fill="#101d33" />
          <polygon points="215,242 206,250 224,250" fill="#f59e0b" />
          <ellipse cx="168" cy="286" rx="14" ry="24" fill="#f59e0b" transform="rotate(-18 168 286)" />
          <ellipse cx="262" cy="286" rx="14" ry="24" fill="#f59e0b" transform="rotate(18 262 286)" />
          <ellipse cx="198" cy="336" rx="14" ry="8" fill="#f59e0b" />
          <ellipse cx="232" cy="336" rx="14" ry="8" fill="#f59e0b" />
          <ellipse cx="232" cy="232" rx="4" ry="6" fill="#fbbf24" />
        </g>
        {/* plants + rocks */}
        <g>
          <ellipse cx="90" cy="320" rx="26" ry="12" fill="#5b6b8c" />
          <ellipse cx="500" cy="325" rx="34" ry="16" fill="#5b6b8c" />
          <g fill="#4ade80">
            <ellipse cx="120" cy="300" rx="10" ry="22" />
            <ellipse cx="140" cy="305" rx="10" ry="18" />
            <ellipse cx="470" cy="300" rx="10" ry="22" />
            <ellipse cx="492" cy="305" rx="10" ry="18" />
          </g>
          <g fill="#22c55e">
            <ellipse cx="130" cy="298" rx="8" ry="18" />
            <ellipse cx="482" cy="298" rx="8" ry="18" />
          </g>
        </g>
      </svg>
      <span className="hero-badge">
        <ShinyText text="Open Source." color="#3b5bdb" shineColor="#ffffff" speed={3} trigger="loop" pauseOnHover />
        <br />
        <ShinyText text="Real Freedom." color="#3b5bdb" shineColor="#ffffff" speed={3} delay={1.2} trigger="loop" pauseOnHover />
      </span>
      <div className="hero-mini-term">
        <div className="term">
          <div className="term-bar"><span className="dot red"></span><span className="dot yellow"></span><span className="dot green"></span><span className="term-title">user@server — bash</span></div>
          <TypingTerminal />
        </div>
      </div>
    </div>
  );
}
