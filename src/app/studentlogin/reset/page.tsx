"use client";
import React, { useState } from "react";

export default function StudentPasswordResetPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        const res = await fetch("/studentlogin/reset/auth", {
            method: "POST",
            body: new FormData(e.target as HTMLFormElement),
        });
        setLoading(false);
        if (res.ok) {
            setSuccess(true);
        } else {
            setError("Failed to reset password. Try again.");
        }
    }

    if (success) {
        return <div className="centered-page"><h1>Password Reset Successful</h1><p>You can now <a href="/studentlogin">login</a> with your new password.</p></div>;
    }

    return (
        <div className="centered-page">
            <form className="login-form" onSubmit={handleSubmit}>
                <h1 className="login-title">Reset Your Password</h1>
                {error && <div className="error-message">{error}</div>}
                <div className="form-group">
                    <label htmlFor="password" className="form-label">New Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        className="form-input"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        className="form-input"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>
                <button type="submit" className="primary-btn w-full" disabled={loading}>{loading ? "Resetting..." : "Reset Password"}</button>
            </form>
        </div>
    );
} 