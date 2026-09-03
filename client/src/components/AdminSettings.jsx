import { useEffect, useState } from "react";
import api from "../api/api";

function AdminSettings({ admin, onAdminUpdated }) {
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [newAdminForm, setNewAdminForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [admins, setAdmins] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setProfileForm({
      name: admin?.name || "",
      email: admin?.email || "",
    });
  }, [admin]);

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const response = await api.get("/auth/admins");

        const adminData =
          response.data?.data?.admins ||
          response.data?.admins ||
          [];

        setAdmins(Array.isArray(adminData) ? adminData : []);
      } catch (err) {
        console.error(err);
      }
    };

    loadAdmins();
  }, []);

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  const updateProfile = async (event) => {
    event.preventDefault();
    clearMessages();
    setSavingProfile(true);

    try {
      const response = await api.put(
        "/auth/profile",
        profileForm
      );

      const updatedAdmin =
        response.data?.data?.admin ||
        response.data?.admin;

      onAdminUpdated(updatedAdmin);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    clearMessages();
    setSavingPassword(true);

    try {
      const response = await api.put(
        "/auth/password",
        passwordForm
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage(
        response.data?.message ||
          "Password changed successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to change password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const createAdmin = async (event) => {
    event.preventDefault();
    clearMessages();
    setCreatingAdmin(true);

    try {
      const response = await api.post(
        "/auth/admins",
        newAdminForm
      );

      const createdAdmin =
        response.data?.data?.admin ||
        response.data?.admin;

      if (createdAdmin) {
        setAdmins((currentAdmins) => [
          ...currentAdmins,
          createdAdmin,
        ]);
      }

      setNewAdminForm({
        name: "",
        email: "",
        password: "",
      });

      setMessage("Additional admin created successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create admin."
      );
    } finally {
      setCreatingAdmin(false);
    }
  };

  return (
    <div className="admin-settings">
      {message && <p className="settings-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      <section className="settings-card">
        <header>
          <p className="eyebrow">Account information</p>
          <h2>Profile</h2>
        </header>

        <form className="settings-form" onSubmit={updateProfile}>
          <label>
            Name
            <input
              type="text"
              value={profileForm.name}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
            />
          </label>

          <label>
            Login email
            <input
              type="email"
              value={profileForm.email}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              required
            />
          </label>

          <button type="submit" disabled={savingProfile}>
            {savingProfile ? "Saving..." : "Save profile"}
          </button>
        </form>
      </section>

      <section className="settings-card">
        <header>
          <p className="eyebrow">Security</p>
          <h2>Change password</h2>
        </header>

        <form className="settings-form" onSubmit={changePassword}>
          <label>
            Current password
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  currentPassword: event.target.value,
                }))
              }
              required
            />
          </label>

          <label>
            New password
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  newPassword: event.target.value,
                }))
              }
              minLength="8"
              required
            />
          </label>

          <label>
            Confirm new password
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value,
                }))
              }
              minLength="8"
              required
            />
          </label>

          <button type="submit" disabled={savingPassword}>
            {savingPassword
              ? "Changing password..."
              : "Change password"}
          </button>
        </form>
      </section>

      <section className="settings-card">
        <header>
          <p className="eyebrow">Team access</p>
          <h2>Administrators</h2>
        </header>

        <div className="admin-account-list">
          {admins.map((account) => (
            <article key={account.id}>
              <div>
                <strong>{account.name}</strong>
                <p>{account.email}</p>
              </div>

              {account.id === admin?.id && <span>You</span>}
            </article>
          ))}
        </div>

        <form
          className="settings-form new-admin-form"
          onSubmit={createAdmin}
        >
          <h3>Add another administrator</h3>

          <label>
            Name
            <input
              type="text"
              value={newAdminForm.name}
              onChange={(event) =>
                setNewAdminForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={newAdminForm.email}
              onChange={(event) =>
                setNewAdminForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              required
            />
          </label>

          <label>
            Temporary password
            <input
              type="password"
              value={newAdminForm.password}
              onChange={(event) =>
                setNewAdminForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              minLength="8"
              required
            />
          </label>

          <button type="submit" disabled={creatingAdmin}>
            {creatingAdmin ? "Creating..." : "Add administrator"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default AdminSettings;