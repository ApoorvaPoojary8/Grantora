
import { useEffect, useState } from "react";
import {
  getMyBeneficiaryProfile,
  createBeneficiary,
  updateMyBeneficiaryProfile,
} from "../services/beneficiaryService";
import "../styles/BeneficiaryManagement.css";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  annualIncome: "",
  address: "",
  state: "",
  district: "",
  category: "",
};

function BeneficiaryManagement() {
  const [form, setForm] = useState(initialForm);
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const response = await getMyBeneficiaryProfile();
      const profile = response.data;

      setForm({
        fullName: profile.fullName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth || "",
        annualIncome: profile.annualIncome ?? "",
        address: profile.address || "",
        state: profile.state || "",
        district: profile.district || "",
        category: profile.category || "",
      });

      setProfileExists(profile.id != null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load beneficiary profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const payload = {
        dateOfBirth: form.dateOfBirth,
        annualIncome:
          form.annualIncome === "" ? null : Number(form.annualIncome),
        address: form.address,
        state: form.state,
        district: form.district,
        category: form.category,
        phone: form.phone,
      };

      const response = profileExists
        ? await updateMyBeneficiaryProfile(payload)
        : await createBeneficiary(payload);
      const profile = response.data;
      setForm({
        fullName: profile.fullName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth || "",
        annualIncome: profile.annualIncome ?? "",
        address: profile.address || "",
        state: profile.state || "",
        district: profile.district || "",
        category: profile.category || "",
      });
      setProfileExists(profile.id != null);
      setMessage(
        profileExists
          ? "Beneficiary profile updated successfully!"
          : "Beneficiary profile created successfully!"
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to save beneficiary profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ padding: "24px" }}>Loading beneficiary profile...</p>;
  }

  return (
    <div style={styles.container}>
      <h1>Beneficiary Management</h1>
      <p>Manage your personal and beneficiary information.</p>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <label>Full Name</label>
        <input type="text" name="fullName" value={form.fullName} readOnly />

        <label>Email</label>
        <input type="email" name="email" value={form.email} readOnly />

        <label>Phone</label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          required
        />

        <label>Date of Birth</label>
        <input
          type="date"
          name="dateOfBirth"
          value={form.dateOfBirth}
          onChange={handleChange}
          required
        />

        <label>Annual Income (₹)</label>
        <input
          type="number"
          name="annualIncome"
          value={form.annualIncome}
          onChange={handleChange}
          min="0"
          step="0.01"
          required
        />

        <label>Address</label>
        <textarea
          name="address"
          value={form.address}
          onChange={handleChange}
          required
          rows="3"
        />

        <label>State</label>
        <input
          type="text"
          name="state"
          value={form.state}
          onChange={handleChange}
          required
        />

        <label>District</label>
        <input
          type="text"
          name="district"
          value={form.district}
          onChange={handleChange}
          required
        />

        <label>Category</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          <option value="General">General</option>
          <option value="OBC">OBC</option>
          <option value="SC">SC</option>
          <option value="ST">ST</option>
          <option value="EWS">EWS</option>
          <option value="Other">Other</option>
        </select>

        <button type="submit" disabled={saving}>
          {saving
            ? "Saving..."
            : profileExists
              ? "Update Profile"
              : "Create Profile"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "700px",
    margin: "40px auto",
    padding: "24px",
    background: "var(--color-surface-lowest)",
    borderRadius: "12px",
    boxShadow: "0 4px 15px var(--color-shadow)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "24px",
  },
  success: {
    padding: "12px",
    background: "var(--color-success-container)",
    color: "var(--color-success)",
    borderRadius: "6px",
    marginTop: "16px",
  },
  error: {
    padding: "12px",
    background: "var(--color-error-container)",
    color: "var(--color-error-text)",
    borderRadius: "6px",
    marginTop: "16px",
  },
};

export default BeneficiaryManagement;
