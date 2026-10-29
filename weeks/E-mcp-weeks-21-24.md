# Section E: MCP (Weeks 21–24)

The Model Context Protocol (MCP) is a standard way to connect AI apps to tools and data. You write a server once, and any MCP client can use it: VS Code, Kiro, Claude, or your own agent. By Week 24 your Curriculum Assistant is an MCP server you can use from your editor, running locally and over HTTP, plus a Python MCP server.

**Setup:** install [Node.js LTS](https://nodejs.org/en/download) for the MCP Inspector and the reference servers. The C# work needs the .NET 10 SDK, which you already have.

**Courses for this section (optional, see [resources.md](../resources.md)):** DeepLearning.AI's free [MCP: Build Rich-Context AI Apps with Anthropic](https://learn.deeplearning.ai/courses/mcp-build-rich-context-ai-apps-with-anthropic) for the concepts, and Udemy's [The Complete Model Context Protocol (MCP) Masterclass](https://www.udemy.com/course/mcp-masterclass/) for more depth.
**roadmap.sh:** [AI Agents](https://roadmap.sh/ai-agents) (the Model Context Protocol topics).

---

## Week 21: What MCP is, and using existing servers

**By the end of the week:** you understand hosts, clients, servers, tools, resources, and prompts, and you've used real MCP servers from your editor and from C#.

### Day 1: The MCP architecture

**Learn (~25 min)**
- [MCP: What is the Model Context Protocol?](https://modelcontextprotocol.io/docs/getting-started/intro)
- [MCP architecture overview](https://modelcontextprotocol.io/docs/learn/architecture)

**Do:** draw the pieces for your own setup: a **host** (VS Code or Kiro) contains **clients**, each connecting to one **server**, and servers offer **tools** (actions), **resources** (data to read), and **prompts** (reusable templates).

**Done when:** you can explain the difference between a tool and a resource, and between stdio and HTTP transport.

### Day 2: The MCP Inspector

**Topic:** the Inspector is a test UI that connects to any MCP server, so you can see and call what it offers without an AI model.

**Learn (~10 min)**
- [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector)

**Do:** run the reference "everything" server inside the Inspector:
```powershell
npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-everything
```
In the browser page that opens, list its tools, call `echo`, read one resource, and try one prompt.

**Done when:** you've called a tool, read a resource, and used a prompt, all by hand.

### Day 3: Use an MCP server from your editor

**Do:** add the official filesystem server to your editor, limited to your `ai-learning` folder.

For VS Code, create `.vscode/mcp.json` in the `ai-learning` repository:
```json
{
  "servers": {
    "files": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"]
    }
  }
}
```
For Kiro, add the same server under `mcpServers` in `.kiro/settings/mcp.json`. In the editor's agent chat, ask: "List the C# projects in this repository and summarize what each does."

**Done when:** the editor's AI answers by calling the filesystem tools, and you approved each call.

### Day 4: An MCP client in C#

**Learn (~15 min)**
- [Build a minimal MCP client](https://learn.microsoft.com/en-us/dotnet/ai/quickstarts/build-mcp-client) (Microsoft Learn). It uses Azure OpenAI; you'll use Ollama instead.

**Do**
```powershell
dotnet new console -o McpHost
cd McpHost
dotnet add package ModelContextProtocol --prerelease
dotnet add package OllamaSharp
```
```csharp
using Microsoft.Extensions.AI;
using ModelContextProtocol.Client;
using OllamaSharp;

var transport = new StdioClientTransport(new StdioClientTransportOptions
{
    Name = "Everything",
    Command = "npx",
    Arguments = ["-y", "@modelcontextprotocol/server-everything"],
});
McpClient mcp = await McpClient.CreateAsync(transport);

IList<McpClientTool> tools = await mcp.ListToolsAsync();
foreach (var t in tools) Console.WriteLine($"{t.Name}: {t.Description}");

// McpClientTool is an AIFunction, so it plugs straight into IChatClient.
IChatClient chat = new ChatClientBuilder(new OllamaApiClient(new Uri("http://localhost:11434/"), "qwen2.5:7b"))
    .UseFunctionInvocation().Build();

var answer = await chat.GetResponseAsync("Use the add tool to add 17 and 25.", new() { Tools = [.. tools] });
Console.WriteLine(answer.Text);
```

**Done when:** your app lists the server's tools, and the local model calls one of them.

### Day 5: Resources and prompts from C#

**Do:** in `McpHost`, also:
- list resources with `await mcp.ListResourcesAsync()` and read one with `await mcp.ReadResourceAsync(uri)`
- list prompts with `await mcp.ListPromptsAsync()` and fetch one with `await mcp.GetPromptAsync(name, arguments)`

Print what comes back.

**Done when:** you've read a resource and fetched a prompt from code, and can say when an app would use each.

### Day 6: Connect an agent to MCP tools

**Do:** give your Week 16 `StudyCoach` agent the filesystem server's tools, pointing at your `ai-learning` folder, by passing `tools: [.. mcpTools]` to `AsAIAgent(...)`. Ask: "Look at my week-03 folder and tell me what I built."

**Done when:** the agent reads your real files through MCP and describes them correctly.

### Day 7: Review and catch-up (light)

- Push `McpHost` to `ai-learning/week-21`.
- In your notes, list three MCP servers you'd want at work, for example ones for Jira, a database, or internal docs.

---

## Week 22: Build an MCP server in C#

**By the end of the week:** the Curriculum Assistant runs as an MCP server, so your editor's AI can search your plan and docs and check your progress.

### Day 1: Your first server from the template

**Learn (~20 min)**
- [Create a minimal MCP server](https://learn.microsoft.com/en-us/dotnet/ai/quickstarts/build-mcp-server) (Microsoft Learn)

**Do**
```powershell
dotnet new install Microsoft.McpServer.ProjectTemplates
dotnet new mcpserver -n HelloMcp
cd HelloMcp
dotnet build
```
Test it in the Inspector:
```powershell
npx @modelcontextprotocol/inspector dotnet run --project .
```

**Done when:** the Inspector lists the template's `get_random_number` tool, and calling it works.

### Day 2: Tools with attributes

**Learn (~15 min)**
- [MCP C# SDK: getting started](https://csharp.sdk.modelcontextprotocol.io/v1/concepts/getting-started.html)

**Do:** add a tool class to `HelloMcp`:
```csharp
using System.ComponentModel;
using ModelContextProtocol.Server;

[McpServerToolType]
public static class PlanTools
{
    [McpServerTool, Description("Returns the titles of all weeks in the learning plan.")]
    public static string[] ListWeeks() =>
        Directory.GetFiles(Environment.GetEnvironmentVariable("PLAN_DIR") ?? ".", "*.md", SearchOption.AllDirectories)
            .SelectMany(File.ReadLines)
            .Where(l => l.StartsWith("## Week "))
            .Select(l => l[3..])
            .ToArray();
}
```
Pass `PLAN_DIR` from the Inspector's environment settings, pointing at your plan folder.

**Done when:** `ListWeeks` returns all 52 weeks.

**Important:** with stdio, standard output carries the protocol. Never use `Console.WriteLine` in a stdio server. Log to standard error, which the template's logging setup already does.

### Day 3: The Curriculum Assistant as an MCP server

**Do:** create `src/Assistant.Mcp` from the template, reference `Assistant.Core`, and register your existing services with dependency injection, as in the API project. Expose these tools, passing work to your services:

| Tool | Calls |
|---|---|
| `search_knowledge(query, top)` | your hybrid search |
| `get_week(week)` | the plan lookup |
| `get_progress()` | the progress store |
| `compare_with_roadmap(roadmap)` | the Week 18 compare feature |

Tool methods can take services as parameters, and the SDK injects them, for example `public static async Task<string> SearchKnowledge(HybridSearch search, string query, int top = 3)`.

**Done when:** every tool works in the Inspector, with Qdrant and Ollama running.

### Day 4: Resources

**Do:** expose each plan week as a resource, so clients can read a whole week as context:
```csharp
[McpServerResourceType]
public static class PlanResources
{
    [McpServerResource(UriTemplate = "plan://week/{week}", Name = "Plan week"), Description("The full text of one week of the learning plan.")]
    public static string Week(PlanStore plan, int week) => plan.GetWeekText(week);
}
```
Register it with `.WithResourcesFromAssembly()`.

**Done when:** in the Inspector, reading `plan://week/22` returns this week's text.

### Day 5: Prompts

**Do:** add two prompts that clients can offer as ready-made commands:
- `study_today`, which builds the message "Here's my progress … Here's today's lesson … Coach me through it."
- `quiz_me(week)`, which builds "Ask me five questions about Week {week}, one at a time, and score my answers."

Use `[McpServerPromptType]` and `[McpServerPrompt]`, and register them with `.WithPromptsFromAssembly()`.

**Done when:** both prompts appear in the Inspector, and `quiz_me` gives a good quiz in your editor.

### Day 6: Use it from your editor every day

**Do:** add `Assistant.Mcp` to your editor's MCP config (`.vscode/mcp.json` or `.kiro/settings/mcp.json`) with `dotnet run --project <path>/src/Assistant.Mcp`, and set `PLAN_DIR` in `env`. From now on, start study sessions with the `study_today` prompt.

**Done when:** in your editor, asking "What should I do today, and which docs should I read?" uses your server's tools and answers from your real plan and progress.

### Day 7: Review and catch-up (light)

- Push. Add an "Use it as an MCP server" section to the README, with the config snippet.

---

## Week 23: Better MCP servers

**By the end of the week:** your server handles errors, long tasks, and changing data well, and it's tested.

### Day 1: Tool errors and input validation

**Learn (~15 min)**
- [MCP specification: tools](https://modelcontextprotocol.io/specification/latest/server/tools), the section on error handling

**Do:** make tools return clear errors instead of throwing, for example "Week 99 doesn't exist; the plan has weeks 1–52". Validate every input, such as a `top` value of 1–10 or a known roadmap name.

**Done when:** each bad input gives a helpful message in the Inspector.

### Day 2: Long-running tools and progress

**Topic:** `compare_with_roadmap` can take minutes. MCP lets servers send progress updates and lets clients cancel.

**Do:** read the C# SDK docs on progress notifications ([MCP C# SDK documentation](https://csharp.sdk.modelcontextprotocol.io/)). Make `compare_with_roadmap` report progress after each batch of topics, and stop when its `CancellationToken` is cancelled.

**Done when:** the Inspector shows progress while the tool runs, and cancelling stops it.

### Day 3: Testing the server

**Do:** add an xUnit test project for `Assistant.Mcp`. In each test, start the server with `StdioClientTransport`, connect an `McpClient`, and check:
- `ListToolsAsync()` returns exactly your four tools
- `get_week` with week 22 returns text containing "Build an MCP server in C#"
- `get_week` with week 99 returns your error message

**Done when:** `dotnet test` passes, which proves the server works from a real client's point of view.

### Day 4: Tool design for agents

**Topic:** MCP clients may connect many servers at once. Clear names, short descriptions, and small result sizes help the model choose well.

**Do:** review your tools:
- Use names like `search_knowledge`, not generic ones like `search`.
- Keep descriptions to one or two sentences each.
- Cap results, for example at 3,000 characters, and say when you've cut them short.

**Done when:** you've changed at least two tools and re-run your Week 20 agent tests through MCP.

### Day 5: Connecting the agent to its own MCP server

**Do:** change the Curriculum Agent so it gets its plan tools **through MCP** from `Assistant.Mcp`, instead of calling `AssistantTools` directly. Keep it behind a setting, `"Tools": "Direct"` or `"Mcp"`.

**Done when:** the browser chat works in both modes. This is how agents connect to tools owned by other teams.

### Day 6: Combining several servers

**Do:** give the Curriculum Agent three MCP servers at once: your own, the filesystem server (for your `ai-learning` code), and a fetch server for reading web pages, `uvx mcp-server-fetch`. Ask: "Compare what I wrote in week-11 with what the Qdrant hybrid search docs recommend."

**Done when:** one answer uses tools from all three servers.

### Day 7: Review and catch-up (light)

- Push, and draw the current architecture in the README: browser, API, agent, MCP servers, Qdrant, and Ollama.

---

## Week 24: Remote MCP over HTTP, and a Python server

**By the end of the week:** your MCP server runs over HTTP with an API key, and you've built a second MCP server in Python.

### Day 1: Streamable HTTP transport

**Learn (~15 min)**
- [MCP specification: transports](https://modelcontextprotocol.io/specification/latest/basic/transports)

**Do:** create `src/Assistant.McpHttp` with `dotnet new web`, add `dotnet add package ModelContextProtocol.AspNetCore --prerelease`, and reuse the same tool classes:
```csharp
builder.Services.AddMcpServer()
    .WithHttpTransport(o => o.Stateless = true)
    .WithToolsFromAssembly(typeof(PlanTools).Assembly)
    .WithResourcesFromAssembly(typeof(PlanTools).Assembly)
    .WithPromptsFromAssembly(typeof(PlanTools).Assembly);

var app = builder.Build();
app.MapMcp("/mcp");
app.Run("http://localhost:3001");
```
Set `"AllowedHosts": "localhost"` in `appsettings.json`, as the [C# SDK getting started](https://csharp.sdk.modelcontextprotocol.io/v1/concepts/getting-started.html) security notes recommend.

**Done when:** the Inspector connects to `http://localhost:3001/mcp` using the Streamable HTTP option, and the tools work.

### Day 2: Protecting it with an API key

**Learn (~20 min)**
- [MCP specification: authorization](https://modelcontextprotocol.io/specification/latest/basic/authorization). Skim it; full OAuth is beyond this week.

**Do:** add middleware that requires an `Authorization: Bearer <key>` header on `/mcp`, comparing it with a key from user secrets (`dotnet user-secrets set Mcp:ApiKey <random value>`). Return `401` otherwise. Add the header in the Inspector and in your editor's MCP config, using an input variable so the key isn't saved in the file.

**Done when:** requests without the key get `401`, and with the key they work.

### Day 3: A Python MCP server

**Learn (~15 min)**
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk), the FastMCP quickstart in the README

**Do:** turn your Week 6 link checker into an MCP server:
```powershell
uv init py-mcp
cd py-mcp
uv add "mcp[cli]" httpx
```
```python
# server.py
from mcp.server.fastmcp import FastMCP
import httpx

mcp = FastMCP("link-checker")

@mcp.tool()
async def check_url(url: str) -> str:
    """Check whether a URL works. Returns the status code and the final URL after redirects."""
    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
        try:
            r = await client.get(url)
            return f"{r.status_code} {r.url}"
        except httpx.HTTPError as e:
            return f"error: {e}"

if __name__ == "__main__":
    mcp.run()
```
Test it with `npx @modelcontextprotocol/inspector uv run server.py`.

**Done when:** `check_url` works in the Inspector.

### Day 4: Use the Python server from C#

**Do:** add the Python server to the Curriculum Agent's MCP servers, with `Command = "uv"` and `Arguments = ["run", "--project", "<path>/py-mcp", "server.py"]`. Ask: "Check whether all the links in Week 21 still work."

**Done when:** your C# agent calls your Python tool for each link and reports the results. C# and Python now work together through a standard protocol.

### Day 5: MCP security

**Learn (~20 min)**
- [MCP security best practices](https://modelcontextprotocol.io/specification/latest/basic/security_best_practices)

**Do:** add an "MCP" section to your `SECURITY.md` from Week 20, covering:
- which tools can change data, and how they're protected
- why you only install MCP servers you trust, since a server runs code on your machine
- your HTTP server's host restriction and API key
- how you'd stop a tool result from containing instructions that hijack the agent

**Done when:** the section is written, and you've checked your editor's MCP config for any server you don't actually need.

### Day 6: Package the HTTP server in Docker

**Do:** add a `Dockerfile` for `Assistant.McpHttp`, add it to `compose.yaml` on port 3001, and pass the API key as an environment variable. Connect your editor to the containerized server.

**Done when:** `docker compose up -d --build` runs the API, the MCP server, and Qdrant, and your editor uses the MCP server from Docker. This container is what you'll deploy to AWS in Week 37.

### Day 7: Review and catch-up (light)

- Push. Section E is complete. Tick the MCP topics on [roadmap.sh/ai-agents](https://roadmap.sh/ai-agents).
