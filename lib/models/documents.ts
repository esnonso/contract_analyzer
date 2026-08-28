import { ObjectId } from "mongodb";
import { getDatabase } from "../mongodb";

export type DocumentRecord = {
  _id?: ObjectId;
  documentName: string;
  originalDocumentName: string;
  timeStamps: {
    createdAt: Date;
    updatedAt: Date;
  };
};

export async function getDocumentsCollection() {
  const database = await getDatabase();
  const collection = database.collection<DocumentRecord>("documents");
  await collection.createIndex(
    { originalDocumentName: 1 },
    { unique: true, sparse: true, name: "unique_original_document_name" },
  );
  return collection;
}