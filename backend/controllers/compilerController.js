const JUDGE0_LANGUAGE_NAMES = {
  54: "C++",
  62: "Java",
  63: "JavaScript",
  71: "Python",
};

export async function runCode(req, res) {
  const { source_code, language_id, stdin = "" } = req.body;

  if (!source_code || language_id === undefined) {
    return res.status(400).json({
      error: "source_code and language_id are required",
    });
  }

  const judge0Url =
    process.env.JUDGE0_API_URL ||
    "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";

  const langName =
    JUDGE0_LANGUAGE_NAMES[language_id] ||
    `id:${language_id}`;

  console.log(
    `[Compiler] Run request — language=${langName} (${language_id}), source_length=${source_code.length}, stdin_length=${stdin.length}`
  );

  try {
    const response = await fetch(judge0Url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_code,
        language_id,
        stdin,
      }),
      signal: AbortSignal.timeout(20000),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        `[Compiler] Judge0 HTTP ${response.status}:`,
        data?.message || data
      );
      return res.status(response.status).json(data);
    }

    const statusDesc =
      data.status?.description || "Unknown";

    console.log(
      `[Compiler] Judge0 status=${statusDesc}, stdout_len=${(data.stdout || "").length}, stderr_len=${(data.stderr || "").length}`
    );

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[Compiler] stdout preview:`,
        (data.stdout || "").slice(0, 120)
      );
      if (data.stderr) {
        console.log(
          `[Compiler] stderr preview:`,
          data.stderr.slice(0, 200)
        );
      }
    }

    res.json(data);
  } catch (error) {
    console.error(
      "[Compiler] Judge0 proxy error:",
      error.message
    );
    res.status(502).json({
      stderr: error.message || "Failed to reach Judge0",
      status: { id: 13, description: "Internal Error" },
    });
  }
}
