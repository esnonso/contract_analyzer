import pdf from "pdf-parse";
import { chunkDocument } from "../../../lib/document-chunking";
import { createDocumentEmbeddings } from "../../../lib/gemini";
import { getDocumentChunksCollection } from "../../../lib/models/document-chunks";
import { getDocumentsCollection } from "../../../lib/models/documents";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function GET() {
  try {
    const documents = await getDocumentsCollection();
    const savedDocuments = await documents
      .find({}, { projection: { documentName: 1, originalDocumentName: 1, timeStamps: 1 } })
      .sort({ "timeStamps.createdAt": -1 })
      .toArray();

    return Response.json(savedDocuments.map((document) => ({
      documentId: document._id?.toHexString(),
      documentName: document.documentName,
      fileName: document.originalDocumentName,
      timeStamps: document.timeStamps,
    })));
  } catch (error) {
    console.error("Error loading documents:", error);
    return Response.json({ error: "The documents could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // const documents = await getDocumentsCollection();
    // documents.deleteMany({  });
    //  const documentChunks = await getDocumentChunksCollection();
    //  documentChunks.deleteMany({ });
    //  return;
    const formData = await request.formData();
    const file = formData.get("documentFile");
    const documentName = formData.get("documentName");

    if (!(file instanceof File) || typeof documentName !== "string" || !documentName.trim()) {
      return Response.json({ error: "A document name and PDF file are required." }, { status: 400 });
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return Response.json({ error: "Only PDF files can be analysed." }, { status: 415 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "PDFs must be smaller than 25 MB." }, { status: 413 });
    }
    const documents = await getDocumentsCollection();
    const existingDocument = await documents.findOne({ originalDocumentName: file.name });

    if (existingDocument?._id) {
     const documentChunks = await getDocumentChunksCollection();
      const savedChunks = await documentChunks
        .find({ documentRefId: existingDocument._id })
        .sort({ chunkIndex: 1 })
        .toArray();
      const chunks = savedChunks.map((chunk) => ({
        index: chunk.chunkIndex,
        title: chunk.sectionTitle,
        text: chunk.chunkText,
        characterCount: chunk.chunkText.length,
      }));

      return Response.json({
        documentId: existingDocument._id.toHexString(),
        documentName: existingDocument.documentName,
        fileName: existingDocument.originalDocumentName,
        text: chunks.map((chunk) => chunk.text).join("\n\n"),
        chunks,
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await pdf(buffer);
    const text = result.text.trim();
    const savedDocumentName = documentName.trim();
    const chunks = chunkDocument(text);
    const embeddings = await createDocumentEmbeddings(chunks.map((chunk) => chunk.text));
    const now = new Date();
    const { insertedId } = await documents.insertOne({
      documentName: savedDocumentName,
      originalDocumentName: file.name,
      timeStamps: {
        createdAt: now,
        updatedAt: now,
      },
    });

    if (chunks.length) {
      const documentChunks = await getDocumentChunksCollection();
      await documentChunks.insertMany(
        chunks.map((chunk) => ({
          documentRefId: insertedId,
          documentName: savedDocumentName,
          sectionNumber: chunk.index + 1,
          sectionTitle: chunk.title,
          chunkIndex: chunk.index,
          pageStart: 0,
          pageEnd: 0,
          chunkText: chunk.text,
          embedding: embeddings[chunk.index],
        })),
      );
    }

    return Response.json({
      documentId: insertedId.toHexString(),
      documentName: savedDocumentName,
      fileName: file.name,
      text,
      chunks,
    });
  } catch(error) {
    console.error("Error processing document:", error);
    return Response.json({ error: "The PDF could not be read. Please try another file." }, { status: 422 });
  }
}
