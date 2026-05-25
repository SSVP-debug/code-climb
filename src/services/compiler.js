export async function runCode(
  sourceCode,
  languageId,
  stdin = ""
) {

  try {

    const response = await fetch(
      API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(data),

        signal:
          AbortSignal.timeout(10000),
      }
    );

    const data = await response.json();

    return data;

  } catch (error) {

    console.error("Compiler Error:", error);

  }
}