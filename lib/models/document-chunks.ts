import { ObjectId } from "mongodb";
import { getDatabase } from "../mongodb";

export type DocumentChunkRecord = {
  _id?: ObjectId;
  documentRefId: ObjectId;
  documentName: string;
  sectionNumber: number;
  sectionTitle: string;
  chunkIndex: number;
  pageStart: number;
  pageEnd: number;
  chunkText: string;
  embedding: number[];
};

export type RetrievedDocumentChunk = Pick<
  DocumentChunkRecord,
  "sectionTitle" | "chunkText" | "chunkIndex" | "documentRefId"
> & {
  score: number;
};

export async function getDocumentChunksCollection() {
  const database = await getDatabase();
  return database.collection<DocumentChunkRecord>("documentChunks");
}

export async function searchDocumentChunks(documentRefId: ObjectId, queryEmbedding: number[]) {
  const collection = await getDocumentChunksCollection();
  return collection.aggregate<RetrievedDocumentChunk>([
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: 8,
        filter: { documentRefId },
      },
    },
    {
      $project: {
        _id: 0,
        documentRefId: 1,
        sectionTitle: 1,
        chunkText: 1,
        chunkIndex: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]).toArray();
}