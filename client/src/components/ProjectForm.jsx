import { useEffect, useState } from "react";
import api from "../api/api";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  type: "PHOTOGRAPHY",
  clientName: "",
  location: "",
  projectDate: "",
  featured: false,
  published: true,
  displayOrder: 0,
};

function ProjectForm({ project, onSaved, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [coverFile, setCoverFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");

  const editing = Boolean(project);

  useEffect(() => {
    if (!project) {
      setForm(emptyForm);
      return;
    }

    setForm({
      title: project.title || "",
      description: project.description || "",
      category: project.category || "",
      type: project.type || "PHOTOGRAPHY",
      clientName: project.clientName || "",
      location: project.location || "",
      projectDate: project.projectDate
        ? new Date(project.projectDate).toISOString().slice(0, 10)
        : "",
      featured: Boolean(project.featured),
      published: Boolean(project.published),
      displayOrder: project.displayOrder || 0,
    });
  }, [project]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const uploadMedia = async (projectId, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      `/media/project/${projectId}`,
      formData
    );

    return (
      response.data?.data?.media ||
      response.data?.media ||
      response.data?.data
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setUploadProgress("");

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        type: form.type,
        clientName: form.clientName.trim() || null,
        location: form.location.trim() || null,
        projectDate: form.projectDate
          ? new Date(`${form.projectDate}T12:00:00`).toISOString()
          : null,
        featured: form.featured,
        published: form.published,
        displayOrder: Number(form.displayOrder) || 0,
      };

      let savedProject;

      if (editing) {
        const response = await api.put(
          `/projects/${project.id}`,
          payload
        );

        savedProject =
          response.data?.data?.project ||
          response.data?.project ||
          response.data?.data;
      } else {
        const response = await api.post("/projects", payload);

        savedProject =
          response.data?.data?.project ||
          response.data?.project ||
          response.data?.data;
      }

      if (!savedProject?.id) {
        throw new Error("The project could not be saved.");
      }

      let coverUrl = savedProject.coverUrl || project?.coverUrl || null;

      if (coverFile) {
        setUploadProgress("Uploading cover image...");

        const coverMedia = await uploadMedia(
          savedProject.id,
          coverFile
        );

        coverUrl = coverMedia?.url;

        if (coverUrl) {
          const response = await api.put(
            `/projects/${savedProject.id}`,
            { coverUrl }
          );

          savedProject =
            response.data?.data?.project ||
            response.data?.project ||
            response.data?.data ||
            {
              ...savedProject,
              coverUrl,
            };
        }
      }

      for (let index = 0; index < galleryFiles.length; index += 1) {
        setUploadProgress(
          `Uploading gallery file ${index + 1} of ${
            galleryFiles.length
          }...`
        );

        await uploadMedia(
          savedProject.id,
          galleryFiles[index]
        );
      }

      setUploadProgress("");

      onSaved({
        ...savedProject,
        coverUrl,
      });
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save the project."
      );
    } finally {
      setSaving(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="project-form-overlay">
      <div className="project-form-modal">
        <header className="project-form-header">
          <div>
            <p className="eyebrow">
              {editing ? "Update portfolio" : "New portfolio entry"}
            </p>

            <h2>{editing ? "Edit project" : "Add project"}</h2>
          </div>

          <button
            type="button"
            className="project-form-close"
            onClick={onCancel}
            disabled={saving}
          >
            ×
          </button>
        </header>

        <form className="project-admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-row">
            <label>
              Project title
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Cairo After Dark"
                required
              />
            </label>

            <label>
              Category
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Editorial"
                required
              />
            </label>
          </div>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the project..."
              rows="5"
              required
            />
          </label>

          <div className="admin-form-row">
            <label>
              Project type
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                required
              >
                <option value="PHOTOGRAPHY">Photography</option>
                <option value="VIDEOGRAPHY">Videography</option>
                <option value="MIXED">Mixed</option>
              </select>
            </label>

            <label>
              Project date
              <input
                type="date"
                name="projectDate"
                value={form.projectDate}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="admin-form-row">
            <label>
              Client
              <input
                type="text"
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                placeholder="Client or personal project"
              />
            </label>

            <label>
              Location
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Cairo, Egypt"
              />
            </label>
          </div>

          <div className="admin-form-row">
            <label>
              Display order
              <input
                type="number"
                name="displayOrder"
                value={form.displayOrder}
                onChange={handleChange}
                min="0"
              />
            </label>

            <div className="project-checkboxes">
              <label>
                <input
                  type="checkbox"
                  name="featured"
                  checked={form.featured}
                  onChange={handleChange}
                />
                Featured project
              </label>

              <label>
                <input
                  type="checkbox"
                  name="published"
                  checked={form.published}
                  onChange={handleChange}
                />
                Published
              </label>
            </div>
          </div>

          <label className="admin-file-label">
            Cover image
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setCoverFile(event.target.files?.[0] || null)
              }
            />

            <span>
              {coverFile
                ? coverFile.name
                : editing && project?.coverUrl
                  ? "Keep current cover image"
                  : "Choose a cover image"}
            </span>
          </label>

          <label className="admin-file-label">
            Gallery images or videos
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(event) =>
                setGalleryFiles(Array.from(event.target.files || []))
              }
            />

            <span>
              {galleryFiles.length > 0
                ? `${galleryFiles.length} file(s) selected`
                : "Choose gallery files"}
            </span>
          </label>

          {uploadProgress && (
            <p className="project-upload-progress">
              {uploadProgress}
            </p>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="project-form-actions">
            <button
              type="button"
              className="project-cancel-button"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="project-save-button"
              disabled={saving}
            >
              {saving
                ? "Saving project..."
                : editing
                  ? "Save changes"
                  : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectForm;