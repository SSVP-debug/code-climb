export async function runCode(
  sourceCode,
  languageId,
  stdin = ""
) {

  try {

    const response = await fetch(
      "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          source_code: sourceCode,
          language_id: languageId,
          stdin: stdin
        }),
      }
    );

    const data = await response.json();

    return data;

  } catch (error) {

    console.error("Compiler Error:", error);

  }
}