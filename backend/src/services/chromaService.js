import { env } from "../config/env.js";

function chromaEndpoint() {
  if (env.CHROMA_URL) {
    return `${env.CHROMA_URL}/api/v1/collections/${env.CHROMA_COLLECTION_NAME}/query`;
  }

  if (env.CHROMA_HOST && env.CHROMA_TENANT && env.CHROMA_DATABASE) {
    const host = env.CHROMA_HOST.startsWith("http") ? env.CHROMA_HOST : `https://${env.CHROMA_HOST}`;
    return `${host}/api/v1/tenants/${env.CHROMA_TENANT}/databases/${env.CHROMA_DATABASE}/collections/${env.CHROMA_COLLECTION_NAME}/query`;
  }

  return null;
}

export async function retrieveTemplates(requirement) {
  try {
    const endpoint = chromaEndpoint();
    if (!endpoint) return [];

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.CHROMA_API_KEY ? { "x-chroma-token": env.CHROMA_API_KEY, Authorization: `Bearer ${env.CHROMA_API_KEY}` } : {})
      },
      body: JSON.stringify({
        query_texts: [requirement],
        n_results: 6,
        include: ["documents", "metadatas"]
      })
    });

    if (!response.ok) throw new Error(`Chroma responded with ${response.status}`);
    const payload = await response.json();
    return (payload.documents?.[0] || []).filter(Boolean);
  } catch (error) {
    console.warn("Chroma retrieval unavailable, continuing without templates:", error.message);
    return [];
  }
}
