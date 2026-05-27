export function parseJudge0Result(result) {
  const stdout = result?.stdout ?? "";
  const stderr = result?.stderr ?? "";
  const compileOutput = result?.compile_output ?? "";
  const status =
    result?.status?.description ?? "Unknown";

  const time = result?.time ?? null;
  const memory = result?.memory ?? null;

  let kind = "empty";

  if (compileOutput) {
    kind = "compile";
  } else if (
    stderr ||
    status.toLowerCase().includes("runtime")
  ) {
    kind = "runtime";
  } else if (stdout) {
    kind = "success";
  } else if (
    status.toLowerCase().includes("internal") ||
    status.toLowerCase().includes("server")
  ) {
    kind = "infra";
  }

  return {
    stdout,
    stderr,
    compileOutput,
    status,
    time,
    memory,
    kind,
  };
}