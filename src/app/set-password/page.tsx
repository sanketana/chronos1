"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetPasswordPage() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSetPassword(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            // Get userId from session cookie (decode on server, or fetch /api/auth/me if needed)
            const res = await fetch("/api/auth/set-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword, userId: null }) // userId will be filled on server from session
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to set password");
                setLoading(false);
                return;
            }
            // After password change, fetch session info to get role
            const sessionRes = await fetch("/api/auth/me");
            const sessionData = await sessionRes.json();
            if (sessionData.role === "admin") router.push("/dashboard");
            else if (sessionData.role === "professor") router.push("/dashboard/faculty");
            else if (sessionData.role === "student") router.push("/dashboard/students");
            else router.push("/dashboard");
        } catch {
            setError("Failed to set password. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="centered-page">
            <form className="login-form" onSubmit={handleSetPassword}>
                <h1 className="login-title">Set New Password</h1>
                {error && <div className="error-message">{error}</div>}
                <div className="form-group">
                    <label htmlFor="newPassword" className="form-label">New Password</label>
                    <input
                        type="password"
                        id="newPassword"
                        className="form-input"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        className="form-input"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                </div>
                <button type="submit" className="primary-btn w-full" disabled={loading}>{loading ? "Saving..." : "Set Password"}</button>
            </form>
        </div>
    );
} 