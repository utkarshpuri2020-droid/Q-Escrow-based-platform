"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";
import {
  User,
  ShieldCheck,
  Lock,
  Cpu,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Smartphone
} from "lucide-react";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // MFA state
  const [mfaData, setMfaData] = useState<any | null>(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState("");
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([]);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaMsg, setMfaMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Cryptographic Keys state
  const [keys, setKeys] = useState<any[]>([]);
  const [selectedAlgo, setSelectedAlgo] = useState("ML-DSA-65");
  const [generatedKeypair, setGeneratedKeypair] = useState<any | null>(null);
  const [keyLabel, setKeyLabel] = useState("");
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyMsg, setKeyMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchKeys = () => {
    apiRequest("/crypto/keys")
      .then(setKeys)
      .catch(() => {});
  };

  const fetchSessions = () => {
    apiRequest("/users/me/sessions")
      .then(setSessions)
      .catch(() => {});
  };

  useEffect(() => {
    if (user) {
      fetchKeys();
      fetchSessions();
    }
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdMsg(null);
    try {
      await apiRequest("/users/me/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setPwdMsg({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPwdMsg({ type: "error", text: err.message || "Failed to change password" });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSetupMfa = async () => {
    setMfaLoading(true);
    setMfaMsg(null);
    try {
      const data = await apiRequest("/auth/mfa/setup");
      setMfaData(data);
    } catch (err: any) {
      setMfaMsg({ type: "error", text: err.message || "Failed to generate MFA setup" });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyEnableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaLoading(true);
    setMfaMsg(null);
    try {
      const res = await apiRequest("/auth/mfa/enable", {
        method: "POST",
        body: JSON.stringify({
          secret: mfaData.secret,
          totp_code: totpVerifyCode.trim(),
        }),
      });
      setMfaBackupCodes(res.backup_codes || []);
      setMfaMsg({ type: "success", text: "MFA enabled successfully! Save your recovery codes." });
      setMfaData(null);
      refreshUser();
    } catch (err: any) {
      setMfaMsg({ type: "error", text: err.message || "Verification code invalid" });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleGenerateKeypair = async () => {
    setKeyLoading(true);
    setKeyMsg(null);
    try {
      const res = await apiRequest(`/crypto/generate-dev-keypair?algorithm=${selectedAlgo}`, {
        method: "POST",
      });
      setGeneratedKeypair(res);
      setKeyLabel(`My ${selectedAlgo} Key`);
    } catch (err: any) {
      setKeyMsg({ type: "error", text: err.message || "Key generation failed" });
    } finally {
      setKeyLoading(false);
    }
  };

  const handleRegisterKey = async () => {
    if (!generatedKeypair) return;
    setKeyLoading(true);
    setKeyMsg(null);
    try {
      await apiRequest("/crypto/keys/register", {
        method: "POST",
        body: JSON.stringify({
          algorithm: generatedKeypair.algorithm,
          public_key_hex: generatedKeypair.public_key_hex,
          label: keyLabel.trim() || undefined,
        }),
      });
      setKeyMsg({ type: "success", text: "Public key registered successfully!" });
      setGeneratedKeypair(null);
      fetchKeys();
    } catch (err: any) {
      setKeyMsg({ type: "error", text: err.message || "Failed to register key" });
    } finally {
      setKeyLoading(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this public key?")) return;
    try {
      await apiRequest(`/crypto/keys/${keyId}/revoke`, { method: "POST" });
      fetchKeys();
    } catch (err: any) {
      alert(err.message || "Failed to revoke key");
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await apiRequest(`/users/me/sessions/${sessionId}`, { method: "DELETE" });
      fetchSessions();
    } catch {}
  };

  const handleLogoutAll = async () => {
    if (!confirm("This will log you out from all other active devices. Continue?")) return;
    try {
      await apiRequest("/auth/logout-all", { method: "POST" });
      fetchSessions();
    } catch {}
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!user) {
    return <div className="p-12 text-center text-xs text-slate-500">Sign in to access settings.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-qblue-600 dark:text-qblue-400">
          Account Administration
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Profile & Security Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your post-quantum ML-DSA keys, multi-factor authentication, active sessions, and credentials.
        </p>
      </div>

      {/* Profile Overview */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-qblue-600" />
          <span>User Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-navy-950 rounded-xl">
            <span className="text-slate-400 block text-[10px]">Username</span>
            <strong className="text-slate-900 dark:text-white font-mono text-sm">{user.username}</strong>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-navy-950 rounded-xl">
            <span className="text-slate-400 block text-[10px]">Email Address</span>
            <strong className="text-slate-900 dark:text-white text-sm">{user.email}</strong>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
              {user.email_verified ? "Verified" : "Unverified"}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-navy-950 rounded-xl">
            <span className="text-slate-400 block text-[10px]">Assigned Role</span>
            <strong className="text-slate-900 dark:text-white text-sm uppercase">{user.role}</strong>
          </div>
        </div>
      </div>

      {/* Post-Quantum ML-DSA Cryptographic Key Management */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-navy-800 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-qblue-600" />
              <span>NIST FIPS 204 ML-DSA Cryptographic Keys</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate and register your post-quantum public keys used to digitally sign escrow transitions.
            </p>
          </div>

          <button
            onClick={handleGenerateKeypair}
            disabled={keyLoading}
            className="px-3.5 py-1.5 bg-qblue-600 hover:bg-qblue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Generate New Keypair</span>
          </button>
        </div>

        {keyMsg && (
          <div
            className={`p-3 rounded-lg text-xs border ${
              keyMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {keyMsg.text}
          </div>
        )}

        {/* Key Generation Modal / Card */}
        {generatedKeypair && (
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                Newly Generated {generatedKeypair.algorithm} Keypair
              </span>
              <button
                onClick={() => setGeneratedKeypair(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Dismiss
              </button>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
              <strong>Custody Notice:</strong> In this academic prototype, the secret key is displayed for verification. In production, secret keys remain in local user-controlled storage or hardware tokens. Never share your secret key.
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Public Key Hex:</span>
              <div className="font-mono text-xs bg-white dark:bg-navy-900 p-2 rounded border border-slate-200 dark:border-navy-800 text-slate-800 dark:text-slate-200 break-all max-h-20 overflow-y-auto">
                {generatedKeypair.public_key_hex}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Secret Key Hex (Save Offline):</span>
              <div className="font-mono text-xs bg-white dark:bg-navy-900 p-2 rounded border border-slate-200 dark:border-navy-800 text-slate-800 dark:text-slate-200 break-all max-h-20 overflow-y-auto">
                {generatedKeypair.secret_key_hex}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="text"
                placeholder="Key label (e.g. Workstation Key)"
                value={keyLabel}
                onChange={(e) => setKeyLabel(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white"
              />
              <button
                onClick={handleRegisterKey}
                disabled={keyLoading}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                Register Public Key to Account
              </button>
            </div>
          </div>
        )}

        {/* Existing Keys Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-navy-800">
              <tr>
                <th className="px-4 py-3">Label & Algorithm</th>
                <th className="px-4 py-3">SHA-256 Fingerprint</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-900 dark:text-white block">{k.label}</span>
                    <span className="font-mono text-[10px] text-qblue-600 dark:text-qblue-400">{k.algorithm}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                    {k.key_fingerprint.substring(0, 16)}...
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        k.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {k.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {k.status === "ACTIVE" && (
                      <button
                        onClick={() => handleRevokeKey(k.id)}
                        className="text-rose-600 hover:text-rose-700 text-xs font-semibold"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Factor Authentication (TOTP) */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-indigo-600" />
          <span>Two-Factor Authentication (TOTP)</span>
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Add an extra layer of defense using Google Authenticator, Authy, or any RFC 6238 compatible app.
        </p>

        {mfaMsg && (
          <div
            className={`p-3 rounded-lg text-xs border ${
              mfaMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {mfaMsg.text}
          </div>
        )}

        {!mfaData && mfaBackupCodes.length === 0 && (
          <button
            onClick={handleSetupMfa}
            disabled={mfaLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Configure Authenticator App
          </button>
        )}

        {mfaData && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-4 max-w-md">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Scan QR Code with Authenticator
              </span>
              <img
                src={mfaData.qr_code_base64}
                alt="TOTP QR Code"
                className="w-44 h-44 mx-auto rounded-lg border border-slate-200"
              />
              <p className="font-mono text-xs text-slate-500 break-all select-all">
                Secret: {mfaData.secret}
              </p>
            </div>

            <form onSubmit={handleVerifyEnableMfa} className="space-y-3">
              <input
                type="text"
                required
                maxLength={6}
                placeholder="Enter 6-digit verification code"
                value={totpVerifyCode}
                onChange={(e) => setTotpVerifyCode(e.target.value)}
                className="w-full text-center tracking-widest font-mono px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900"
              />
              <button
                type="submit"
                disabled={mfaLoading}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
              >
                Verify & Activate MFA
              </button>
            </form>
          </div>
        )}

        {mfaBackupCodes.length > 0 && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
            <strong className="text-xs font-bold text-emerald-800 dark:text-emerald-200 block">
              Save These Backup Recovery Codes (Offline Only):
            </strong>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs font-bold text-emerald-900 dark:text-emerald-100">
              {mfaBackupCodes.map((c, i) => (
                <div key={i} className="p-2 bg-white dark:bg-navy-900 rounded border border-emerald-200 text-center select-all">
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Change Password Form */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-qblue-600" />
          <span>Change Password</span>
        </h3>

        {pwdMsg && (
          <div
            className={`p-3 rounded-lg text-xs border ${
              pwdMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {pwdMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password (min 8 characters)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={pwdLoading}
            className="px-4 py-2 bg-qblue-600 hover:bg-qblue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            {pwdLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Active Sessions */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Active User Sessions ({sessions.length})
          </h3>
          <button
            onClick={handleLogoutAll}
            className="text-xs font-semibold text-rose-600 hover:underline"
          >
            Revoke All Other Sessions
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-navy-800 text-xs">
          {sessions.map((s) => (
            <div key={s.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  IP: {s.ip_address || "Unknown IP"}
                </span>
                <span className="text-slate-400 text-[11px]">{s.user_agent || "Web Client"}</span>
              </div>
              <button
                onClick={() => handleRevokeSession(s.id)}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
