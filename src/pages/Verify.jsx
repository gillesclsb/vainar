export default function Verify({ email, onConfirmed }) {
  function confirm() {
    const users = JSON.parse(localStorage.getItem("vainaarUsers") || "[]");
    const updated = users.map(user => user.email === email ? { ...user, confirmed: true } : user);
    localStorage.setItem("vainaarUsers", JSON.stringify(updated));
    localStorage.removeItem("vainaarPendingEmail");
    onConfirmed();
  }

  return (
    <main className="center-page">
      <section className="panel verify-panel">
        <div className="mail-icon">✉<span>✓</span></div>
        <h2>CONTROLEER JE E-MAIL</h2>
        <p>We hebben een bevestigingsmail klaargezet voor <strong>{email}</strong>.</p>
        <p>In deze demo bevestig je met de knop hieronder.</p>
        <button className="primary blue" onClick={confirm}>DEMO BEVESTIGEN</button>
      </section>
    </main>
  );
}
