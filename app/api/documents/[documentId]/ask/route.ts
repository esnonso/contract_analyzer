import { ObjectId } from "mongodb";
import { createQueryEmbedding, generateDocumentAnswer } from "../../../../../lib/gemini";
import { searchDocumentChunks } from "../../../../../lib/models/document-chunks";
import { getDocumentsCollection } from "../../../../../lib/models/documents";

type AskRouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function POST(request: Request, context: AskRouteContext) {
  try {
    const { documentId } = await context.params;
    const body = await request.json() as { question?: unknown };

    if (!ObjectId.isValid(documentId) || typeof body.question !== "string" || !body.question.trim()) {
      return Response.json({ error: "A valid document id and question are required." }, { status: 400 });
    }

    const id = new ObjectId(documentId);
    const documents = await getDocumentsCollection();
    const document = await documents.findOne({ _id: id });

    if (!document) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }

    const question = body.question.trim();
    const queryEmbedding = await createQueryEmbedding(question);
    const evidence = await searchDocumentChunks(id, queryEmbedding);

    if (!evidence.length) {
      return Response.json({ answer: "There is not enough evidence in this document to answer that question." });
    }

    const answer = await generateDocumentAnswer(document.documentName, question, evidence);
    return Response.json({ answer });
  } catch (error) {
    console.error("Error answering document question:", error);
    return Response.json({ error: "The question could not be answered." }, { status: 500 });
  }
}