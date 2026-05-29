export function getStatusColor(status) {
  if (
    status?.includes("Accepted")
  ) {
    return "text-green-400";
  }

  if (
    status?.includes("Wrong")
  ) {
    return "text-yellow-400";
  }

  if (
    status?.includes("Runtime")
  ) {
    return "text-red-400";
  }

  if (
    status?.includes("Compile")
  ) {
    return "text-orange-400";
  }

  return "text-zinc-400";
}