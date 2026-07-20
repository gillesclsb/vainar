import { useState } from "react";
import { ambientMusic } from "../music/AmbientMusic";

const DEFAULT_DISCORD = "https://discord.com/";
const DEFAULT_INSTAGRAM = "https://www.instagram.com/";

export default function Settings({ user, onBack, onEditAvatar }) {
  const [notifications, setNotifications] = useState(localStorage.getItem("vainaarNotifications") !== "off");
  const [musicEnabled, setMusicEnabled] = useState(localStorage.getItem("vainaarMusicEnabled") !== "off");
  const [musicVolume, setMusicVolume] = useState(Number(localStorage.getItem("vainaarMusicVolume") ?? 0.22));

  const discordUrl = import.meta.env.VITE_DISCORD_URL || DEFAULT_DISCORD;
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || DEFAULT_INSTAGRAM;

  function toggleNotifications(){const next=!notifications;setNotifications(next);localStorage.setItem("vainaarNotifications",next?"on":"off");}
  async function toggleMusic(){const next=!musicEnabled;setMusicEnabled(next);if(next)await ambientMusic.start();else ambientMusic.pause();}
  function changeMusicVolume(e){const next=Number(e.target.value);setMusicVolume(next);ambientMusic.setVolume(next);}

  return (
    <main className="settings-page">
      <section className="panel settings-panel">
        <header className="settings-header">
          <button onClick={onBack}>←</button>
          <div>
            <span className="kicker">CONTROL CENTER</span>
            <h1>INSTELLINGEN</h1>
          </div>
        </header>

        <div className="settings-profile">
          <div className="settings-avatar-letter">{user.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <button onClick={onEditAvatar}>CHARACTER WIJZIGEN</button>
        </div>

        <section className="settings-group">
          <h2>APP</h2>
          <button className="setting-row" onClick={toggleNotifications}>
            <span className="setting-icon">🔔</span>
            <span>
              <strong>Meldingen</strong>
              <small>Berichten en oproepen</small>
            </span>
            <b>{notifications ? "AAN" : "UIT"}</b>
          </button>

          <button className="setting-row" onClick={toggleMusic}>
            <span className="setting-icon">{musicEnabled ? "🎵" : "🔇"}</span>
            <span><strong>Achtergrondmuziek</strong><small>Rustige cyber-ambient</small></span>
            <b>{musicEnabled ? "AAN" : "UIT"}</b>
          </button>

          <div className="setting-row music-volume-row">
            <span className="setting-icon">🔊</span>
            <span><strong>Muziekvolume</strong><small>{Math.round(musicVolume * 100)}%</small></span>
            <input type="range" min="0" max="0.6" step="0.01" value={musicVolume} onChange={changeMusicVolume} />
          </div>
        </section>

        <section className="settings-group">
          <h2>HULP & CONTACT</h2>

          <a className="support-link discord-link" href={discordUrl} target="_blank" rel="noreferrer">
            <span className="support-icon">💬</span>
            <span>
              <strong>Discord-hulp</strong>
              <small>Vraag hulp aan de community</small>
            </span>
            <b>OPEN ↗</b>
          </a>

          <a className="support-link instagram-link" href={instagramUrl} target="_blank" rel="noreferrer">
            <span className="support-icon">📸</span>
            <span>
              <strong>Instagram-contact</strong>
              <small>Nieuws, updates en contact</small>
            </span>
            <b>OPEN ↗</b>
          </a>
        </section>

        <div className="settings-note">
          Stel je eigen links in via <code>VITE_DISCORD_URL</code> en <code>VITE_INSTAGRAM_URL</code>.
        </div>
      </section>
    </main>
  );
}
