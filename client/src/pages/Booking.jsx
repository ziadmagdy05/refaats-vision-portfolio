import { useState } from "react";
import api from "../api/api";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  service: "",
  eventDate: "",
  location: "",
  budget: "",
  message: "",
};

function Booking() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setSuccess("");
    setError("");

    try {
      const payload = {
        ...form,
        eventDate: new Date(form.eventDate).toISOString(),
      };

      const response = await api.post("/bookings", payload);

      setSuccess(
        response.data?.message ||
          "Your booking request was submitted successfully."
      );

      setForm(initialForm);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to submit your booking request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="booking-page">
      <header className="booking-header">
        <p className="eyebrow">Start a conversation</p>
        <h1>Tell us about your project.</h1>
      </header>

      <div className="booking-layout">
        <aside className="booking-information">
          <p>
            Share the details of your photography or film project and we’ll
            contact you to discuss availability, direction and pricing.
          </p>

          <div>
            <span>Response time</span>
            <p>Usually within 24 hours</p>
          </div>

          <div>
            <span>Based in</span>
            <p>Cairo, Egypt</p>
          </div>
        </aside>

        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Your name
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full name"
                required
              />
            </label>

            <label>
              Email address
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Phone number
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+20"
                required
              />
            </label>

            <label>
              Service
              <select
                name="service"
                value={form.service}
                onChange={handleChange}
                required
              >
                <option value="">Select a service</option>
                <option value="Photography">Photography</option>
                <option value="Videography">Videography</option>
                <option value="Photography and Videography">
                  Photography and Videography
                </option>
                <option value="Creative Direction">
                  Creative Direction
                </option>
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Project date
              <input
                type="datetime-local"
                name="eventDate"
                value={form.eventDate}
                onChange={handleChange}
                required
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
                required
              />
            </label>
          </div>

          <label>
            Estimated budget
            <input
              type="text"
              name="budget"
              value={form.budget}
              onChange={handleChange}
              placeholder="Example: 25,000 EGP"
            />
          </label>

          <label>
            Project details
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us about your project, vision and deliverables..."
              rows="7"
              required
            />
          </label>

          {success && <p className="form-success">{success}</p>}
          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="booking-submit"
            disabled={submitting}
          >
            {submitting ? "Sending request..." : "Submit booking request"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default Booking;