import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function TrackCard({ track, onClaim }) {
  const [claiming, setClaiming] = useState(false);

  async function handleClaim() {
    setClaiming(true);
    const data = await apiFetch(`/api/cert/claim/${track.id}`, { method: "POST" });
    setClaiming(false);
    if (data.error) {
      toast.error(data.error);
      return;
    }
    onClaim();
  }

  async function downloadPDF(verifyCode) {
    const { getIdToken } = await import("../services/auth");
    const token = await getIdToken();
    const r = await fetch(`${API}/api/cert/${verifyCode}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `codeclub_cert_${verifyCode}.pdf`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`bg-zinc-900 border rounded-2xl p-5 transition ${
      track.certified ? "border-green-500/40" : track.complete ? "border-yellow-500/30" : "border-zinc-800"
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-white">{track.name}</h3>
          <p className="text-zinc-500 text-xs mt-0.5">{track.topic} · {track.minSolve} problems required</p>
        </div>
        {track.certified && <span className="text-xs bg-green-500/10 border border-green-500/30 text-green-400 px-2.5 py-1 rounded-full font-semibold">✓ Certified</span>}
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-zinc-500 mb-1">
          <span>{track.solved} / {track.minSolve} solved</span>
          <span>{track.progress}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${track.certified ? "bg-green-500" : track.complete ? "bg-yellow-500" : "bg-zinc-600"}`}
            style={{ width: `${track.progress}%` }} />
        </div>
      </div>

      {track.certified ? (
        <button onClick={() => downloadPDF(track.verifyCode)}
          className="w-full py-2 rounded-xl text-sm bg-green-600/20 hover:bg-green-600/30 text-green-400 font-semibold border border-green-500/20 transition">
          ⬇ Download Certificate
        </button>
      ) : track.complete ? (
        <button onClick={handleClaim} disabled={claiming}
          className="w-full py-2 rounded-xl text-sm bg-yellow-500 hover:bg-yellow-400 text-black font-semibold disabled:opacity-50 transition">
          {claiming ? "Claiming…" : "🏆 Claim Certificate"}
        </button>
      ) : (
        <p className="text-center text-zinc-600 text-xs py-1">
          {track.minSolve - track.solved} more {track.topic} problems to unlock
        </p>
      )}
    </div>
  );
}

export default function CertificationsPage() {
  const [tracks, setTracks]   = useState([]);
  const [loading, setLoading] = useState(true);

  function fetchTracks() {
    apiFetch("/api/cert/tracks")
      .then(d => { setTracks(d.tracks || []); setLoading(false); });
  }

  useEffect(() => { fetchTracks(); }, []);

  // Merge verifyCode into tracks
  const enriched = tracks; // verifyCode already in track if certified

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const certified = tracks.filter(t => t.certified).length;
  const complete  = tracks.filter(t => t.complete && !t.certified).length;

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white mb-1">Certifications</h1>
          <p className="text-zinc-500 text-sm">
            {certified} earned · {complete} ready to claim · {tracks.length - certified - complete} in progress
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map(t => <TrackCard key={t.id} track={t} onClaim={fetchTracks} />)}
        </div>
      </div>
    </div>
  );
}