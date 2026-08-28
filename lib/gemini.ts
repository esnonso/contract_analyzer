const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_BATCH_SIZE = 100;

type GeminiEmbeddingResponse = {
  embeddings?: Array<{
    values?: number[];
  }>;
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

async function createEmbeddings(texts: string[], taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY") {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const embeddings: number[][] = [];

  for (let start = 0; start < texts.length; start += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(start, start + EMBEDDING_BATCH_SIZE);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          requests: batch.map((text) => ({
            model: `models/${EMBEDDING_MODEL}`,
            content: { parts: [{ text }] },
            taskType,
            outputDimensionality: 768,
          })),
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini embedding request failed with status ${response.status}.`);
    }

    const result = (await response.json()) as GeminiEmbeddingResponse;
    const batchEmbeddings = result.embeddings?.map((embedding) => embedding.values ?? []);

    if (!batchEmbeddings || batchEmbeddings.length !== batch.length || batchEmbeddings.some((embedding) => !embedding.length)) {
      throw new Error("Gemini returned an invalid embedding response.");
    }

    embeddings.push(...batchEmbeddings);
  }

  return embeddings;
}

export function createDocumentEmbeddings(texts: string[]) {
  return createEmbeddings(texts, "RETRIEVAL_DOCUMENT");
}

export async function createQueryEmbedding(text: string) {
  const [embedding] = await createEmbeddings([text], "RETRIEVAL_QUERY");
  return embedding;
}

export async function generateDocumentAnswer(
  documentName: string,
  question: string,
  evidence: Array<{ sectionTitle: string; chunkText: string }>,
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const evidenceText = evidence
    .map((chunk, index) => `[Evidence ${index + 1}] ${chunk.sectionTitle}\n${chunk.chunkText}`)
    .join("\n\n");
    
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: "You answer questions about documents. Use only the supplied evidence. Do not invent facts or claim to have reviewed text that is not supplied. If the evidence is insufficient, say so clearly. Give a direct, intelligent answer and mention risks, implications, or useful explanations when relevant.",
          }],
        },
        contents: [{
          role: "user",
          parts: [{
            text: `Document title: ${documentName}\n\nQuestion: ${question}\n\nEvidence from this document:\n${evidenceText}`,
          }],
        }],
        generationConfig: {
          temperature: 0.2,
        },
      }),
    },
  );
   
  if (!response.ok) {
    throw new Error(`Gemini answer request failed with status ${response.status}.`);
  }

  const result = (await response.json()) as GeminiGenerateResponse;
  const answer = result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

  if (!answer) {
    throw new Error("Gemini returned an empty answer.");
  }

  return answer;
}