import { ObjectId } from "mongodb";
import { getDocumentChunksCollection } from "../../../../lib/models/document-chunks";
import { getDocumentsCollection } from "../../../../lib/models/documents";

type DocumentRouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function GET(request: Request, context: DocumentRouteContext) {
  try {
    const { documentId } = await context.params;

    if (!ObjectId.isValid(documentId)) {
      return Response.json({ error: "Invalid document id." }, { status: 400 });
    }

    const id = new ObjectId(documentId);
    const documents = await getDocumentsCollection();
    const document = await documents.findOne({ _id: id });

    if (!document) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }

    const documentChunks = await getDocumentChunksCollection();
    const savedChunks = await documentChunks.find({ documentRefId: id }).sort({ chunkIndex: 1 }).toArray();

    return Response.json({
      documentId: id.toHexString(),
      documentName: document.documentName,
      fileName: document.originalDocumentName,
      text: savedChunks.map((chunk) => chunk.chunkText).join("\n\n"),
      chunks: savedChunks.map((chunk) => ({
        index: chunk.chunkIndex,
        title: chunk.sectionTitle,
        text: chunk.chunkText,
        characterCount: chunk.chunkText.length,
      })),
    });
  } catch (error) {
    console.error("Error loading document:", error);
    return Response.json({ error: "The document could not be loaded." }, { status: 500 });
  }
}