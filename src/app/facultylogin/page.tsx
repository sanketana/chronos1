"use client";
import React, { useEffect, useState } from "react";

export default function FacultyLoginPage() {
    const [error, setError] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            setError(params.get("error") === "invalid");
        }
    }, []);

    return (
        <div className="centered-page">
            <form className="login-form" action="/facultylogin/auth" method="POST">
                <h1 className="login-title">Chronos Faculty Login</h1>
                {error && (
                    <div className="error-message">Invalid email or password. Please try again.</div>
                )}
                <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="username"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />
                </div>
                <button type="submit" className="primary-btn w-full">Login</button>
            </form>
        </div>
    );
} 