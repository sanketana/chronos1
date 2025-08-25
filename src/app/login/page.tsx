"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("error") === "invalid") setError("Invalid email or password. Please try again.");
        }
    }, []);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Login failed");
                setLoading(false);
                return;
            }
            if (data.mustChangePassword) {
                router.push("/set-password");
            } else {
                // Redirect based on role
                if (data.role === "superadmin" || data.role === "admin") router.push("/dashboard");
                else if (data.role === "faculty") router.push("/dashboard/faculty");
                else if (data.role === "student") router.push("/dashboard/students");
                else router.push("/dashboard");
            }
        } catch {
            setError("Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="centered-page">
            <form className="login-form" onSubmit={handleLogin}>
                <h1 className="login-title">Chronos Login</h1>
                {error && (
                    <div className="error-message">{error}</div>
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
                <button type="submit" className="primary-btn w-full" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
            </form>
        </div>
    );
} 