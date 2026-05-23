export function generateDriverCode(
  language,
  userCode,
  testcaseInput,
  functionName
) {

  const values =
    Object.values(testcaseInput);

  // PYTHON
  if (language === "python") {

    return `
${userCode}

print(
  ${functionName}(
    ${values
      .map((v) =>
        JSON.stringify(v)
      )
      .join(",")}
  )
)
`;
  }

  // JAVASCRIPT
  if (language === "javascript") {

    return `
${userCode}

console.log(
  ${functionName}(
    ${values
      .map((v) =>
        JSON.stringify(v)
      )
      .join(",")}
  )
);
`;
  }

  return userCode;
}