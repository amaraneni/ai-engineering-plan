# AI Engineering Plan: Week by Week

**Goal:** by the end you can build and deploy real AI systems: LLM apps, RAG, agents, MCP servers, and AWS deployments. You'll also be able to work as a forward deployed engineer, someone who takes these systems into a customer's environment and makes them work there.

**Language:** C# and .NET by default, because that's your strength. Python has its own block of weeks (5–8), then comes back wherever the Python ecosystem is clearly better, for example RAG evaluation and LangGraph.

**Cost:** local first. AI runs on your laptop with Ollama until Week 33. AWS weeks use small, short-lived resources and include a cleanup step.

**Files in this plan:**
- [schedule.html](schedule.html): **start here each day.** The dated checklist (Oct 28, 2026 to Oct 26, 2027). Tick days off, and your progress is saved in the browser
- [schedule.md](schedule.md): the same checklist as a printable Markdown file
- `plan.md` (this file): the goal, the outline, and Week 1 in full
- `weeks/`: one file per section, with every day of Weeks 2–52
- [resources.md](resources.md): the courses (Coursera, Udemy, LinkedIn Learning, AlgoMaster, AWS Skill Builder), docs, and roadmap.sh roadmaps, mapped to the weeks that use them
- `tools/check-links.mjs`: run `node tools/check-links.mjs` to re-check every link; the results go to `tools/link-report.json`
- `tools/build-schedule.mjs`: run `node tools/build-schedule.mjs 2026-10-28` to rebuild the schedule after editing the plan, or pass a different start date
- `tools/build-html.mjs`: run `node tools/build-html.mjs` to rebuild the HTML lesson pages (`plan.html`, `resources.html`, and `weeks/*.html`) after editing any `.md` file

---

## Your main project: the Curriculum Assistant

Most weeks are small standalone exercises. Alongside them, you build one chatbot that grows as you learn, and by the end it's your portfolio piece. It knows **this plan**, the **sources it links to**, and **your own work**, and it answers questions about all three.

By Week 52 you can ask it things like:

- "What do I learn in Week 22, and what should I already know first?"
- "Explain chunking using the docs I studied, with links."
- "Compare my plan with the roadmap.sh AI Engineer roadmap. What's missing?"
- "Is the Week 27 Lambda page still current, or has the official doc changed?"
- "What have I finished, and what did I skip?"

It's built in C# and grows in milestones. Each one is that week's Day 6 project, so it doesn't add extra work every day.

| Week | Milestone | What it can do afterwards |
|---|---|---|
| 1 | Paste the plan into the prompt | Answers questions about one week of the plan, and shows why that doesn't scale |
| 4 | First RAG version | Searches the whole plan and answers with the week and day it came from |
| 9–13 | Add the sources | Downloads the docs pages the plan links to, chunks and indexes them, and cites them in answers |
| 14 | Web API | Runs as an ASP.NET Core API with a simple chat page |
| 16–17 | Agent | Uses tools to look up a week, search sources, and check your progress |
| 18 | Compare | A "compare" agent checks your plan against roadmap.sh and current docs, and lists gaps and stale links |
| 22–23 | MCP server | Plan, sources, and progress are available as MCP tools you can also use from VS Code or Kiro |
| 33–37 | On AWS | Runs on AWS with Bedrock models, S3 Vectors search, and DynamoDB progress; the agent runs on AgentCore, and the MCP server is reachable over HTTPS |
| 39–43 | Production | CI/CD, tracing, caching, automatic answer-quality tests, and fallbacks |
| 45–50 | Customer version | Adapted for a made-up customer, Northwind, with access rules, a ticketing MCP server, and a separate AWS account |
| 51–52 | Version 1.0 | Finished, deployed, documented, and demoed |

---

## How each day works (about 60–90 minutes)

| Part | Time | What you do |
|---|---|---|
| **Topic** | | One thing you learn today |
| **Learn** | ~20 min | One or two docs pages or videos |
| **Do** | ~45–60 min | Build something real with that topic |
| **Done when** | | What you should see working |
| **Short on time?** | | The smallest version that still counts |

**Day 7 each week is light:** catch up on anything you missed, tidy up, and push the week's work to GitHub.

---

## Outline (52 weeks)

### A. AI foundations in .NET (Weeks 1–4) · Week 1 is below · [Weeks 2–4](weeks/A-ai-foundations-weeks-02-04.md)
1. Run an AI model locally and call it from C#
2. Prompts, structured output, and tool calling
3. Embeddings and semantic search
4. Your first RAG app over your own documents

