export function getStorageData(
  key,
  defaultValue = null
) {

  const data =
    localStorage.getItem(key);

  if (!data) {

    return defaultValue;

  }

  return JSON.parse(data);

}

export function setStorageData(
  key,
  value
) {

  localStorage.setItem(
    key,
    JSON.stringify(value)
  );

}

export function removeStorageData(
  key
) {

  localStorage.removeItem(key);

}