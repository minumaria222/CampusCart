import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [collegeName, setCollegeName] = useState(user.collegeName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setName(user.name);
    setCollegeName(user.collegeName);
  }, [user]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const updated = await api.patch("/auth/me", { name, collegeName });
      setUser(updated);
      setMessage("Your profile has been updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return <main className="editor-page section-shell">
    <div className="editor-heading"><span className="eyebrow">YOUR CAMPUSCART ACCOUNT</span><h1>Profile</h1><p>Keep your public student profile up to date.</p></div>
    <form className="editor-card profile-card" onSubmit={submit}>
      <label>Your name<input required minLength="2" maxLength="80" value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>College or university<input required minLength="2" maxLength="120" value={collegeName} onChange={(event) => setCollegeName(event.target.value)} /></label>
      <label>Email address<input value={user.email} disabled /><small>Your email is private and is not displayed on listings.</small></label>
      <label>Account type<input value={user.role === "admin" ? "Administrator" : "Student"} disabled /></label>
      {message && <p className="action-feedback" role="status">{message}</p>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="editor-actions"><button className="button" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button></div>
    </form>
  </main>;
}
