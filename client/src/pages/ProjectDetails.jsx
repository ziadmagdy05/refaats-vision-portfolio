import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/api";

function ProjectDetails() {
  const { slug } = useParams();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await api.get(`/projects/${slug}`);

        const projectData =
          response.data?.data?.project ||
          response.data?.project ||
          response.data?.data;

        setProject(projectData);
      } catch (err) {
        console.error(err);
        setError("Project not found.");
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [slug]);

  if (loading) {
    return (
      <section className="project-details-status">
        <p>Loading project...</p>
      </section>
    );
  }

  if (error || !project) {
    return (
      <section className="project-details-status">
        <h1>Project not found</h1>
        <Link to="/portfolio" className="text-link">
          ← Return to work
        </Link>
      </section>
    );
  }

  const media = project.media || [];

  return (
    <article className="project-details-page">
      <header className="project-details-header">
        <Link to="/portfolio" className="text-link">
          ← All projects
        </Link>

        <p className="eyebrow">
          {project.category} / {project.type}
        </p>

        <h1>{project.title}</h1>

        <div className="project-meta">
          <div>
            <span>Location</span>
            <p>{project.location || "Not specified"}</p>
          </div>

          <div>
            <span>Client</span>
            <p>{project.clientName || "Personal project"}</p>
          </div>

          <div>
            <span>Date</span>
            <p>
              {project.projectDate
                ? new Date(project.projectDate).getFullYear()
                : "—"}
            </p>
          </div>
        </div>
      </header>

      {project.coverUrl && (
        <div className="project-cover">
          <img src={project.coverUrl} alt={project.title} />
        </div>
      )}

      <section className="project-description">
        <p className="eyebrow">About the project</p>
        <p>{project.description}</p>
      </section>

      <section className="project-gallery">
        {media.map((item) => (
          <figure className="gallery-item" key={item.id}>
            {item.type === "VIDEO" ? (
              <video
                src={item.url}
                poster={item.thumbnailUrl || undefined}
                controls
                playsInline
              />
            ) : (
              <img
                src={item.url}
                alt={item.altText || project.title}
                loading="lazy"
              />
            )}

            {item.caption && <figcaption>{item.caption}</figcaption>}
          </figure>
        ))}
      </section>

      {media.length === 0 && (
        <p className="status-message project-empty">
          No additional project media yet.
        </p>
      )}

      <section className="project-next-cta">
        <p className="eyebrow">Start a conversation</p>
        <h2>Have a similar project in mind?</h2>

        <Link to="/book" className="button button-dark">
          Book a project
        </Link>
      </section>
    </article>
  );
}

export default ProjectDetails;