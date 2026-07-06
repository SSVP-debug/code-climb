import { getJudge0Health } from "../services/judge0Health.js";

export function getCompilerHealth(req, res) {
  res.json(getJudge0Health());
}