const rawBaseUrl = import.meta.env.VITE_API_URL || "";
const BASE_URL = rawBaseUrl.replace(/\/$/, "");

function buildUrl(path) {
  return BASE_URL ? `${BASE_URL}${path}` : path;
}

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export async function submitQuery({ query, language, location, cropType, soilData }) {
  const res = await fetch(buildUrl("/api/advise"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      language,
      location,
      crop_type: cropType,
      soil_data: soilData || null,
    }),
  });
  return handleResponse(res);
}

export async function submitImageQuery({ imageFile, query, location, cropType, language }) {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("query", query);
  formData.append("location", location);
  formData.append("crop_type", cropType || "");
  formData.append("language", language);

  const res = await fetch(buildUrl("/api/advise/image"), {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

export async function getAuditTrail(sessionId) {
  const res = await fetch(buildUrl(`/api/audit/${sessionId}`));
  return handleResponse(res);
}

export async function getMandiPrices(crop, location) {
  const res = await fetch(
    buildUrl(`/api/mandi/prices?crop=${encodeURIComponent(crop)}&location=${encodeURIComponent(location)}`)
  );
  return handleResponse(res);
}

export async function checkPesticide(name) {
  const res = await fetch(
    buildUrl(`/api/compliance/pesticides?name=${encodeURIComponent(name)}`)
  );
  return handleResponse(res);
}
