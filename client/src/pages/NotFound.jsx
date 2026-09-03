import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="not-found-page">
      <p className="eyebrow">Error 404</p>

      <h1>Page not found.</h1>

      <Link to="/" className="button button-light">
        Return home
      </Link>
    </section>
  );
}

export default NotFound;