### B. Python for AI (Weeks 5–8) · [open](weeks/B-python-weeks-05-08.md)
5. Python for C# developers: syntax, types, uv, virtual environments
6. Files, HTTP, async, and packages in Python
7. Calling models and embeddings from Python, plus notebooks
8. Rebuild your Week 4 RAG app in Python and compare it with .NET

### C. RAG in depth (Weeks 9–14) · [open](weeks/C-rag-weeks-09-14.md)
9. Chunking strategies and why they matter
10. Docker basics, then run Qdrant as a vector database
11. Hybrid search and reranking
12. Measuring RAG quality with test questions and scores
13. PDFs, code, and keeping sources fresh
14. Put RAG behind an ASP.NET Core API with streaming

### D. Agents (Weeks 15–20) · [open](weeks/D-agents-weeks-15-20.md)
15. Tool calling in depth
16. Your first agents with Microsoft Agent Framework: tools, sessions, memory
17. Multi-step workflows and human approval
18. Multi-agent systems, and comparing the plan with outside sources
19. Agents in Python with LangGraph, compared with .NET
20. Agent safety, guardrails, and evaluation

### E. MCP (Weeks 21–24) · [open](weeks/E-mcp-weeks-21-24.md)
21. What MCP is, and using existing MCP servers
22. Build an MCP server in C# with the official SDK
23. Better MCP servers: errors, progress, tests, and several servers at once
24. Remote MCP over HTTP with auth, plus a Python MCP server

### F. AWS foundations with .NET (Weeks 25–32) · [open](weeks/F-aws-foundations-weeks-25-32.md)
25. Safe account setup: IAM, MFA, budgets, AWS CLI
26. S3 and IAM roles with the AWS SDK for .NET
27. Lambda functions in C#
28. Build an API with API Gateway and Lambda
29. DynamoDB
30. Infrastructure as code with AWS CDK in C#
31. VPC networking basics
32. Containers: ECR and ECS Fargate for an ASP.NET app

### G. AI on AWS (Weeks 33–38) · [open](weeks/G-ai-on-aws-weeks-33-38.md)
33. Amazon Bedrock from C#
34. Bedrock Knowledge Bases and S3 Vectors, compared with your own RAG
35. Deploy your RAG API to AWS
36. Agents on AWS with Bedrock AgentCore
37. Deploy your MCP server to AWS
38. Security for AI on AWS: guardrails, least privilege, audit trail

### H. Production and DevOps (Weeks 39–44) · [open](weeks/H-production-weeks-39-44.md)
39. CI/CD with GitHub Actions to AWS
40. Observability: logs, metrics, and traces for LLM calls
41. Cost and performance: caching, model choice, rate limits
42. Automated AI tests and evaluation in CI
43. Reliability: retries, timeouts, fallbacks
44. Linux and troubleshooting skills for deployed systems

### I. Forward deployed engineering (Weeks 45–50) · [open](weeks/I-forward-deployed-weeks-45-50.md)
45. What the role is, and scoping a customer's AI use case
46. Connecting to customer data and systems
47. Deploying into a separate "customer" AWS account
48. Building demos and explaining trade-offs to stakeholders
49. Debugging in the field: an incident drill
50. Handover: documentation and runbooks

### J. Capstone (Weeks 51–52) · [open](weeks/J-capstone-weeks-51-52.md)
51–52. Finish the **Curriculum Assistant** as version 1.0. It runs on AWS and combines RAG over the plan, its sources, and your notes; an agent that compares your plan with roadmap.sh and current docs; MCP tools; answer-quality tests; and CI/CD. You also record a short demo and write up the design.

---

## Week 1 in full: Run an AI model locally and call it from C#

**By the end of the week:** a C# console chat app talking to an AI model on your own laptop, with a system prompt, streaming, typed output, and token counts. You'll also have hit the limit that RAG solves.

