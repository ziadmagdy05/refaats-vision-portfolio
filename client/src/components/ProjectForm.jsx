import { useEffect, useState } from "react";
import api from "../api/api";

const MAX_FILE_SIZE = 300 * 1024 * 1024;

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
    setCoverFile(null);
    setGalleryFiles([]);
    setError("");
    setUploadProgress("");

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
        ? new Date(project.projectDate)
            .toISOString()
            .slice(0, 10)
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

  const validateFile = (file) => {
    if (!file) {
      throw new Error("Please select a file.");
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      throw new Error(
        `${file.name} is not a supported image or video.`
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `${file.name} is larger than the 300 MB limit.`
      );
    }
  };

  const uploadDirectlyToCloudinary = async (
    file,
    onProgress
  ) => {
    validateFile(file);

    const resourceType = file.type.startsWith("video/")
      ? "video"
      : "image";

    const signatureResponse = await api.post(
      "/uploads/signature",
      {
        resourceType,
      }
    );

    const uploadDetails =
      signatureResponse.data?.data ||
      signatureResponse.data;

    const {
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    } = uploadDetails;

    if (
      !cloudName ||
      !apiKey ||
      !timestamp ||
      !folder ||
      !signature
    ) {
      throw new Error(
        "The server did not provide valid upload details."
      );
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("folder", folder);
    formData.append("signature", signature);

    const uploadUrl =
      `https://api.cloudinary.com/v1_1/` +
      `${cloudName}/${resourceType}/upload`;

    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();

      request.open("POST", uploadUrl);

      request.upload.addEventListener(
        "progress",
        (event) => {
          if (!event.lengthComputable) {
            return;
          }

          const percentage = Math.round(
            (event.loaded / event.total) * 100
          );

          onProgress?.(percentage);
        }
      );

      request.addEventListener("load", () => {
        let response;

        try {
          response = JSON.parse(request.responseText);
        } catch {
          reject(
            new Error("Cloudinary returned an invalid response.")
          );
          return;
        }

        if (
          request.status < 200 ||
          request.status >= 300
        ) {
          reject(
            new Error(
              response?.error?.message ||
                "Cloudinary rejected the upload."
            )
          );
          return;
        }

        resolve(response);
      });

      request.addEventListener("error", () => {
        reject(
          new Error(
            "The upload connection failed. Please try again."
          )
        );
      });

      request.addEventListener("abort", () => {
        reject(new Error("The upload was cancelled."));
      });

      request.send(formData);
    });
  };

  const uploadAndRegisterMedia = async (
    projectId,
    file,
    displayOrder,
    progressLabel
  ) => {
    const uploadedFile = await uploadDirectlyToCloudinary(
      file,
      (percentage) => {
        setUploadProgress(
          `${progressLabel} ${percentage}%`
        );
      }
    );

    const response = await api.post(
      `/media/project/${projectId}`,
      {
        publicId: uploadedFile.public_id,
        resourceType: uploadedFile.resource_type,
        altText: file.name,
        displayOrder,
      }
    );

    return (
      response.data?.data?.media ||
      response.data?.media ||
      response.data?.data
    );
  };

  const handleCoverSelection = (event) => {
    const file = event.target.files?.[0] || null;

    try {
      if (file) {
        validateFile(file);

        if (!file.type.startsWith("image/")) {
          throw new Error(
            "The project cover must be an image."
          );
        }
      }

      setCoverFile(file);
      setError("");
    } catch (selectionError) {
      event.target.value = "";
      setCoverFile(null);
      setError(selectionError.message);
    }
  };

  const handleGallerySelection = (event) => {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    try {
      selectedFiles.forEach(validateFile);
      setGalleryFiles(selectedFiles);
      setError("");
    } catch (selectionError) {
      event.target.value = "";
      setGalleryFiles([]);
      setError(selectionError.message);
    }
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
          ? new Date(
              `${form.projectDate}T12:00:00`
            ).toISOString()
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
        const response = await api.post(
          "/projects",
          payload
        );

        savedProject =
          response.data?.data?.project ||
          response.data?.project ||
          response.data?.data;
      }

      if (!savedProject?.id) {
        throw new Error(
          "The project could not be saved."
        );
      }

      let coverUrl =
        savedProject.coverUrl ||
        project?.coverUrl ||
        null;

      if (coverFile) {
        const coverMedia = await uploadAndRegisterMedia(
          savedProject.id,
          coverFile,
          0,
          "Uploading cover image:"
        );

        coverUrl = coverMedia?.url;

        if (coverUrl) {
          const response = await api.put(
            `/projects/${savedProject.id}`,
            {
              coverUrl,
            }
          );

          savedProject =
            response.data?.data?.project ||
            response.data?.project ||
            response.data?.data || {
              ...savedProject,
              coverUrl,
            };
        }
      }

      for (
        let index = 0;
        index < galleryFiles.length;
        index += 1
      ) {
        const file = galleryFiles[index];

        await uploadAndRegisterMedia(
          savedProject.id,
          file,
          index + 1,
          `Uploading gallery file ${index + 1} of ${
            galleryFiles.length
          }:`
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
              {editing
                ? "Update portfolio"
                : "New portfolio entry"}
            </p>

            <h2>
              {editing
                ? "Edit project"
                : "Add project"}
            </h2>
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

        <form
          className="project-admin-form"
          onSubmit={handleSubmit}
        >
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
                <option value="PHOTOGRAPHY">
                  Photography
                </option>

                <option value="VIDEOGRAPHY">
                  Videography
                </option>

                <option value="MIXED">
                  Mixed
                </option>
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
              onChange={handleCoverSelection}
            />

            <span>
              {coverFile
                ? `${coverFile.name} (${(
                    coverFile.size /
                    1024 /
                    1024
                  ).toFixed(1)} MB)`
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
              onChange={handleGallerySelection}
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

          {error && (
            <p className="form-error">{error}</p>
          )}

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
                ? uploadProgress || "Saving project..."
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