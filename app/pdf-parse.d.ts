declare module "pdf-parse" {
  type PdfParseResult = {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown> | null;
    version: string;
  };

  export default function pdf(dataBuffer: Buffer): Promise<PdfParseResult>;
}
