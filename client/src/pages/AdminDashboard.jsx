import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import ProjectForm from "../components/ProjectForm";
import AdminSettings from "../components/AdminSettings";

function AdminDashboard() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [projects, setProjects] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [deletingBookingId, setDeletingBookingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      navigate("/admin/login");
      return;
    }

    const loadDashboard = async () => {
      try {
        const [
          adminResponse,
          projectsResponse,
          bookingsResponse,
        ] = await Promise.all([
          api.get("/auth/me"),
          api.get("/projects/admin/all"),
          api.get("/bookings"),
        ]);

        const adminData =
          adminResponse.data?.data?.admin ||
          adminResponse.data?.admin ||
          adminResponse.data?.data;

        const projectData =
          projectsResponse.data?.data?.projects ||
          projectsResponse.data?.projects ||
          projectsResponse.data?.data ||
          [];

        const bookingData =
          bookingsResponse.data?.data?.bookings ||
          bookingsResponse.data?.bookings ||
          bookingsResponse.data?.data ||
          [];

        setAdmin(adminData);
        setProjects(
          Array.isArray(projectData) ? projectData : []
        );
        setBookings(
          Array.isArray(bookingData) ? bookingData : []
        );
      } catch (err) {
        console.error(err);

        if (err.response?.status === 401) {
          localStorage.removeItem("adminToken");
          navigate("/admin/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load the dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const updateBookingStatus = async (bookingId, status) => {
    try {
      setError("");

      const response = await api.put(
        `/bookings/${bookingId}`,
        { status }
      );

      const updatedBooking =
        response.data?.data?.booking ||
        response.data?.booking ||
        response.data?.data;

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                ...updatedBooking,
                status,
              }
            : booking
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to update the booking."
      );
    }
  };

  const deleteBooking = async (booking) => {
    const confirmed = window.confirm(
      `Delete the booking request from "${booking.name}" permanently?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setDeletingBookingId(booking.id);

      await api.delete(`/bookings/${booking.id}`);

      setBookings((currentBookings) =>
        currentBookings.filter(
          (currentBooking) =>
            currentBooking.id !== booking.id
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to delete the booking."
      );
    } finally {
      setDeletingBookingId(null);
    }
  };

  const openNewProjectForm = () => {
    setSelectedProject(null);
    setProjectFormOpen(true);
  };

  const openEditProjectForm = (project) => {
    setSelectedProject(project);
    setProjectFormOpen(true);
  };

  const closeProjectForm = () => {
    setProjectFormOpen(false);
    setSelectedProject(null);
  };

  const handleProjectSaved = (savedProject) => {
    setProjects((currentProjects) => {
      const alreadyExists = currentProjects.some(
        (project) => project.id === savedProject.id
      );

      if (alreadyExists) {
        return currentProjects.map((project) =>
          project.id === savedProject.id
            ? { ...project, ...savedProject }
            : project
        );
      }

      return [savedProject, ...currentProjects];
    });

    closeProjectForm();
  };

  const deleteProject = async (project) => {
    const confirmed = window.confirm(
      `Delete "${project.title}" permanently?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setDeletingProjectId(project.id);

      await api.delete(`/projects/${project.id}`);

      setProjects((currentProjects) =>
        currentProjects.filter(
          (currentProject) =>
            currentProject.id !== project.id
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to delete the project."
      );
    } finally {
      setDeletingProjectId(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const pendingBookings = bookings.filter(
    (booking) => booking.status === "PENDING"
  ).length;

  const sectionTitle =
    activeSection.charAt(0).toUpperCase() +
    activeSection.slice(1);

  if (loading) {
    return (
      <main className="dashboard-status">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="admin-dashboard">
      <aside className="dashboard-sidebar">
        <div>
          <h2>REFAAT'S ADMIN</h2>

          <nav>
            <button
              type="button"
              className={
                activeSection === "overview" ? "active" : ""
              }
              onClick={() => setActiveSection("overview")}
            >
              Overview
            </button>

            <button
              type="button"
              className={
                activeSection === "projects" ? "active" : ""
              }
              onClick={() => setActiveSection("projects")}
            >
              Projects
            </button>

            <button
              type="button"
              className={
                activeSection === "bookings" ? "active" : ""
              }
              onClick={() => setActiveSection("bookings")}
            >
              Bookings
            </button>

            <button
              type="button"
              className={
                activeSection === "settings" ? "active" : ""
              }
              onClick={() => setActiveSection("settings")}
            >
              Settings
            </button>
          </nav>
        </div>

        <div className="dashboard-sidebar-bottom">
          <a href="/" target="_blank" rel="noreferrer">
            View website ↗
          </a>

          <button type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>{sectionTitle}</h1>
          </div>

          <p>{admin?.name || "Administrator"}</p>
        </header>

        {error && <p className="form-error">{error}</p>}

        {activeSection === "overview" && (
          <>
            <div className="dashboard-stat-grid">
              <article>
                <span>Total projects</span>
                <strong>{projects.length}</strong>
              </article>

              <article>
                <span>Total bookings</span>
                <strong>{bookings.length}</strong>
              </article>

              <article>
                <span>Pending requests</span>
                <strong>{pendingBookings}</strong>
              </article>
            </div>

            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <h2>Recent bookings</h2>

                <button
                  type="button"
                  onClick={() =>
                    setActiveSection("bookings")
                  }
                >
                  View all →
                </button>
              </div>

              <BookingTable
                bookings={bookings.slice(0, 5)}
                onUpdate={updateBookingStatus}
                onDelete={deleteBooking}
                deletingBookingId={deletingBookingId}
              />
            </section>
          </>
        )}

        {activeSection === "projects" && (
          <section className="dashboard-section">
            <div className="dashboard-section-heading">
              <h2>All projects</h2>

              <button
                type="button"
                onClick={openNewProjectForm}
              >
                + Add project
              </button>
            </div>

            <div className="dashboard-project-list">
              {projects.map((project) => (
                <article key={project.id}>
                  <div className="dashboard-project-image">
                    {project.coverUrl ? (
                      <img
                        src={project.coverUrl}
                        alt={project.title}
                      />
                    ) : (
                      <span>No image</span>
                    )}
                  </div>

                  <div className="dashboard-project-information">
                    <h3>{project.title}</h3>

                    <p>
                      {project.category} · {project.type}
                    </p>
                  </div>

                  <div className="dashboard-project-labels">
                    <span
                      className={
                        project.published
                          ? "project-published"
                          : "project-draft"
                      }
                    >
                      {project.published
                        ? "Published"
                        : "Draft"}
                    </span>

                    {project.featured && (
                      <span className="project-featured">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="dashboard-project-actions">
                    <button
                      type="button"
                      className="project-edit-button"
                      onClick={() =>
                        openEditProjectForm(project)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="project-delete-button"
                      onClick={() => deleteProject(project)}
                      disabled={
                        deletingProjectId === project.id
                      }
                    >
                      {deletingProjectId === project.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </article>
              ))}

              {projects.length === 0 && (
                <div className="dashboard-empty-projects">
                  <p>No projects found.</p>

                  <button
                    type="button"
                    onClick={openNewProjectForm}
                  >
                    Create your first project
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === "bookings" && (
          <section className="dashboard-section">
            <div className="dashboard-section-heading">
              <h2>Booking requests</h2>
            </div>

            <BookingTable
              bookings={bookings}
              onUpdate={updateBookingStatus}
              onDelete={deleteBooking}
              deletingBookingId={deletingBookingId}
            />
          </section>
        )}

        {activeSection === "settings" && (
          <AdminSettings
            admin={admin}
            onAdminUpdated={setAdmin}
          />
        )}
      </section>

      {projectFormOpen && (
        <ProjectForm
          project={selectedProject}
          onSaved={handleProjectSaved}
          onCancel={closeProjectForm}
        />
      )}
    </main>
  );
}

function BookingTable({
  bookings,
  onUpdate,
  onDelete,
  deletingBookingId,
}) {
  if (bookings.length === 0) {
    return <p>No booking requests found.</p>;
  }

  return (
    <div className="dashboard-table-wrapper">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Service</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td>
                <strong>{booking.name}</strong>
                <span>{booking.email}</span>
              </td>

              <td>{booking.service}</td>

              <td>
                {new Date(
                  booking.eventDate
                ).toLocaleDateString()}
              </td>

              <td>
                <span
                  className={`booking-status ${booking.status.toLowerCase()}`}
                >
                  {booking.status}
                </span>
              </td>

              <td>
                <div className="booking-actions">
                  {booking.status !== "CONFIRMED" && (
                    <button
                      type="button"
                      className="confirm-booking"
                      onClick={() =>
                        onUpdate(
                          booking.id,
                          "CONFIRMED"
                        )
                      }
                    >
                      Confirm
                    </button>
                  )}

                  {booking.status !== "CANCELLED" && (
                    <button
                      type="button"
                      className="cancel-booking"
                      onClick={() =>
                        onUpdate(
                          booking.id,
                          "CANCELLED"
                        )
                      }
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    type="button"
                    className="delete-booking"
                    onClick={() => onDelete(booking)}
                    disabled={
                      deletingBookingId === booking.id
                    }
                  >
                    {deletingBookingId === booking.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;