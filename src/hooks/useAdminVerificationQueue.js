/**
 * useAdminVerificationQueue.js
 *
 * Loads pending recruiter/TPO/student-college-request verification
 * requests and exposes approve/reject actions with per-row busy state.
 *
 * Extracted from src/pages/AdminConsolePage.jsx (Staff review §4/§9/#12).
 * Extended (plan 001 §6.6) to add a third queue — colleges requested via
 * a student's college-email verification flow, as distinct from a TPO's
 * registration request.
 */
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";

export function useAdminVerificationQueue() {
  const [loading, setLoading] = useState(true);
  const [recruiters, setRecruiters] = useState([]);
  const [tpos, setTpos] = useState([]);
  const [studentCollegeRequests, setStudentCollegeRequests] = useState([]);
  // Tracks which row is mid-request so its own buttons show a spinner
  // without disabling the rest of the queue: { [id]: "approve" | "reject" }
  const [busyIds, setBusyIds] = useState({});

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/admin/pending");
      setRecruiters(data.recruiters || []);
      setTpos(data.tpos || []);
      setStudentCollegeRequests(data.studentCollegeRequests || []);
    } catch (err) {
      toast.error(err.message || "Failed to load the approval queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  async function actOnRecruiter(id, action) {
    setBusyIds((b) => ({ ...b, [id]: action }));
    try {
      await apiFetch(`/api/admin/recruiters/${id}/${action}`, { method: "POST" });
      setRecruiters((list) => list.filter((r) => r.id !== id));
      toast.success(action === "approve" ? "Recruiter approved." : "Recruiter request rejected.");
    } catch (err) {
      toast.error(err.message || `Failed to ${action} recruiter.`);
    } finally {
      setBusyIds((b) => {
        const next = { ...b };
        delete next[id];
        return next;
      });
    }
  }

  async function actOnTpo(collegeId, action) {
    setBusyIds((b) => ({ ...b, [collegeId]: action }));
    try {
      await apiFetch(`/api/admin/tpo/${collegeId}/${action}`, { method: "POST" });
      setTpos((list) => list.filter((t) => t.collegeId !== collegeId));
      toast.success(action === "approve" ? "College verified." : "TPO request rejected.");
    } catch (err) {
      toast.error(err.message || `Failed to ${action} TPO request.`);
    } finally {
      setBusyIds((b) => {
        const next = { ...b };
        delete next[collegeId];
        return next;
      });
    }
  }

  async function actOnStudentCollege(collegeId, action) {
    setBusyIds((b) => ({ ...b, [collegeId]: action }));
    try {
      await apiFetch(`/api/admin/student-colleges/${collegeId}/${action}`, { method: "POST" });
      setStudentCollegeRequests((list) => list.filter((c) => c.collegeId !== collegeId));
      toast.success(action === "approve" ? "College approved." : "College request rejected.");
    } catch (err) {
      toast.error(err.message || `Failed to ${action} college request.`);
    } finally {
      setBusyIds((b) => {
        const next = { ...b };
        delete next[collegeId];
        return next;
      });
    }
  }

  return {
    loading,
    recruiters,
    tpos,
    studentCollegeRequests,
    busyIds,
    pendingCount: recruiters.length + tpos.length + studentCollegeRequests.length,
    actOnRecruiter,
    actOnTpo,
    actOnStudentCollege,
  };
}