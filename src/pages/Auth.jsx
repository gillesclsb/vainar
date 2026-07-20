import { useState } from "react";
import { api } from "../api/api";

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password")
    };

    try {
      const data = mode === "login"
        ? await api.login({ email: payload.email, password: payload.password })
        : await api.register(payload);

      localStorage.setItem("vainaarToken", data.token);
      onAuthenticated(data.user);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="brand">
        <div className="logo">V</div>
        <div><h1>VAINAAR</h1><p>FUTURE COMMUNITY NETWORK</p></div>
      </section>

      <section className="panel auth-panel">
        <div className="tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>LOGIN</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>REGISTREREN</button>
        </div>

        <form onSubmit={submit} className="stack">
          <span className={`kicker ${mode === "register" ? "yellow" : ""}`}>
            {mode === "login" ? "ACCESS NODE" : "NEW IDENTITY"}
          </span>
          <h2>{mode === "login" ? "WELKOM TERUG" : "NIEUW ACCOUNT"}</h2>

          {mode === "register" && <>
            <label>NAAM</label>
            <input name="name" required placeholder="Jouw naam" />
          </>}

          <label>E-MAIL</label>
          <input name="email" type="email" required placeholder="Jouw e-mail" />

          <label>WACHTWOORD</label>
          <input name="password" type="password" minLength="6" required placeholder="Minimaal 6 tekens" />

          <button className={`primary ${mode === "login" ? "blue" : "yellow-btn"}`} disabled={loading}>
            {loading ? "LADEN..." : mode === "login" ? "SYSTEEM OPENEN" : "ACCOUNT CREËREN"}
          </button>
        </form>

        {message && <div className="error">{message}</div>}
      </section>
    </main>
  );
}
