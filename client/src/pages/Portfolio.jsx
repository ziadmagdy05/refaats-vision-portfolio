import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

const filters = ["ALL", "PHOTOGRAPHY", "VIDEOGRAPHY", "MIXED"];

function Portfolio() {
  const [projects, setProjects] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
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
        console.error(err);
        setError("Unable to load projects.");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    if (activeFilter === "ALL") return projects;

    return projects.filter(
      (project) => project.type?.toUpperCase() === activeFilter
    );
  }, [projects, activeFilter]);

  return (
    <section className="portfolio-page">
      <header className="portfolio-header">
        <p className="eyebrow">Selected archive</p>
        <h1>Work</h1>

        <div className="portfolio-filters">
          {filters.map((filter) => (
            <button
              type="button"
              key={filter}
              className={activeFilter === filter ? "filter active" : "filter"}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      {loading && <p className="status-message">Loading projects...</p>}

      {error && (
        <p className="status-message error-message">{error}</p>
      )}

      {!loading && !error && filteredProjects.length === 0 && (
        <p className="status-message">No projects in this category yet.</p>
      )}

      <div className="portfolio-grid">
        {filteredProjects.map((project, index) => (
          <Link
            to={`/portfolio/${project.slug}`}
            className={`portfolio-card ${
              index % 3 === 0 ? "portfolio-card-large" : ""
            }`}
            key={project.id}
          >
            <div className="portfolio-image-wrapper">
              {project.coverUrl ? (
                <img
                  src={project.coverUrl}
                  alt={project.title}
                  className="portfolio-image"
                />
              ) : (
                <div className="project-placeholder">No cover image</div>
              )}

              <span className="portfolio-number">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="portfolio-details">
              <div>
                <h2>{project.title}</h2>
                <p>
                  {project.category}
                  {project.location ? ` · ${project.location}` : ""}
                </p>
              </div>

              <span>{project.type}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default Portfolio;