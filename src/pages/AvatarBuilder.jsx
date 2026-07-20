import { useMemo, useState } from "react";
import { api } from "../api/api";
import EditableCharacter from "../components/EditableCharacter";

const skins = [
  { value: "#f3c3a2", label: "Licht" },
  { value: "#dfa170", label: "Warm" },
  { value: "#bd7c4f", label: "Getint" },
  { value: "#8f573a", label: "Donker" },
  { value: "#593528", label: "Diep" }
];

const hairStyles = [
  { value: "neo", label: "NEO", crop: "neo" },
  { value: "wave", label: "WAVE", crop: "wave" },
  { value: "buzz", label: "BUZZ", crop: "buzz" }
];

const hairColors = [
  { value: "#101010", label: "Zwart" },
  { value: "#4d2c1d", label: "Bruin" },
  { value: "#8c6239", label: "Lichtbruin" },
  { value: "#d9b36c", label: "Blond" },
  { value: "#d7d7d7", label: "Zilver" }
];

const outfits = [
  { value: "#00a8ff", label: "TECH", style: "tech" },
  { value: "#f2f2f2", label: "FUTURE", style: "future" },
  { value: "#20242d", label: "STEALTH", style: "stealth" }
];

export default function AvatarBuilder({ user, onSaved, onCancel }) {
  const [config, setConfig] = useState(user.avatar || {
    skin: skins[0].value,
    hairColor: hairColors[0].value,
    hairStyle: "neo",
    outfit: outfits[0].value,
    outfitStyle: "tech",
    gender: "male",
    realistic: true
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeHair = useMemo(
    () => hairStyles.find(item => item.value === config.hairStyle) || hairStyles[0],
    [config.hairStyle]
  );

  const activeOutfit = useMemo(
    () => outfits.find(item => item.style === config.outfitStyle) || outfits[0],
    [config.outfitStyle]
  );

  function update(key, value) {
    setConfig(current => ({ ...current, [key]: value, realistic: true }));
  }

  async function save() {
    setSaving(true);
    setError("");

    try {
      const data = await api.saveAvatar(config);
      onSaved(data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="real-character-page">
      <section className="real-character-controls panel">
        <div className="real-character-brand">
          <div className="real-v">V</div>
          <div>
            <strong>VAINAAR</strong>
            <small>FUTURE COMMUNITY NETWORK</small>
          </div>
        </div>

        <div className="creator-heading">
          <span className="kicker">IDENTITY CREATOR</span>
          <h1>{user.avatarDone ? "WIJZIG JE KARAKTER" : "MAAK JE KARAKTER"}</h1>
          <p>Je karakter wordt permanent opgeslagen bij je account.</p>
        </div>

        <ChoiceSection title="GESLACHT">
          <div className="gender-options">
            <button
              type="button"
              className={config.gender !== "female" ? "selected male" : "male"}
              onClick={() => update("gender", "male")}
            >
              <span>♂</span>
              <strong>MANNELIJK</strong>
            </button>
            <button
              type="button"
              className={config.gender === "female" ? "selected female" : "female"}
              onClick={() => update("gender", "female")}
            >
              <span>♀</span>
              <strong>VROUWELIJK</strong>
            </button>
          </div>
        </ChoiceSection>

        <ChoiceSection title="HUIDSKLEUR">
          <div className="real-skin-options">
            {skins.map(item => (
              <button
                type="button"
                key={item.value}
                aria-label={item.label}
                className={config.skin === item.value ? "selected" : ""}
                style={{ background: item.value }}
                onClick={() => update("skin", item.value)}
              />
            ))}
          </div>
        </ChoiceSection>

        <ChoiceSection title="HAARSTIJL">
          <div className="real-card-options hair-cards">
            {hairStyles.map(item => (
              <button
                type="button"
                key={item.value}
                className={config.hairStyle === item.value ? "selected" : ""}
                onClick={() => update("hairStyle", item.value)}
              >
                <span className={`character-thumb hair-${item.crop}`} />
                <strong>{item.label}</strong>
              </button>
            ))}
          </div>
        </ChoiceSection>

        <ChoiceSection title="HAARKLEUR">
          <div className="real-hair-colors">
            {hairColors.map(item => (
              <button
                type="button"
                key={item.value}
                aria-label={item.label}
                className={config.hairColor === item.value ? "selected" : ""}
                style={{ background: item.value }}
                onClick={() => update("hairColor", item.value)}
              />
            ))}
          </div>
        </ChoiceSection>

        <ChoiceSection title="OUTFIT">
          <div className="real-card-options outfit-cards">
            {outfits.map(item => (
              <button
                type="button"
                key={item.style}
                className={config.outfitStyle === item.style ? "selected" : ""}
                onClick={() => {
                  update("outfitStyle", item.style);
                  update("outfit", item.value);
                }}
              >
                <span className={`outfit-preview ${item.style}`} />
                <strong>{item.label}</strong>
              </button>
            ))}
          </div>
        </ChoiceSection>
      </section>

      <section className={`real-character-preview panel ${activeHair.value} ${activeOutfit.style} ${config.gender === "female" ? "gender-female" : "gender-male"}`}>
        <div className="rotate-hint">
          <span>🖱️</span>
          <strong>SLEEP / DRAAI<br />OM TE KIJKEN</strong>
        </div>

        <div className="preview-v">V</div>

        <div className="real-character-stage">
          <div className="gender-character-wrap">
            <EditableCharacter config={config} />
          </div>
          <div
            className="selection-glow"
            style={{
              "--skin-choice": config.skin,
              "--hair-choice": config.hairColor,
              "--outfit-choice": config.outfit
            }}
          />
          <div className="character-platform" />
        </div>

        <div className="saved-selection">
          <span>{config.gender === "female" ? "VROUWELIJK" : "MANNELIJK"}</span>
          <span>{activeHair.label}</span>
          <span>{activeOutfit.label}</span>
        </div>

        <button className="real-save-button" onClick={save} disabled={saving}>
          <span>▣</span>
          {saving ? "OPSLAAN..." : "KARAKTER OPSLAAN"}
        </button>

        {onCancel && (
          <button className="real-cancel-button" onClick={onCancel}>
            ANNULEREN
          </button>
        )}

        {error && <div className="error">{error}</div>}
      </section>
    </main>
  );
}

function ChoiceSection({ title, children }) {
  return (
    <section className="real-choice-section">
      <label>{title}</label>
      {children}
    </section>
  );
}
