import { Link } from "react-router-dom";

export default function NotFound() {
  return <main className="section-shell"><div className="state-box"><span className="empty-mark">404</span><h1>Looks like this page wandered off.</h1><p>Let’s get you back to the good finds.</p><Link className="button button-small" to="/">Back to CampusCart</Link></div></main>;
}
