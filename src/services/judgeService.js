import { apiFetch } from "./api";
import { classifyJudgeError } from "../utils/judgeErrorTaxonomy";
import { buildRunRequestBody, buildSubmitRequestBody } from "../../shared/contracts/judgeRequestContract";

export const judgeSubmission = async ({
  problem,
  code,
  language,
  onProgress,
  // Fest Readiness Audit, P0-1: passed straight through to the server,
  // which is the only place that decides whether it actually earns
  // contest credit (see backend/controllers/judgeController.js
  // submitHandler + backend/services/contestScoring.js). Sending this
  // does not, by itself, grant anything.
  contestId,
}) => {
  // Frontend guardrail (execution-contract audit, item #5): don't even
  // attempt the request if the problem we have doesn't have enough
  // identity to grade against. This is a developer-facing configuration
  // problem (e.g. `problem` loaded from a stale/partial state), not a
  // judge/runtime failure — surface it as one distinctly rather than
  // sending a request we already know the backend will 400 on.
  if (!problem?.slug) {
    const message = "Execution configuration error: no problem is loaded to submit against.";
    console.error("[judgeSubmission]", message);
    return { status: "Judge Error", error: message, passed: 0, total: 0 };
  }

  // Signal to UI that judging has started
  if (onProgress) {
    onProgress({ current: 0, total: 1 });
  }

  try {
    const result = await apiFetch("/api/judge/submit", {
      method: "POST",
      // Built from the SAME canonical contract backend/routes/judge.js
      // validates against and backend/routes/judge.contract.test.js
      // checks in CI — see shared/contracts/judgeRequestContract.js.
      // Visible testcases are NOT secret — safe to send from frontend.
      // Hidden testcases are loaded server-side by the backend.
      body: JSON.stringify(buildSubmitRequestBody({ problem, code, language, contestId })),
    });

    return result;

  } catch (error) {
    console.error("[judgeSubmission] Error:", error.message);

    // Classify by HTTP status (see judgeErrorTaxonomy.js) so a 400
    // contract/validation problem reads differently from a genuine
    // infra outage — status stays "Judge Error" either way (that's
    // already its own distinct, non-"Runner Unavailable" UI bucket —
    // see WorkspacePanel.jsx's `kind="judge"`), but the message itself
    // is now specific instead of a bare passthrough of error.message.
    const { message } = classifyJudgeError(error);

    // Return a Judge-shaped error so ProblemDetailsPage doesn't crash
    return {
      status: "Judge Error",
      error: message,
      passed: 0,
      total: 0,
    };
  }
};


export const runTestcases = async ({ problem, code, language }) => {
  // Frontend guardrail (execution-contract audit, item #5): `problemSlug`
  // is what lets the backend resolve the entire execution contract
  // (functionName/returnType/comparisonMode/operationSequence) server-
  // side — see runHandler's doc comment in
  // backend/controllers/judgeController.js. Without it, Run has no way
  // to know what to grade against. Catch that here, before spending a
  // network round trip on a request the backend can only ever reject,
  // and report it as a clear configuration error rather than letting it
  // surface as a generic/backend-shaped failure.
  if (!problem?.slug) {
    const message = "Execution configuration error: no problem is loaded to run against.";
    console.error("[runTestcases]", message);
    return { results: [], compileFailed: false, error: message, errorKind: "config" };
  }

  try {
    const result = await apiFetch("/api/judge/run", {
      method: "POST",
      // Built from the SAME canonical contract backend/routes/judge.js
      // validates against and backend/routes/judge.contract.test.js
      // checks in CI — see shared/contracts/judgeRequestContract.js.
      // functionName/returnType/comparisonMode/operationSequence are
      // resolved SERVER-SIDE from the problem's own record via
      // problemSlug (see backend/controllers/judgeController.js
      // runHandler) — the same trust model submitHandler already used,
      // now applied to Run too (audit finding P1-1). Not sent from here
      // anymore; sending them would have no effect server-side.
      body: JSON.stringify(buildRunRequestBody({ problem, code, language })),
    });

    return result; // { results: [...], compileFailed: bool, error?: string }

  } catch (error) {
    console.error("[runTestcases] Error:", error);

    // Classify by HTTP status (see judgeErrorTaxonomy.js) instead of
    // collapsing every failure into one generic string. `errorKind` lets
    // WorkspacePanel.jsx / SubmissionResultBanner.jsx show a distinct
    // header ("Execution configuration error" vs "Runner Unavailable"
    // vs "Authentication required") instead of always defaulting to
    // "Runner Unavailable" — the exact bug this audit started from: a
    // 400 validation error read identically to Judge0 actually being
    // down.
    const { kind, message } = classifyJudgeError(error);

    return {
      results: [],
      compileFailed: false,
      error: message,
      errorKind: kind,
    };
  }
};