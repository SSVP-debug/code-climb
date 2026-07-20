import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { SITE_DOMAIN } from "../config/site.js";
import { CheckCircle2, XCircle } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CertVerifyPage() {
  const { code } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/cert/verify/${code}`)
      .then(r => r.json())
      .then(d => { setResult(d); setLoading(false); });
  }, [code]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className={`max-w-md w-full bg-zinc-900 border rounded-2xl p-8 text-center ${
        result?.valid ? "border-green-500/40" : "border-red-500/40"
      }`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
          result?.valid ? "bg-verdict-accept/10 text-verdict-accept" : "bg-verdict-reject/10 text-verdict-reject"
        }`}>
          {result?.valid ? (
            <CheckCircle2 size={30} strokeWidth={2} aria-hidden="true" />
          ) : (
            <XCircle size={30} strokeWidth={2} aria-hidden="true" />
          )}
        </div>
        <h1 className="text-xl font-black text-white mb-2">
          {result?.valid ? "Certificate Verified" : "Invalid Certificate"}
        </h1>
        {result?.valid ? (
          <div className="space-y-2 text-sm text-zinc-400 mt-4">
            <p><span className="text-zinc-500">Issued to:</span> <span className="text-white font-semibold">{result.displayName}</span></p>
            <p><span className="text-zinc-500">Track:</span> <span className="text-green-400 font-semibold">{result.trackName}</span></p>
            <p><span className="text-zinc-500">Issued on:</span> {new Date(result.issuedAt).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}</p>
            <p><span className="text-zinc-500">Certificate ID:</span> <span className="font-mono text-xs">{result.verifyCode}</span></p>
          </div>
        ) : (
          <p className="text-zinc-500 text-sm mt-2">{result?.error || "This certificate could not be verified."}</p>
        )}
        <a href="/" className="inline-block mt-6 text-xs text-zinc-600 hover:text-zinc-400 transition">
          {SITE_DOMAIN}
        </a>
      </div>
    </div>
  );
}