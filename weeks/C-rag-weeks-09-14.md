# Section C: RAG in depth (Weeks 9–14)

Everything here goes into the `CurriculumAssistant` solution from Week 4. By Week 14 it downloads the docs your plan links to, stores them in a real vector database, searches with keywords plus meaning, measures its own quality, and runs as a web API with a chat page.

**Courses for this section (optional, see [resources.md](../resources.md)):** the Coursera [Retrieval Augmented Generation (RAG)](https://www.coursera.org/learn/retrieval-augmented-generation-rag) course for Weeks 9–13, and the Docker sections of Udemy's [Docker and Kubernetes: The Complete Guide](https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/) for Week 10.
**roadmap.sh:** [AI Engineer](https://roadmap.sh/ai-engineer) (RAG and vector databases topics), [Docker](https://roadmap.sh/docker), [ASP.NET Core](https://roadmap.sh/aspnet-core).

---

## Week 9: Chunking and the plan's sources

**By the end of the week:** the assistant downloads every docs page the plan links to, turns it into clean text, and chunks it well.

### Day 1: Why chunking decides RAG quality

**Learn (~20 min)**
- [RAG chunking phase](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-chunking-phase) (Azure Architecture Center; the ideas apply to any platform)

**Do:** pick three of your eval questions. For each one, look at the chunk your Week 4 app retrieved, and note whether it was too short, too long, or cut through the middle of the answer.

**Done when:** you have a written list of three chunking problems you've seen in your own app.

### Day 2: Fixed-size chunks with overlap

**Topic:** overlap repeats the end of one chunk at the start of the next, so an answer that crosses a boundary isn't lost.

**Do:** in `Assistant.Core`, add `TextChunker.FixedSize(string text, int size = 800, int overlap = 150)`:
```csharp
public static List<string> FixedSize(string text, int size = 800, int overlap = 150)
{
    var chunks = new List<string>();
    for (int start = 0; start < text.Length; start += size - overlap)
    {
        int length = Math.Min(size, text.Length - start);
        chunks.Add(text.Substring(start, length));
        if (start + length >= text.Length) break;
    }
    return chunks;
}
```
Write xUnit tests: a 2,000-character text gives 3 chunks, and each chunk's last 150 characters match the start of the next chunk.

**Done when:** `dotnet test` passes.

### Day 3: Structure-aware chunks for Markdown

**Topic:** splitting on headings keeps each chunk about one topic. Prefix every chunk with its heading path, such as `Week 9 > Day 3`, so it still makes sense on its own.

**Do:** add `TextChunker.ByMarkdownHeadings(string markdown, int maxChars = 1200)`:
- Track the current `#`, `##`, and `###` headings as you read the lines.
- Start a new chunk at every heading.
- If a section is longer than `maxChars`, split it with `FixedSize`.
- Return `record Chunk(string HeadingPath, string Text)`.

**Done when:** a test proves that a sample file with two headings gives two chunks with the right heading paths, such as `Week 9 > Day 3: Structure-aware chunks for Markdown`.

### Day 4: Downloading the sources

**Do**
1. Add two packages: `dotnet add src/Assistant.Core package ReverseMarkdown` (HTML to Markdown) and `dotnet add src/Assistant.Core package AngleSharp` (HTML parsing).
2. Create `SourceFetcher` with `Task<SourceDoc?> FetchAsync(Uri url)`:
   - Download with `HttpClient`, using a 20-second timeout and a `User-Agent` header naming your app.
   - Use AngleSharp to take the `<main>` element if there is one, so you skip menus and footers.
   - Convert it with `new ReverseMarkdown.Converter().Convert(html)`.
   - Return `record SourceDoc(Uri Url, string Title, string Markdown, DateTimeOffset FetchedAt)`.
3. Add a CLI command, `sources fetch`, which collects every `https://` link in the plan (use the same regex as Week 5) and saves each page to `data/sources/<safe-file-name>.md`.

**Be polite:** fetch one page at a time with a one-second pause between pages, and skip pages that need a login, such as Udemy, Coursera, and LinkedIn.

**Done when:** `data/sources` holds readable Markdown versions of the Microsoft Learn pages linked in Weeks 1–4.

### Day 5: Metadata on every chunk

**Topic:** metadata is extra information stored with each chunk, such as its source, URL, week, and fetch date. It lets you filter results and cite sources.

**Do**
1. Define the record the rest of the year uses:
   ```csharp
   public record KnowledgeChunk(
       string Id,               // stable: hash of SourceId + HeadingPath + index
       string SourceType,       // "plan", "doc" or (later) "code"
       string SourceId,         // plan file name or URL
       string Title,
       string HeadingPath,
       string Text,
       int? Week,               // for plan chunks
       DateTimeOffset IndexedAt);
   ```
2. Fill in `Week` for plan chunks, and use the URL as `SourceId` for doc chunks.
3. Make `Id` deterministic with `Convert.ToHexString(SHA256.HashData(...))`, so re-indexing replaces chunks instead of duplicating them.

**Done when:** a test proves the same input always gives the same `Id`.

### Day 6: Curriculum Assistant 0.5, plan plus sources

**Do**
1. Add `index build`, which chunks the plan and every file in `data/sources`, embeds them, and saves them through your `VectorIndex` (still the JSON file).
2. Show citations as clickable URLs for doc chunks, and as "Week N Day M" for plan chunks.
3. Ask "What is cosine similarity?", which should cite the Microsoft Learn embeddings page, and "When do I learn it?", which should cite Week 3 Day 2.

**Done when:** one answer can cite both your plan and an official doc.

### Day 7: Review and catch-up (light)

- Push, and add the new `sources fetch` and `index build` commands to the README.
- On [roadmap.sh/ai-engineer](https://roadmap.sh/ai-engineer), tick the chunking topics.

---

## Week 10: Docker and a real vector database

**By the end of the week:** you understand Docker, and the assistant stores its vectors in Qdrant running in a container.

**Setup:** [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/). You already have it, so just make sure it's running.

### Day 1: Images, containers, and ports

**Learn (~20 min)**
- [What is a container?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/) and [What is an image?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/) (Docker docs)

**Do**
```powershell
docker run --rm hello-world
docker run -d --name web -p 8080:80 nginx
# now open http://localhost:8080
docker ps
docker logs web
docker stop web; docker rm web
```

**Done when:** you saw the nginx welcome page, and you can explain image, container, and port mapping.

### Day 2: Containerize a .NET app

**Learn (~15 min)**
- [Containerize a .NET app](https://learn.microsoft.com/en-us/dotnet/core/docker/build-container) (Microsoft Learn)

**Do:** add this `Dockerfile` to your Week 1 `LocalChat` project and build it:
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/runtime:10.0
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["dotnet", "LocalChat.dll"]
```
```powershell
docker build -t localchat .
docker run -it --rm localchat
```
Inside a container, `localhost` means the container itself, not your laptop. Change the Ollama address to `http://host.docker.internal:11434/` so it can reach Ollama on Windows.

**Done when:** the containerized app chats with your local model.

### Day 3: Volumes and Docker Compose

**Topic:** volumes keep data when a container is removed. Compose starts several containers from one file.

**Learn (~15 min)**
- [Persisting container data](https://docs.docker.com/get-started/docker-concepts/running-containers/persisting-container-data/) and [What is Docker Compose?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-docker-compose/)

**Do:** create `compose.yaml` in the `CurriculumAssistant` root:
```yaml
services:
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"   # HTTP API and dashboard
      - "6334:6334"   # gRPC, used by the .NET client
    volumes:
      - qdrant-data:/qdrant/storage
volumes:
  qdrant-data:
```
Run `docker compose up -d`, then open `http://localhost:6333/dashboard`.

**Done when:** the dashboard opens. Run `docker compose down` and then `docker compose up -d` again, and the data volume is still there.

### Day 4: Qdrant basics from C#

**Learn (~15 min)**
- [Qdrant quickstart](https://qdrant.tech/documentation/quickstart/), using the C# tab

**Do:** in a scratch console app, run `dotnet add package Qdrant.Client`, then:
```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var qdrant = new QdrantClient("localhost", 6334);
await qdrant.CreateCollectionAsync("test",
    new VectorParams { Size = 4, Distance = Distance.Cosine });

await qdrant.UpsertAsync("test", new List<PointStruct>
{
    new() { Id = 1, Vectors = new float[] { 0.1f, 0.9f, 0.1f, 0.1f }, Payload = { ["title"] = "Lambda" } },
    new() { Id = 2, Vectors = new float[] { 0.9f, 0.1f, 0.1f, 0.1f }, Payload = { ["title"] = "Pizza" } },
});

var hits = await qdrant.SearchAsync("test", new float[] { 0.2f, 0.8f, 0.1f, 0.1f }, limit: 1);
Console.WriteLine(hits[0].Payload["title"].StringValue);   // Lambda
```

**Done when:** it prints `Lambda`, and you can see the `test` collection in the dashboard.

### Day 5: Move the assistant to Qdrant

**Do**
1. Create an interface in `Assistant.Core`:
   ```csharp
   public interface IKnowledgeStore
   {
       Task UpsertAsync(IReadOnlyList<(KnowledgeChunk Chunk, float[] Vector)> items, CancellationToken ct = default);
       Task<IReadOnlyList<(KnowledgeChunk Chunk, float Score)>> SearchAsync(
           float[] vector, int k, string? sourceType = null, CancellationToken ct = default);
   }
   ```
2. Move the JSON index into `JsonKnowledgeStore : IKnowledgeStore`, and add `QdrantKnowledgeStore : IKnowledgeStore`:
   - Use a collection named `knowledge`, with vector size 768 (for `nomic-embed-text`) and cosine distance.
   - Qdrant point IDs must be numbers or GUIDs, so build a GUID from the first 16 bytes of your SHA-256 `Id`.
   - Store every `KnowledgeChunk` field in the payload.
3. Pick the store with a setting in `appsettings.json`: `"Store": "Qdrant"` or `"Json"`.

**Done when:** `index build` fills Qdrant, and answers work the same as before.

### Day 6: Metadata filters

**Learn (~10 min)**
- [Qdrant filtering](https://qdrant.tech/documentation/search/filtering/)

**Do:** implement the `sourceType` filter in `QdrantKnowledgeStore` with a "match" condition on the `source_type` payload field. Add CLI options `--plan-only` and `--docs-only`.

**Done when:** "What is RAG?" with `--plan-only` cites only Week 4, and with `--docs-only` cites only Microsoft Learn.

### Day 7: Review and catch-up (light)

- Push, including `compose.yaml`. The README should say "Run `docker compose up -d` first".
- Tick the containers and volumes topics on [roadmap.sh/docker](https://roadmap.sh/docker).

---

## Week 11: Hybrid search and reranking

**By the end of the week:** search that finds exact terms, such as `GetResponseAsync` or `SAA-C03`, as well as meaning, and a second step that reorders results for precision.

### Day 1: Where pure vector search fails

**Learn (~15 min)**
- [Hybrid search](https://qdrant.tech/documentation/search-tuning/hybrid-search/) (Qdrant)

**Do:** ask the assistant five questions containing exact identifiers, such as "Where do I use `UseFunctionInvocation`?", "Which day uses `TensorPrimitives`?", and "Where is port 6334 used?". Note how many it misses.

**Done when:** you have proof that meaning-based search alone misses exact keywords.

### Day 2: BM25 keyword search

**Topic:** BM25 is the classic keyword ranking formula used by search engines. Matches on rare words count for more.

**Do:** implement `Bm25Index` in `Assistant.Core`:
```csharp
public sealed class Bm25Index(IEnumerable<(string Id, string Text)> docs, double k1 = 1.5, double b = 0.75)
{
    private readonly List<(string Id, string[] Terms)> _docs =
        docs.Select(d => (d.Id, Tokenize(d.Text))).ToList();

    public static string[] Tokenize(string text) =>
        System.Text.RegularExpressions.Regex.Matches(text.ToLowerInvariant(), @"[a-z0-9_]+")
            .Select(m => m.Value).ToArray();

    public IEnumerable<(string Id, double Score)> Search(string query, int k)
    {
        double avgLen = _docs.Average(d => d.Terms.Length);
        int n = _docs.Count;
        var queryTerms = Tokenize(query).Distinct().ToArray();
        var df = queryTerms.ToDictionary(t => t, t => _docs.Count(d => d.Terms.Contains(t)));

        return _docs.Select(d =>
        {
            double score = 0;
            foreach (string t in queryTerms)
            {
                int tf = d.Terms.Count(x => x == t);
                if (tf == 0) continue;
                double idf = Math.Log(1 + (n - df[t] + 0.5) / (df[t] + 0.5));
                score += idf * tf * (k1 + 1) / (tf + k1 * (1 - b + b * d.Terms.Length / avgLen));
            }
            return (d.Id, Score: score);
        })
        .Where(r => r.Score > 0).OrderByDescending(r => r.Score).Take(k);
    }
}
```
Write a test: the query `TensorPrimitives` must return the Week 3 Day 2 chunk first.

**Done when:** the test passes, and your Day 1 identifier questions now work with BM25.

### Day 3: Combining results with Reciprocal Rank Fusion

**Topic:** Reciprocal Rank Fusion (RRF) merges two ranked lists without having to compare their very different scores. Each result scores `Σ 1 / (60 + rank)` across the lists.

**Do:** add `HybridSearch.SearchAsync(question, k)`. It takes the top 20 from vector search and the top 20 from BM25, combines them with RRF, and returns the top `k`:
```csharp
static Dictionary<string, double> Rrf(params IEnumerable<string>[] rankings)
{
    var scores = new Dictionary<string, double>();
    foreach (var ranking in rankings)
        foreach (var (id, rank) in ranking.Select((id, i) => (id, i + 1)))
            scores[id] = scores.GetValueOrDefault(id) + 1.0 / (60 + rank);
    return scores;
}
```

**Done when:** both your meaning questions and your identifier questions find the right chunk.

### Day 4: Reranking with the model

**Topic:** a reranker reads the question together with each candidate and scores how relevant it is. It's slower but more precise, so run it only on the top 10–20 results.

**Do:** add `LlmReranker`, which asks the chat model for a structured score for each candidate:
```csharp
record Relevance(int Score);   // 0–10

var r = await chat.GetResponseAsync<Relevance>(
    $"Question: {question}\n\nPassage:\n{chunk.Text}\n\n" +
    "How well does the passage answer the question? Reply with a score from 0 (not at all) to 10 (fully).");
```
Rerank the top 10 hybrid results and keep the best 3.

**Done when:** you've compared answers with and without reranking on your eval questions, and noted the extra time it takes.

### Day 5: Rewriting the question

**Topic:** follow-up questions like "and how do I test it?" make poor searches. Rewriting them as standalone questions fixes that.

**Do:** before searching, if the chat history isn't empty, ask the model: "Rewrite the user's last question as a standalone search query, using the conversation. Reply with the query only." Then search with the rewritten text.

**Done when:** "What is BM25?" followed by "Which week teaches it?" finds Week 11.

### Day 6: Curriculum Assistant 0.6, a configurable retrieval pipeline

**Do:** put the retrieval steps behind settings in `appsettings.json`:
```json
"Retrieval": { "Mode": "Hybrid", "Rerank": true, "RewriteQuestion": true, "TopK": 3 }
```
`Mode` can be `Vector`, `Keyword`, or `Hybrid`. Print the settings used with each answer.

**Done when:** you can switch each step on and off without code changes. Next week, you'll measure which combination works best.

### Day 7: Review and catch-up (light)

- Push, and add a README section explaining the retrieval pipeline, with a diagram.

---

## Week 12: Measuring RAG quality

**By the end of the week:** an automatic evaluation that scores the assistant on 30 questions, so you can measure every change.

### Day 1: What to measure

**Learn (~20 min)**
- [Ragas: available metrics](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/). Read context precision, context recall, faithfulness, and answer relevancy.

**Do:** for each kind of measurement, write down what it would catch in your assistant:
- **Retrieval:** did the right chunk come back? (hits@k, MRR)
- **Faithfulness:** does the answer state only what the chunks say?
- **Relevance:** does the answer actually address the question?

**Done when:** you can explain the difference between bad retrieval and a bad answer generated from good chunks.

### Day 2: Build a 30-question test set

**Do:** grow your Week 4 list into `eval/questions.json`:
```json
[
  { "id": "q01", "question": "Which day teaches cosine similarity?", "expectedSourceId": "week 3 day 2", "expectedAnswerContains": ["cosine"] },
  { "id": "q02", "question": "What does UseFunctionInvocation do?", "expectedSourceId": "week 2 day 3", "expectedAnswerContains": ["tool"] }
]
```
Include 10 easy questions, 10 with exact identifiers, 5 follow-ups, and 5 the plan doesn't cover (set `"expectedSourceId": null` for those).

**Done when:** the file has 30 entries.

### Day 3: Automatic retrieval scores

**Do:** add a console project, `tests/Assistant.Eval`. For each question it runs retrieval only and computes:
- **hits@3:** whether the expected source is in the top 3 results
- **MRR:** 1 divided by the rank of the expected source, or 0 if it's missing

It prints a table for each retrieval mode (Vector, Keyword, Hybrid, and Hybrid with reranking), and saves the results to `eval/results-<date>.json`.

**Done when:** you have hard numbers showing which retrieval mode wins on your questions.

### Day 4: LLM-as-judge for faithfulness

**Topic:** a second model call checks the answer against the chunks it was given. This is useful, but the judge can be wrong, so check some of its decisions yourself.

**Learn (~15 min)**
- [The Microsoft.Extensions.AI.Evaluation libraries](https://learn.microsoft.com/en-us/dotnet/ai/evaluation/libraries) (Microsoft Learn)

**Do:** add a judge prompt with structured output:
```csharp
record Judgement(bool Faithful, bool Relevant, string Reason);
```
The prompt asks: "Given these passages and this answer, is every claim in the answer supported by the passages? Does the answer address the question?" Run it on all 30 answers.

**Done when:** you have faithfulness and relevance percentages, and you've checked five of the judgements by hand.

### Day 5: Find and fix one weakness

**Do:** sort the results by failure and pick the worst category, for example follow-ups or "not covered" questions. Change one thing (chunk size, threshold, or prompt), then re-run the evaluation.

**Done when:** one metric improved and none of the others got worse. Record the before and after numbers in the README.

### Day 6: Ragas in Python (optional comparison)

**Learn (~10 min)**
- [Ragas: customize models](https://docs.ragas.io/en/stable/howtos/customizations/customize_models/)

**Do:** in your `py-rag` project, run `uv add ragas`. Run Ragas on 10 of your questions, pointing it at Ollama through the OpenAI-compatible endpoint from Week 7. Compare its faithfulness numbers with your C# judge.

**Done when:** you know whether your judge and Ragas roughly agree. If Ragas doesn't work with your local model, write down why. That's a useful finding too.

### Day 7: Review and catch-up (light)

- Push, including `eval/questions.json` and the latest results file.

---

## Week 13: PDFs, code, and keeping sources fresh

**By the end of the week:** the assistant can read PDFs and your own code, and it knows when a source page has changed.

### Day 1: PDF text extraction

**Do:** add `dotnet add src/Assistant.Core package UglyToad.PdfPig`, then write `PdfLoader.Load(path)`, which returns one `SourceDoc` per PDF with the text page by page. Put each page number in the heading path ("Page 4") so citations can point to it.

Test it with an AWS whitepaper. The [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) page has a PDF download link.

**Done when:** you can ask about a fact in the PDF, and the answer cites the right page.

### Day 2: Indexing your own code

**Topic:** code needs its own chunking: one chunk per method, not one per 800 characters.

**Do:** run `dotnet add src/Assistant.Core package Microsoft.CodeAnalysis.CSharp`, then add `CSharpChunker`:
```csharp
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

public static IEnumerable<Chunk> ChunkFile(string path)
{
    var root = CSharpSyntaxTree.ParseText(File.ReadAllText(path)).GetRoot();
    foreach (var method in root.DescendantNodes().OfType<MethodDeclarationSyntax>())
    {
        string cls = method.Ancestors().OfType<TypeDeclarationSyntax>().FirstOrDefault()?.Identifier.Text ?? "";
        yield return new Chunk($"{Path.GetFileName(path)} > {cls}.{method.Identifier.Text}", method.ToFullString());
    }
}
```
Index your `ai-learning` repository with `SourceType = "code"`.

**Done when:** "Where did I write the BM25 score?" finds your `Bm25Index.Search` method.

### Day 3: Detecting changed sources

**Do:** store a SHA-256 hash of each fetched page with its source. Add `sources refresh`, which re-downloads every page and reports it as **unchanged**, **changed**, **moved** (redirected to a new URL), or **gone** (404). Re-index only the pages that changed.

**Done when:** the command prints a refresh report, and running it a second time shows everything as unchanged.

### Day 4: Showing freshness in answers

**Do:** add each chunk's `IndexedAt` date to its citation, for example "learn.microsoft.com/… (fetched 3 days ago)". If a source is older than 90 days, add: "This source may be out of date. Run `sources refresh`."

**Done when:** answers show how old their sources are.

### Day 5: Removing stale data

**Do:** add `index prune`, which deletes chunks whose source no longer exists (deleted files, or pages marked gone). Add a test using the JSON store: index two sources, delete one, prune, and check that only one source's chunks remain.

**Done when:** the test passes, and Qdrant's point count drops after a prune.

### Day 6: Curriculum Assistant 0.7, a "what changed" report

**Do:** add the command `report changes`, which lists:
- plan weeks whose linked sources changed since the last refresh
- links that are now broken or redirected (port the logic of your Week 6 Python link checker to C#)

**Done when:** you get a short report you could act on, for example "Week 3 Day 4 links to a page that redirected; update the plan."

### Day 7: Review and catch-up (light)

- Push, run `report changes` on the real plan, and fix any broken links it finds.

---

## Week 14: RAG behind an API, with a chat page

**By the end of the week:** the assistant runs as an ASP.NET Core API with streaming answers and a simple browser chat page. This is the shape you'll deploy to AWS later.

### Day 1: Minimal API project

**Learn (~15 min)**
- [Tutorial: Create a minimal API with ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/tutorials/min-web-api) (Microsoft Learn). Skim it, since you already know ASP.NET.

**Do**
1. Run `dotnet new web -o src/Assistant.Api`, add it to the solution, and reference `Assistant.Core`.
2. Register the services with dependency injection:
   ```csharp
   builder.Services.AddSingleton<IChatClient>(_ =>
       new ChatClientBuilder(new OllamaApiClient(new Uri("http://localhost:11434/"), "llama3.2"))
           .UseFunctionInvocation().Build());
   builder.Services.AddSingleton<IEmbeddingGenerator<string, Embedding<float>>>(_ =>
       new OllamaApiClient(new Uri("http://localhost:11434/"), "nomic-embed-text"));
   builder.Services.AddSingleton<IKnowledgeStore, QdrantKnowledgeStore>();
   builder.Services.AddSingleton<RagService>();
   ```
3. Add `app.MapPost("/ask", async (AskRequest r, RagService rag) => await rag.AskAsync(r.Question));` and return the answer plus its citations.

**Done when:** this PowerShell command returns JSON with an answer and sources (use the port your app prints):
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/ask -ContentType "application/json" -Body '{"question":"What is RAG?"}'
```

### Day 2: Streaming with server-sent events

**Topic:** server-sent events (SSE) push text to the browser as it's generated.

**Do:** add `AskStreamingAsync` to `RagService` using `GetStreamingResponseAsync`, then expose it as `GET /ask/stream?q=...`:
```csharp
app.MapGet("/ask/stream", async (string q, RagService rag, HttpResponse res, CancellationToken ct) =>
{
    res.ContentType = "text/event-stream";
    await foreach (string piece in rag.AskStreamingAsync(q, ct))
    {
        await res.WriteAsync($"data: {piece.Replace("\n", "\\n")}\n\n", ct);
        await res.Body.FlushAsync(ct);
    }
});
```

**Done when:** `curl.exe -N "http://localhost:5000/ask/stream?q=What%20is%20RAG"` prints the answer piece by piece.

### Day 3: A simple chat page

**Do:** add `wwwroot/index.html`, plus `app.UseDefaultFiles();` and `app.UseStaticFiles();`. The page needs:
- a question box and a Send button
- a message list that shows your question and the streamed answer, using `new EventSource("/ask/stream?q=" + encodeURIComponent(q))`
- the sources as links under each answer, either from `POST /ask` or sent as a final SSE event

Plain HTML and a little JavaScript are enough. No framework is needed.

**Done when:** you can chat with your plan in the browser.

### Day 4: Conversations

**Do:** keep chat history per conversation. The browser creates a `conversationId` (a GUID) and sends it with each question. The server keeps the last 10 messages for that ID in an `IMemoryCache` with a 30-minute expiry, and passes that history to question rewriting from Week 11.

**Done when:** follow-up questions work in the browser.

### Day 5: Errors, limits, and health checks

**Do**
1. If Ollama or Qdrant is down, return a clear `503` that says "The model service is unavailable" instead of a stack trace. Use `app.UseExceptionHandler` with `Results.Problem`.
2. Add a fixed-window rate limiter of 10 questions per minute per IP, using `builder.Services.AddRateLimiter(...)`.
3. Add `GET /health`, which checks that Ollama and Qdrant respond.
4. Reject questions longer than 2,000 characters with a `400`.

**Done when:** stopping the Qdrant container shows a friendly error in the page, and `/health` reports it.

### Day 6: Curriculum Assistant 0.8, everything in Docker Compose

**Do:** add a `Dockerfile` for `Assistant.Api` and add the API to `compose.yaml` next to Qdrant. Inside Compose:
- reach Ollama on Windows at `http://host.docker.internal:11434/`
- reach Qdrant at host `qdrant`, port `6334` (the service name works as a host name)
- pass settings as environment variables, for example `Store__Type=Qdrant`

**Done when:** `docker compose up -d --build` starts the whole assistant, and the chat page works at `http://localhost:8080`.

### Day 7: Review and catch-up (light)

- Push, run your evaluation against the API version, and add a screenshot of the chat page to the README.
- Section C is complete. Tick the RAG topics on [roadmap.sh/ai-engineer](https://roadmap.sh/ai-engineer).
