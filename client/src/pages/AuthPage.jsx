import { useState } from "react";
import { Eye, EyeOff, MoveRight } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ name: "", email: "", collegeName: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (isRegister && values.name.trim().length < 2) return setError("Please enter your name.");
    if (isRegister && values.collegeName.trim().length < 2) return setError("Please enter your college or university.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return setError("Enter a valid email address.");
    if (values.password.length < 8) return setError("Your password must be at least 8 characters.");
    setBusy(true);
    try {
      if (isRegister) await register(values);
      else await login({ email: values.email, password: values.password });
      navigate(location.state?.from?.pathname || (isRegister ? "/sell" : "/"), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-side"><span className="eyebrow">A LITTLE LESS WASTE. A LOT MORE VALUE.</span><h1>Campus life<br />is better <em>shared.</em></h1><p>Find the next owner for your useful things, and find your next great deal.</p><div className="auth-illustration"><div className="auth-circle">CC</div><span>good finds<br />live on</span></div></section>
      <section className="auth-form-wrap">
        <div className="auth-form-head"><span className="eyebrow">{isRegister ? "YOUR CAMPUS, CONNECTED" : "WELCOME BACK"}</span><h2>{isRegister ? "Join the circle." : "Pick up where you left off."}</h2><p>{isRegister ? "Create a student account to start buying and selling." : "Log in to find your next campus essential."}</p></div>
        <form className="form-stack" onSubmit={submit}>
          {isRegister && <label>Your name<input autoComplete="name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required minLength="2" /></label>}
          <label>Email address<input type="email" autoComplete="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} required /></label>
          {isRegister && <label>College or university<input autoComplete="organization" value={values.collegeName} onChange={(e) => setValues({ ...values, collegeName: e.target.value })} required minLength="2" /></label>}
          <label>Password<div className="password-wrap"><input type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} required minLength="8" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><small>At least 8 characters</small></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button auth-submit" type="submit" disabled={busy}>{busy ? "One moment…" : isRegister ? "Create my account" : "Log in"} <MoveRight size={17} /></button>
        </form>
        <p className="auth-switch">{isRegister ? "Already have an account?" : "New around here?"} <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create an account"}</Link></p>
        <p className="auth-disclaimer">CampusCart does not verify student enrollment. Please arrange exchanges safely and in person.</p>
      </section>
    </main>
  );
}
