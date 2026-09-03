import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await api.get("/projects");

        const projectData =
          response.data?.data?.projects ||
          response.data?.projects ||
          response.data?.data ||
          [];

        setProjects(Array.isArray(projectData) ? projectData : []);
      } catch (err) {
        console.error("Project loading error:", err);
        setError("Unable to load projects.");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const featuredProjects = projects
    .filter((project) => project.featured)
    .slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Photography / Direction / Film</p>

          <h1>
            Stories captured
            <br />
            with intention.
          </h1>

          <div className="hero-actions">
            <Link to="/portfolio" className="button button-light">
              Explore the work
            </Link>

            <Link to="/book" className="text-link">
              Book a project →
            </Link>
          </div>
        </div>
      </section>

      <section className="featured-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Selected work</p>
            <h2>Featured projects</h2>
          </div>

          <Link to="/portfolio" className="text-link">
            View all projects →
          </Link>
        </div>

        {loading && <p className="status-message">Loading projects...</p>}

        {error && <p className="status-message error-message">{error}</p>}

        {!loading && !error && featuredProjects.length === 0 && (
          <p className="status-message">
            No featured projects yet. Mark a project as featured from the API.
          </p>
        )}

        <div className="project-grid">
          {featuredProjects.map((project) => (
            <Link
              to={`/portfolio/${project.slug}`}
              className="project-card"
              key={project.id}
            >
              <div className="project-image-wrapper">
                {project.coverUrl ? (
                  <img
                    src={project.coverUrl}
                    alt={project.title}
                    className="project-image"
                  />
                ) : (
                  <div className="project-placeholder">No cover image</div>
                )}
              </div>

              <div className="project-card-details">
                <div>
                  <h3>{project.title}</h3>
                  <p>
                    {project.category}
                    {project.location ? ` · ${project.location}` : ""}
                  </p>
                </div>

                <span>↗</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="booking-cta">
        <p className="eyebrow">Have a project in mind?</p>
        <h2>Let’s create something worth remembering.</h2>

        <Link to="/book" className="button button-dark">
          Start a project
        </Link>
      </section>
    </>
  );
}

export default Home;