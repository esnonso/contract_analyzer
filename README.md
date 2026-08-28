This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install all dependencies:
```bash
npm install

```

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Semantic document questions

The question flow uses MongoDB Atlas Vector Search. The `documentChunks` collection uses the existing vector search index named `vector_index` with this definition:

```json
{
	"fields": [
		{
			"type": "vector",
			"path": "embedding",
			"numDimensions": 768,
			"similarity": "cosine"
		},
		{
			"type": "filter",
			"path": "documentRefId"
		}
	]
}
```
# DEPLOYED APPLICATION
>https://contract-analyzer-topaz-nine.vercel.app/

# Problem & Solution

## 01 — Who has this problem?

Manual contract review is tedious, expensive, and often considered a source of drudgery. Paying people to review contract incur high costs and  Because of these high costs, small businesses and individuals often sign contracts without reading them. Contract-heavy professionals and businesses that regularly need to review, understand, and extract information from legal documents spend a lot reviewing contracts. Legal practitioners also find it difficult going through several pages of a contract to pick a few details and they find it exhausting and time consuming. 

This includes:
* Everyday Individuals
* Lawyers and legal teams
* Business owners and managers
* HR professionals reviewing employment agreements
* Procurement and operations teams
* Freelancers and consultants
* Companies handling large volumes of contracts

The problem becomes especially significant for organizations that have to review many lengthy contracts and cannot afford to manually read every page each time they need a specific piece of information.

## 02 — What bottleneck makes it worth solving?

The main bottleneck is **manually finding, understanding, and comparing important information across lengthy contracts**.

A contract can contain dozens or hundreds of pages, while the user may only need answers to a few specific questions.

For example:

> "When can either party terminate this agreement?"

> "What are the payment terms?"

> "Is there a non-compete clause?"

> "What happens when the contract expires?"

> "What are the risks and bottlenecks?"

> "What is the summary of this contract?"

> "And so much more..."

Finding these answers manually requires searching through the document, reading surrounding clauses, interpreting legal language, and verifying that the answer is supported by the actual contract.

This becomes slow and repetitive when multiple contracts must be reviewed.

The Contract Analyzer addresses this bottleneck by allowing users to upload a contract and ask questions in natural language. The system retrieves the most relevant portions of the document and uses an LLM to generate an answer based on that evidence.

## 03 — Does the agent solve it well?

Yes. The agent is designed to answer questions using the contents of the uploaded contract rather than relying solely on the model's general knowledge.

The workflow is:

**Upload Contract → Text Extraction → Chunking → Embeddings → Vector Search → Relevant Evidence → LLM → Answer**

When a user asks a question, the system searches the contract for semantically relevant sections, provides those sections as evidence to the LLM, and generates an answer from the retrieved content.

This approach helps the agent:

* Find relevant clauses in lengthy contracts
* Answer natural-language questions
* Reduce the amount of manual searching required
* Ground responses in the uploaded document
* Provide the relevant contract evidence behind an answer

The system can therefore turn a lengthy contract into an interactive source of information rather than requiring the user to manually search through every page.

## 04 — Can another person reproduce the result?

Yes.

The system is built from scratch starting August 28 using reproducible pipeline that can be replicated by anyone. The agent used is `GitHub CoPilot`. I give it the prompts and it creates the needed component. Because the process is deterministic at the application level and the components are clearly defined, another developer can reproduce the same architecture using NextJs, environment variables[`database connection & Gemini Api Key`], database configuration [MongoDB], embedding model[GoogleGemini], and LLM configuration[GoogleGemini].

## THOUGHT PROCESS/ PIPELINE/ ARCHITECTURE

1. Upload a contract PDF - .
2. Extract the document text.
3. Divide the document into meaningful chunks.
4. Generate embeddings for the chunks.
5. Store the chunks and embeddings in MongoDB.
6. Perform vector similarity search when a question is asked.
7. Retrieve the most relevant contract evidence.
8. Send the evidence and question to the LLM.
9. Generate the final answer.


The system can also be evaluated using publicly available contract datasets such as CUAD, allowing the retrieval and question-answering performance to be tested against real contracts and expert annotations. This model can also be used with a few tweaks to compare CV's for hiring managers, compare research documents and more.

## PROPMPTS USED FOR AGENT (GITHUB COPILOT).
1. Create a components folder, create a form that allows only pdf file upload with an input for the document name. This should be the landing page

2. When I upload a document and hit the submit button, it should send the server, extract the texts on the document and return to me as plain text in another page that will be "/document/view

3. Add a function that breaks the document into chunks before displaying. Choose the best size for these chunks because each chunk will be embedded later on to be used for mongodb vector search

4. Make each chunk to have a title based on what is contained in the chunk and Make each chunk overlap by 30 words so the beginngs will always have meanings. The titles do not really have meanings

5. Add a mongoDB connection and two models One for documents and another for documentChunks. Each document uploaded will be stored in document. The document model will have {documentName: string, timeStamps}. Each chunk will be stored in a documentChunks. The documentChunk model will have {
  documentRefId:ref.Document.Id
   documentName:string
  "sectionNumber": number,
  "sectionTitle": string,
  "chunkIndex": number,
  "pageStart": number,
  "pageEnd": number,
  "chunkText": string,
  "embedding": Array
}. I have my mongoDb database connection string stored under MONGO_DB_URI in my env file.

6. I am using google gemini to create embeddings. The free my api key is the env variables as GEMINI_API_KEY. For each chuck create embeddings for it so when I upload a document. It saves the document and documentChunks to my mongodb database

7. Modify the document view page to display the saved name of the document uploaded, the documentId, and an input that a user can use to ask any question about the document.

8. Also add a unique column in the documentField to save the original name of the uploaded document, so when a user uploads a document that they have uploaded once, It redirects them to the view page without performing chunking and embedding

9. When a user hits the ask button, perform a semantic search on all chunks related to this particular document to get the the chunks most related to the question and send it to gemini for gemini to use those pieces of material it receives and give the best and most intelligent answer, BASED ON THESE CHUNKS SENT TO IT. It should use these chunks alongside it's title from the documents to analyse the document to spot risks, summarize, explain, etc. So MongoDb looks up evidence and Gemini explains the evidence intelligently.

10. Create a page to view all uploaded documents, and when I click view on each document, It takes me to the document/view for that document

## ENVIRONMENT VARIABLES
Create an env file and have these two variables
>MONGO_DB_URI
>GEMINI_API_KEY`