**Setup you need once:** the [.NET 10 SDK](https://dotnet.microsoft.com/en-us/download) and VS Code or Visual Studio. Everything this week runs in normal Windows. You don't need WSL yet.

---

### Day 1: What an LLM is, and running one locally

**Topic:** a large language model (LLM) predicts text one token at a time. Ollama lets you run one on your own machine for free.

**Learn (~20 min)**
- [How generative AI and LLMs work](https://learn.microsoft.com/en-us/dotnet/ai/conceptual/how-genai-and-llms-work) (Microsoft Learn)
- [Understanding tokens](https://learn.microsoft.com/en-us/dotnet/ai/conceptual/understanding-tokens) (Microsoft Learn)

**Do**
1. Install Ollama for Windows from [ollama.com/download](https://ollama.com/download).
2. In PowerShell, download a small model (about 2 GB) and chat with it:
   ```powershell
   ollama pull llama3.2
   ollama run llama3.2
   ```
3. Ask it three things: a fact question, something to summarize, and a question about something recent. Notice that it can be confidently wrong about recent events. It only knows its training data.
4. Type `/bye` to exit, then run `ollama show llama3.2` and find the **context length** line.

**Done when:** you've had a conversation with the model, and you can explain in one sentence what a token is and what the context length means.

**Short on time?** Steps 1 and 2 only.

---

### Day 2: Call the model from C#

**Topic:** `Microsoft.Extensions.AI` gives you one `IChatClient` interface for any model, local or cloud. It works like `ILogger`: you code against the interface and swap the provider later.

**Learn (~20 min)**
- [Chat with a local AI model using .NET](https://learn.microsoft.com/en-us/dotnet/ai/quickstarts/chat-local-model) (Microsoft Learn). Follow it, but use `llama3.2` instead of `phi3:mini`.

**Do**
1. Create the app:
   ```powershell
   dotnet new console -o LocalChat
   cd LocalChat
   dotnet add package OllamaSharp
   code .
   ```
2. Replace `Program.cs` with:
   ```csharp
   using Microsoft.Extensions.AI;
   using OllamaSharp;

   // OllamaApiClient implements IChatClient. Ollama listens on port 11434.
   IChatClient chat = new OllamaApiClient(new Uri("http://localhost:11434/"), "llama3.2");

   List<ChatMessage> history = new();

   while (true)
   {
       Console.Write("You: ");
       string? prompt = Console.ReadLine();
       if (string.IsNullOrWhiteSpace(prompt)) break;   // empty line quits

       history.Add(new ChatMessage(ChatRole.User, prompt));

       ChatResponse response = await chat.GetResponseAsync(history);
       Console.WriteLine($"AI: {response.Text}\n");

       // Keep the answer, so the model remembers the conversation.
       history.Add(new ChatMessage(ChatRole.Assistant, response.Text));
   }
   ```
3. Run it with `dotnet run`. Ask a question, then ask a follow-up such as "make that shorter".

**Done when:** the follow-up works, which shows the model is getting the conversation history.

**Try this:** comment out the line that adds the assistant's answer to `history`, then ask a follow-up. The model "forgets", because it only knows what you send it on each call.

---

### Day 3: System prompts and settings

**Topic:** a system message sets the model's role and rules. Settings such as temperature control how random the answers are.

**Learn (~20 min)**
- [Prompt engineering in .NET](https://learn.microsoft.com/en-us/dotnet/ai/conceptual/prompt-engineering-dotnet) (Microsoft Learn)

**Do**
1. In `LocalChat`, start the history with a system message:
   ```csharp
   List<ChatMessage> history =
   [
       new(ChatRole.System,
           "You are a senior .NET reviewer. Answer in at most 3 bullet points. " +
           "If you are not sure, say so.")
   ];
   ```
2. Pass settings on each call:
   ```csharp
   var options = new ChatOptions { Temperature = 0.2f };   // 0 = focused, 1+ = creative
   ChatResponse response = await chat.GetResponseAsync(history, options);
   ```
3. Ask "Is async void ever OK in C#?" three times with `Temperature = 0.2f`, then three times with `1.5f`. Compare the answers.

**Done when:** answers follow your 3-bullet rule, and you can see that low temperature gives more consistent answers.

---

### Day 4: Streaming and structured output

**Topic:** streaming shows text as it's generated. Structured output makes the model return JSON that maps straight onto a C# type, so your code can use the result directly.

**Learn (~20 min)**
- [Request a response with structured output](https://learn.microsoft.com/en-us/dotnet/ai/quickstarts/structured-output) (Microsoft Learn). Read the code. It uses Azure, but the same `GetResponseAsync<T>` works with your local `IChatClient`.

**Do**
1. Switch the chat loop to streaming:
   ```csharp
   string answer = "";
   Console.Write("AI: ");
   await foreach (ChatResponseUpdate update in chat.GetStreamingResponseAsync(history, options))
   {
       Console.Write(update.Text);
       answer += update.Text;
   }
   Console.WriteLine("\n");
   history.Add(new ChatMessage(ChatRole.Assistant, answer));
   ```
2. Create a second console app, `ReviewTriage`, with the OllamaSharp package. It turns bug reports into a typed C# object:
   ```csharp
   using Microsoft.Extensions.AI;
   using OllamaSharp;

   IChatClient chat = new OllamaApiClient(new Uri("http://localhost:11434/"), "llama3.2");

   string[] reports =
   [
       "App crashes on login when the password has an emoji.",
       "Please add dark mode.",
       "Checkout is 10 seconds slow since yesterday's release."
   ];

   foreach (string report in reports)
   {
       var response = await chat.GetResponseAsync<Triage>(
           $"Triage this bug report: {report}");

       if (response.TryGetResult(out Triage? t))
           Console.WriteLine($"{t.Severity,-8} {t.Area,-12} {t.Summary}");
       else
           Console.WriteLine($"Could not parse: {response.Text}");
   }

   enum Severity { Low, Medium, High, Critical }
   record Triage(Severity Severity, string Area, string Summary);
   ```
3. Run it. Small local models sometimes return bad JSON. That's why the code uses `TryGetResult` instead of trusting the output.

**Done when:** your chat streams word by word, and `ReviewTriage` prints one typed line for each report.

---

### Day 5: Tokens, context windows, and cost

**Topic:** every request uses tokens, both the input you send and the output you get back. Cloud models charge per token. All models have a context window limit.

**Learn (~15 min)**
- Re-read the "Token limits" and "Token-based pricing" sections of [Understanding tokens](https://learn.microsoft.com/en-us/dotnet/ai/conceptual/understanding-tokens).

**Do**
1. In `LocalChat`, switch back to the non-streaming call for this exercise, then print usage after each answer:
   ```csharp
   ChatResponse response = await chat.GetResponseAsync(history, options);
   Console.WriteLine($"AI: {response.Text}");
   Console.WriteLine($"[tokens in: {response.Usage?.InputTokenCount}, out: {response.Usage?.OutputTokenCount}]\n");
   ```
2. Chat for ten turns and watch the **input** tokens grow. You resend the whole history every time.
3. Work it out: if a cloud model charged $1 per million input tokens, roughly what would your conversation cost? What about 10,000 users doing the same each day?

**Done when:** you can explain why long conversations get slower and more expensive, and why apps trim or summarize history.

---

### Day 6: Curriculum Assistant, version 0.1 ("Ask my plan")

**Topic:** the simplest way to give a model your own knowledge is to paste it into the prompt. Today you'll start the Curriculum Assistant this way, and see where it breaks down. That's the problem RAG solves in Weeks 3–4.

**Do**
1. Copy the **Week 1** section of this plan into a file named `notes.md`. The model has never seen it, so it can't answer from its training.
2. Create a console app, `AskMyNotes`. This is version 0.1 of the Curriculum Assistant:
   ```csharp
   using Microsoft.Extensions.AI;
   using OllamaSharp;

   IChatClient chat = new OllamaApiClient(new Uri("http://localhost:11434/"), "llama3.2");
   string notes = File.ReadAllText("notes.md");

   List<ChatMessage> history =
   [
       new(ChatRole.System,
           "Answer only from the notes below. If the answer is not in the notes, " +
           "say \"Not in my notes.\"\n\n--- NOTES ---\n" + notes)
   ];

   while (true)
   {
       Console.Write("Question: ");
       string? q = Console.ReadLine();
       if (string.IsNullOrWhiteSpace(q)) break;
       history.Add(new(ChatRole.User, q));
       ChatResponse r = await chat.GetResponseAsync(history);
       Console.WriteLine($"{r.Text}\n[input tokens: {r.Usage?.InputTokenCount}]\n");
       history.Add(new(ChatRole.Assistant, r.Text));
   }
   ```
3. Copy `notes.md` into the build output: right-click it in VS Code or Visual Studio and set it to copy to the output folder, or run the app from the project folder.
4. Ask questions that the plan answers, such as "What do I do on Day 4?" or "Which package do I need on Day 2?", and one it doesn't, such as "What's in Week 30?".
5. Now replace `notes.md` with the **whole plan** and ask about a detail in Week 1. Ollama uses a small context window by default and quietly drops what doesn't fit, so the model may miss it or make something up.

**Done when:** it answers correctly from one week of the plan, and you've seen it fail on the whole plan.

**Takeaway:** you can't paste everything into the prompt. RAG finds the few relevant pieces and sends only those.

---

### Day 7: Review and catch-up (light)

- Finish anything you skipped this week.
- Put `LocalChat`, `ReviewTriage`, and `AskMyNotes` (Curriculum Assistant 0.1) in one GitHub repository, `ai-learning`, with one folder per week.
- Write a short `README.md` for Week 1 covering what each app does, how to run it, and one thing that surprised you.
- **Optional:** try a different model, such as `ollama pull qwen2.5:3b`, by changing just the model name. Your code doesn't change, which is the point of `IChatClient`.

**Done when:** the repository is on GitHub, and running `dotnet run` in each folder works.
