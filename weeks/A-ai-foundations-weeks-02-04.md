# Section A: AI foundations in .NET (Weeks 2–4)

Week 1 is in [plan.md](../plan.md). Keep using the `ai-learning` GitHub repository, with one folder per week.

**Model tip:** `llama3.2` is fine for chat. For tool calling (from Week 2) a slightly bigger model works much better. If your laptop has 16 GB of RAM or more, also run `ollama pull qwen2.5:7b` and use it wherever a lesson says "tool model". If it's slow, stay on `llama3.2`.

---

## Week 2: Prompts and tool calling

**By the end of the week:** you can write reliable prompts, keep them out of your code, and let the model call your own C# methods. The Curriculum Assistant looks up plan weeks with a tool instead of pasting the whole plan.

### Day 1: Few-shot prompting

**Topic:** showing the model two or three worked examples ("few-shot") is often the fastest way to get consistent answers.

**Learn (~20 min)**
- [Prompt engineering in .NET](https://learn.microsoft.com/en-us/dotnet/ai/conceptual/prompt-engineering-dotnet): the sections on instructions and examples

**Do**
1. Create a console app, `CommitMessages`, with `dotnet add package OllamaSharp`.
2. Make the model turn messy change notes into a conventional commit message. First try zero-shot:
   ```csharp
   using Microsoft.Extensions.AI;
   using OllamaSharp;

   IChatClient chat = new OllamaApiClient(new Uri("http://localhost:11434/"), "llama3.2");

   string notes = "fixed the null crash in login, also renamed some vars";
   var zeroShot = await chat.GetResponseAsync(
       $"Write a git commit message for: {notes}");
   Console.WriteLine($"Zero-shot:\n{zeroShot.Text}\n");
   ```
3. Now add examples as earlier messages:
   ```csharp
   List<ChatMessage> fewShot =
   [
       new(ChatRole.System, "Write one conventional commit line. No explanation."),
       new(ChatRole.User, "added retry to http client"),
       new(ChatRole.Assistant, "feat(http): add retry policy to HttpClient calls"),
       new(ChatRole.User, "typo in readme"),
       new(ChatRole.Assistant, "docs: fix typo in README"),
       new(ChatRole.User, notes)
   ];
   var result = await chat.GetResponseAsync(fewShot);
   Console.WriteLine($"Few-shot:\n{result.Text}");
   ```
4. Run it three times. Compare the two styles.

**Done when:** the few-shot version gives one clean `type(scope): message` line every time, and the zero-shot version doesn't.

### Day 2: Prompts as files and templates

**Topic:** prompts change often, so treat them like configuration. Keep them in files with placeholders, not hard-coded strings.

**Do**
1. In `CommitMessages`, create `prompts/commit.system.txt` holding the system text from Day 1, and set the file to copy to the output folder.
2. Add a tiny template helper:
   ```csharp
   static string Fill(string template, Dictionary<string, string> values) =>
       values.Aggregate(template, (text, kv) => text.Replace("{{" + kv.Key + "}}", kv.Value));
   ```
3. Create `prompts/review.txt`:
   ```text
   Review this {{language}} code. List at most {{max}} problems, most important first.
   Code:
   {{code}}
   ```
4. Load it, call `Fill(...)` with `language = "C#"`, `max = "3"`, and a small buggy method of your own, then send it to the model.

**Done when:** you can change a prompt by editing a text file, without recompiling.

### Day 3: Tool calling basics

**Topic:** with tool calling, the model can ask your code to run a function and then use the result. `Microsoft.Extensions.AI` runs the function and sends the result back automatically.

**Learn (~20 min)**
- [Invoke .NET functions using an AI model](https://learn.microsoft.com/en-us/dotnet/ai/quickstarts/use-function-calling) (Microsoft Learn)

**Do**
1. Create a console app, `ToolsDemo`, with the OllamaSharp package.
2. Replace `Program.cs`:
   ```csharp
   using System.ComponentModel;
   using Microsoft.Extensions.AI;
   using OllamaSharp;

   // UseFunctionInvocation() runs the tools the model asks for, then calls the model again.
   IChatClient chat = new ChatClientBuilder(
           new OllamaApiClient(new Uri("http://localhost:11434/"), "llama3.2"))  // or your tool model
       .UseFunctionInvocation()
       .Build();

   var options = new ChatOptions
   {
       Tools = [AIFunctionFactory.Create(GetTime), AIFunctionFactory.Create(Add)]
   };

   foreach (string q in new[] { "What time is it?", "What is 1234 + 8766?", "Tell me a joke." })
   {
       var r = await chat.GetResponseAsync(q, options);
       Console.WriteLine($"Q: {q}\nA: {r.Text}\n");
   }

   [Description("Gets the current local date and time.")]
   static string GetTime()
   {
       Console.WriteLine("  [tool] GetTime called");
       return DateTime.Now.ToString("f");
   }

   [Description("Adds two whole numbers.")]
   static int Add(int a, int b)
   {
       Console.WriteLine($"  [tool] Add({a}, {b}) called");
       return a + b;
   }
   ```
3. Run it, and watch the `[tool]` lines.

**Done when:** the time and sum questions trigger the tools and the answers use their results, while the joke doesn't call any tool.

**Note:** if no tool gets called, switch to the tool model. Small models are inconsistent at choosing tools.

### Day 4: Tools that read real data, safely

**Topic:** tools are how models reach real data. Tools also run with your permissions, so you limit what they can touch.

**Do**
1. In `ToolsDemo`, add a tool that reads files, but only inside one folder:
   ```csharp
   [Description("Reads a text file from the notes folder. Use a file name like 'todo.md'.")]
   static string ReadNote(string fileName)
   {
       string root = Path.GetFullPath("notes");
       string full = Path.GetFullPath(Path.Combine(root, fileName));
       if (!full.StartsWith(root + Path.DirectorySeparatorChar))
           return "Error: access outside the notes folder is not allowed.";
       return File.Exists(full) ? File.ReadAllText(full) : $"Error: {fileName} not found.";
   }

   [Description("Lists the files in the notes folder.")]
   static string[] ListNotes() =>
       Directory.GetFiles("notes").Select(Path.GetFileName).ToArray()!;
   ```
2. Create a `notes` folder next to the project with two or three small `.md` files.
3. Register both tools, then ask: "What notes do I have?", "Summarize todo.md", and "Read ../Program.cs".

**Done when:** the first two questions work, and the third gets the "not allowed" error back from your tool.

**Takeaway:** never trust tool arguments from the model, just as you never trust user input in an API.

### Day 5: Hallucinations and grounding

**Topic:** models make up facts with confidence. "Grounding" means giving them the facts and telling them to admit when something isn't covered.

**Learn (~15 min)**
- [How generative AI and LLMs work](https://learn.microsoft.com/en-us/dotnet/ai/conceptual/how-genai-and-llms-work): the section on limitations

**Do**
1. Ask the model five questions about a made-up library, for example "How do I configure retries in FluxPipe.NET 3.2?". Note how often it invents an answer.
2. Ask again with this system prompt:
   ```text
   Only answer from facts you are sure about. If you don't know, reply exactly: "I don't know."
   ```
3. Now give it facts. Paste a three-line made-up FluxPipe README into the system prompt and ask again.

**Done when:** you've seen all three behaviors (invented, "I don't know", and correct from the facts), and you've written a two-line note on why grounding beats instructions alone.

### Day 6: Curriculum Assistant 0.2, looking up weeks with a tool

**Topic:** instead of pasting the whole plan, give the model a tool that fetches only the week it needs. This is retrieval in its simplest form.

**Do**
1. Copy `AskMyNotes` to `CurriculumAssistant02`. Put `plan.md` and the section files in a `content` folder that copies to the output.
2. Add a tool that returns one week's section:
   ```csharp
   [Description("Returns the full text of one week of the learning plan, for example week 3.")]
   static string GetWeek(int week)
   {
       string all = string.Join("\n", Directory.GetFiles("content", "*.md").Select(File.ReadAllText));
       string start = $"## Week {week}:";
       int i = all.IndexOf(start, StringComparison.Ordinal);
       if (i < 0) return $"Week {week} is not in the plan.";
       int next = all.IndexOf("\n## Week ", i + start.Length, StringComparison.Ordinal);
       return next < 0 ? all[i..] : all[i..next];
   }
   ```
3. Use a `ChatClientBuilder` with `.UseFunctionInvocation()` and the tool model, and set this system prompt: "You answer questions about the user's learning plan. Use the GetWeek tool to look things up. Never guess."
4. Ask: "What do I do on Day 3 of Week 2?", "Which week covers MCP servers in C#?", and "What's in Week 99?".

**Done when:** specific week questions work. The "which week covers…" question may fail, because the model has to guess a week number. That's the problem Week 3 solves with search.

### Day 7: Review and catch-up (light)

- Finish anything you skipped.
- Push `CommitMessages`, `ToolsDemo`, and `CurriculumAssistant02` to `ai-learning/week-02`.
- In the README, note which questions the tool model got right and which `llama3.2` got right.

---

## Week 3: Embeddings and semantic search

**By the end of the week:** you understand embeddings and can find text by meaning, not by exact words. The Curriculum Assistant can find which day of the plan answers a question.

**Setup:** `ollama pull nomic-embed-text`, a small embedding model that produces 768 numbers per text.

### Day 1: What embeddings are

**Topic:** an embedding is a list of numbers that represents what a piece of text means. Texts with similar meanings get similar numbers.

**Learn (~20 min)**
- [Embeddings in .NET](https://learn.microsoft.com/en-us/dotnet/ai/conceptual/embeddings) (Microsoft Learn)

**Do**
1. Create a console app, `Embeddings`, with `dotnet add package OllamaSharp`.
2. Generate one embedding and look at it:
   ```csharp
   using Microsoft.Extensions.AI;
   using OllamaSharp;

   IEmbeddingGenerator<string, Embedding<float>> embedder =
       new OllamaApiClient(new Uri("http://localhost:11434/"), "nomic-embed-text");

   ReadOnlyMemory<float> v = await embedder.GenerateVectorAsync("The cat sat on the mat.");
   Console.WriteLine($"Length: {v.Length}");
   Console.WriteLine($"First 5: {string.Join(", ", v.Span[..5].ToArray())}");
   ```

**Done when:** it prints a length of 768 and some small decimal numbers.

### Day 2: Measuring similarity

**Topic:** cosine similarity compares two embeddings. It's close to 1 for similar meaning and closer to 0 for unrelated text.

**Do**
1. Add `dotnet add package System.Numerics.Tensors`.
2. Compare pairs:
   ```csharp
   using System.Numerics.Tensors;

   async Task<float> Similarity(string a, string b)
   {
       var va = await embedder.GenerateVectorAsync(a);
       var vb = await embedder.GenerateVectorAsync(b);
       return TensorPrimitives.CosineSimilarity(va.Span, vb.Span);
   }

   (string, string)[] pairs =
   [
       ("How do I deploy a Lambda function?", "Publishing code to AWS Lambda"),
       ("How do I deploy a Lambda function?", "Best pizza toppings"),
       ("car", "automobile"),
       ("bank of a river", "bank account")
   ];
   foreach (var (a, b) in pairs)
       Console.WriteLine($"{await Similarity(a, b):F3}  {a}  <->  {b}");
   ```

**Done when:** the Lambda pair scores clearly higher than the pizza pair, and you've noticed that "car" and "automobile" match even though they share no letters.

### Day 3: Semantic search in memory

**Topic:** semantic search embeds every document once, embeds the question, and returns the closest documents.

**Do**
1. Write 20 one-line "facts" about .NET, AWS, and AI into `facts.txt`.
2. Search them:
   ```csharp
   string[] facts = File.ReadAllLines("facts.txt");
   var index = new List<(string Text, ReadOnlyMemory<float> Vector)>();
   foreach (string f in facts)
       index.Add((f, await embedder.GenerateVectorAsync(f)));

   while (true)
   {
       Console.Write("Search: ");
       string? q = Console.ReadLine();
       if (string.IsNullOrWhiteSpace(q)) break;
       var qv = await embedder.GenerateVectorAsync(q);
       foreach (var hit in index
           .Select(e => (e.Text, Score: TensorPrimitives.CosineSimilarity(qv.Span, e.Vector.Span)))
           .OrderByDescending(e => e.Score).Take(3))
           Console.WriteLine($"  {hit.Score:F3}  {hit.Text}");
   }
   ```
3. Search using words that aren't in the facts, for example "serverless" when the fact says "Lambda".

**Done when:** searches by meaning find the right facts.

### Day 4: Vector databases, and saving your index

**Topic:** embedding is slow, so you store vectors and only embed new or changed text. Vector databases do this at scale. Today you'll do a simple version with a file.

**Learn (~15 min)**
- [Vector databases for .NET AI apps](https://learn.microsoft.com/en-us/dotnet/ai/vector-stores/overview) (Microsoft Learn)

**Do**
1. Save the index to `index.json` after building it, and load it on startup if it exists:
   ```csharp
   using System.Text.Json;

   record Entry(string Text, float[] Vector);

   List<Entry> entries;
   if (File.Exists("index.json"))
       entries = JsonSerializer.Deserialize<List<Entry>>(File.ReadAllText("index.json"))!;
   else
   {
       entries = new();
       foreach (string f in facts)
           entries.Add(new(f, (await embedder.GenerateVectorAsync(f)).ToArray()));
       File.WriteAllText("index.json", JsonSerializer.Serialize(entries));
   }
   ```
2. Time the first run and the second run with a `Stopwatch`.

**Done when:** the second run starts almost instantly, and you can say what a vector database adds beyond a JSON file: scale, fast search, filtering, and updates.

### Day 5: Chunking a long document

**Topic:** long documents are split into chunks before embedding. One vector for a whole document blurs its meaning, and a chunk that's too small loses context.

**Do**
1. Take any long Markdown document, such as a README from a project you know.
2. Split it into chunks by blank lines, joining short paragraphs up to about 800 characters:
   ```csharp
   static List<string> Chunk(string text, int maxChars = 800)
   {
       var chunks = new List<string>();
       var current = new System.Text.StringBuilder();
       foreach (string para in text.Split("\n\n", StringSplitOptions.RemoveEmptyEntries))
       {
           if (current.Length + para.Length > maxChars && current.Length > 0)
           {
               chunks.Add(current.ToString().Trim());
               current.Clear();
           }
           current.AppendLine(para).AppendLine();
       }
       if (current.Length > 0) chunks.Add(current.ToString().Trim());
       return chunks;
   }
   ```
3. Index the chunks instead of `facts.txt`, then search for something specific in the document.

**Done when:** a search returns the right paragraph from the long document.

### Day 6: Curriculum Assistant 0.3, searching the plan

**Topic:** now the assistant can find which day of the plan answers a question, without you naming the week.

**Do**
1. Create `CurriculumAssistant03`, with the plan files in `content`.
2. Chunk the plan by day: split each file on lines starting with `### Day`, and keep the nearest `## Week` heading with each chunk, for example `"Week 3 Day 5: Chunking a long document"`.
   ```csharp
   record PlanChunk(string Title, string Text);

   static IEnumerable<PlanChunk> ChunkPlan(string markdown)
   {
       string week = "";
       PlanChunk? current = null;
       var body = new System.Text.StringBuilder();
       foreach (string line in markdown.Split('\n'))
       {
           if (line.StartsWith("## Week ")) week = line[3..].Split(':')[0];          // "Week 3"
           if (line.StartsWith("### Day "))
           {
               if (current is not null) yield return current with { Text = body.ToString() };
               current = new PlanChunk($"{week} {line[4..].Trim()}", "");
               body.Clear();
           }
           body.AppendLine(line);
       }
       if (current is not null) yield return current with { Text = body.ToString() };
   }
   ```
3. Embed each chunk's `Title + Text`, save the index to JSON as on Day 4, and print the top 3 titles with scores for a question.
4. Try: "Where do I learn about cosine similarity?", "When do I first use tools?", and "Which day sets up Ollama?".

**Done when:** the right day appears in the top 3 for most questions. There's no AI answer yet, just search. Next week adds that.

### Day 7: Review and catch-up (light)

- Push this week's projects to `ai-learning/week-03`.
- Write down five questions where search worked and two where it didn't. You'll reuse them as test questions.

---

## Week 4: Your first RAG app

**By the end of the week:** Curriculum Assistant 0.4, a real RAG app. It searches the plan, sends the best chunks to the model, and answers with the week and day it got them from.

### Day 1: What RAG is

**Topic:** Retrieval-Augmented Generation: **retrieve** relevant chunks, **augment** the prompt with them, and let the model **generate** an answer from them.

**Learn (~25 min)**
- [Retrieval-augmented generation (RAG)](https://learn.microsoft.com/en-us/dotnet/ai/conceptual/rag) (Microsoft Learn)
- **Optional video:** search YouTube for "Generative AI for Beginners .NET RAG" (Microsoft's free course, which also has a GitHub repository)

**Do:** draw the RAG flow on paper: question → embed → search → top chunks → prompt → model → answer. Mark which parts you already built in Weeks 1–3.

**Done when:** you can explain RAG in three sentences, and you can see that you already have every piece.

### Day 2: Retrieve, augment, generate

**Do**
1. In `CurriculumAssistant03`, after the search, build the prompt from the top 3 chunks and call the chat model:
   ```csharp
   IChatClient chat = new OllamaApiClient(new Uri("http://localhost:11434/"), "llama3.2");

   async Task<string> Ask(string question)
   {
       var qv = await embedder.GenerateVectorAsync(question);
       var top = index
           .OrderByDescending(c => TensorPrimitives.CosineSimilarity(qv.Span, c.Vector))
           .Take(3).ToList();

       string context = string.Join("\n\n---\n\n", top.Select(c => c.Text));
       List<ChatMessage> messages =
       [
           new(ChatRole.System,
               "Answer the question using only the context. If the context does not contain " +
               "the answer, say \"The plan doesn't cover that.\"\n\nCONTEXT:\n" + context),
           new(ChatRole.User, question)
       ];
       return (await chat.GetResponseAsync(messages)).Text;
   }
   ```
   Here `index` is your list of chunks with a `float[] Vector` field.
2. Ask your five "search worked" questions from Week 3.

**Done when:** you get proper answers, not just chunk titles.

### Day 3: Citations

**Topic:** users trust answers they can check. Give each chunk a label and ask the model to cite it.

**Do**
1. Label each chunk in the context:
   ```csharp
   string context = string.Join("\n\n", top.Select((c, i) => $"[{i + 1}] {c.Title}\n{c.Text}"));
   ```
2. Add to the system prompt: "After each fact, cite the source number like [1]. End with a 'Sources:' line listing the titles you used."
3. Print the chunk titles yourself too, so you can check the model's citations.

**Done when:** answers end with sources such as "Week 3 Day 2: Measuring similarity", and the cited chunks really contain the facts.

### Day 4: Saying "I don't know"

**Topic:** if nothing relevant is found, don't send weak chunks. Set a minimum similarity score.

**Do**
1. Print the top score for ten questions, half relevant and half not, such as "What is the capital of France?".
2. Pick a cut-off between the two groups, often around 0.5–0.6 for `nomic-embed-text`, and skip the model call when the best score is below it:
   ```csharp
   if (bestScore < 0.55f) return "The plan doesn't cover that.";
   ```

**Done when:** off-topic questions get the polite refusal instantly, and on-topic ones still work.

### Day 5: Your first evaluation

**Topic:** "it seems better" isn't good enough. Compare approaches on the same questions.

**Do**
1. Create `eval-questions.md` with 10 questions and the week and day that answers each one.
2. Answer each question three ways: no context, the whole Week 1–4 text pasted in, and RAG.
3. Score each answer by hand: 2 = correct, 1 = partly correct, 0 = wrong or made up. Fill in a table.

**Done when:** you have a score table, and RAG wins on most questions. You'll automate this scoring in Week 12.

### Day 6: Curriculum Assistant 0.4, proper project structure

**Topic:** move from scripts to a real solution, because the assistant will grow for 48 more weeks.

**Do**
1. Create the solution that the rest of the year builds on:
   ```powershell
   mkdir CurriculumAssistant; cd CurriculumAssistant
   dotnet new sln -n CurriculumAssistant
   dotnet new classlib -o src/Assistant.Core
   dotnet new console  -o src/Assistant.Cli
   dotnet new xunit    -o tests/Assistant.Core.Tests
   dotnet sln add src/Assistant.Core src/Assistant.Cli tests/Assistant.Core.Tests
   dotnet add src/Assistant.Cli reference src/Assistant.Core
   dotnet add tests/Assistant.Core.Tests reference src/Assistant.Core
   dotnet add src/Assistant.Core package OllamaSharp
   dotnet add src/Assistant.Core package System.Numerics.Tensors
   ```
2. Move the code into classes in `Assistant.Core`:
   - `PlanChunker`, holding `ChunkPlan` from Week 3
   - `VectorIndex`, which builds, saves, loads, and searches the JSON index
   - `RagService`, holding `AskAsync(question)` with the threshold and citations
3. Take `IChatClient` and `IEmbeddingGenerator<string, Embedding<float>>` in the constructors, rather than creating them inside the classes, so you can swap in AWS Bedrock later.
4. Write two xUnit tests for `PlanChunker`: one checks that a sample with two days gives two chunks, and one checks the titles.
5. `Assistant.Cli` builds the index on first run and then answers questions in a loop.

**Done when:** `dotnet test` passes, and `dotnet run --project src/Assistant.Cli` answers questions about the plan with sources.

### Day 7: Review and catch-up (light)

- Put `CurriculumAssistant` in its own GitHub repository. It's your portfolio project for the year.
- Write its README: what it does, how to run it, the architecture (the RAG flow from Day 1), and your Day 5 score table.
