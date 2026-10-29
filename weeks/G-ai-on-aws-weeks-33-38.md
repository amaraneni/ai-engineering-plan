# Section G: AI on AWS (Weeks 33–38)

Now the AI moves to AWS. Amazon Bedrock gives you models through an API, and because it plugs into the same `IChatClient` interface you've used all year, most of your code doesn't change. By Week 38 the Curriculum Assistant runs on AWS, with Bedrock models, cheap vector storage in S3, an agent, and its MCP server.

**Cost rules for this section:**
- Bedrock charges per token. Use small, cheap models for learning, such as the Amazon Nova Micro or Lite models, and check prices on the [Amazon Bedrock pricing](https://aws.amazon.com/bedrock/pricing/) page before each week.
- **Don't use OpenSearch Serverless** for Knowledge Bases. It has a high minimum monthly cost. This plan uses **Amazon S3 Vectors** instead, which costs very little at this size.
- Keep your $10 budget alert from Week 25 on.

**Courses for this section (optional, see [resources.md](../resources.md)):** Coursera's [Amazon Bedrock: Getting Started with Generative AI](https://www.coursera.org/learn/amazon-bedrock-getting-started) for Week 33, and [Generative AI Applications with Amazon Bedrock](https://www.coursera.org/learn/generative-ai-applications-amazon-bedrock) for Weeks 34–36. AWS also has free courses on Knowledge Bases, Agents, and Guardrails on its [AI training page](https://aws.amazon.com/training/learn-about/ai/).
**roadmap.sh:** [AWS](https://roadmap.sh/aws) and [AI Engineer](https://roadmap.sh/ai-engineer).

---

## Week 33: Amazon Bedrock from C#

**By the end of the week:** Bedrock models answering from your C# code through `IChatClient` and `IEmbeddingGenerator`, and an assistant that can switch between Ollama and Bedrock with one setting.

### Day 1: What Bedrock is

**Learn (~20 min)**
- [What is Amazon Bedrock?](https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html)

**Do:** in the Bedrock console in `us-east-1`, open the **Model catalog**. Find two cheap text models (for example from Amazon Nova) and one embedding model (Amazon Titan Text Embeddings V2). Write down their model IDs and their prices per million input and output tokens. If a model shows that it needs access, request it.

**Done when:** you have a short table of three models with their IDs and prices.

### Day 2: The playground

**Do:** in the Bedrock **Chat playground**, ask the same three questions you asked `llama3.2` in Week 1 to each cheap model. Look at the token counts and the response time it shows.

**Done when:** you can compare the cloud models with your local model on quality, speed, and cost.

### Day 3: Bedrock through `IChatClient`

**Learn (~10 min)**
- [Agent Framework: Amazon Bedrock](https://learn.microsoft.com/en-us/agent-framework/integrations/by-component/model-providers/amazon-bedrock). It shows the `AsIChatClient` bridge.

**Do**
```powershell
dotnet new console -o BedrockChat
cd BedrockChat
dotnet add package AWSSDK.Extensions.Bedrock.MEAI
```
```csharp
using Amazon;
using Amazon.BedrockRuntime;
using Microsoft.Extensions.AI;

var runtime = new AmazonBedrockRuntimeClient(RegionEndpoint.USEast1);   // credentials from AWS_PROFILE
IChatClient chat = runtime.AsIChatClient("<model ID from Day 1>");

ChatResponse r = await chat.GetResponseAsync("Explain RAG in two sentences.");
Console.WriteLine(r.Text);
Console.WriteLine($"[tokens in: {r.Usage?.InputTokenCount}, out: {r.Usage?.OutputTokenCount}]");
```
Some models need an **inference profile** ID, which starts with `us.`. If you get an error about on-demand throughput, use the profile ID shown in the model catalog.

**Done when:** a Bedrock model answers, and you see its token usage. This is the same `IChatClient` code you wrote in Week 1.

### Day 4: Embeddings with Titan

**Learn (~10 min)**
- [Amazon Titan Text Embeddings models](https://docs.aws.amazon.com/bedrock/latest/userguide/titan-embedding-models.html)

**Do:** generate embeddings with `amazon.titan-embed-text-v2:0`, using the same package:
```csharp
IEmbeddingGenerator<string, Embedding<float>> embedder = runtime.AsIEmbeddingGenerator("amazon.titan-embed-text-v2:0");
var v = await embedder.GenerateVectorAsync("How do I deploy a Lambda function?");
Console.WriteLine(v.Length);   // 1024 by default
```
Then run your Week 3 Day 2 similarity pairs again with Titan.

**Done when:** you get 1,024-number vectors, and the similarity pairs still rank sensibly.

### Day 5: One setting to switch providers

**Do:** in `Assistant.Core`, add an `AiProviderOptions` setting, `"Provider": "Ollama"` or `"Bedrock"`, plus the model IDs. Register `IChatClient` and `IEmbeddingGenerator` based on it.

Titan produces 1,024 numbers and `nomic-embed-text` produces 768, so you can't mix them in one collection. Give each provider its own collection, such as `knowledge-768` and `knowledge-1024`.

**Done when:** the same assistant runs on Ollama or Bedrock by changing one setting, and re-indexing with Bedrock fills the 1,024-size collection.

### Day 6: Compare local and cloud on your evaluation

**Do:** run your Week 12 evaluation with Ollama, then with Bedrock. Record retrieval scores, faithfulness, average answer time, and the Bedrock cost, from the token usage times the price.

**Done when:** you have a table comparing them, with a recommendation for when to use each.

### Day 7: Review and catch-up (light)

- Push. Check Cost Explorer: this week should have cost less than a dollar.

---

## Week 34: Bedrock Knowledge Bases and S3 Vectors

**By the end of the week:** a managed RAG setup built with Bedrock Knowledge Bases, and an honest comparison with the RAG you built yourself.

### Day 1: Managed RAG

**Learn (~20 min)**
- [Build a knowledge base with vector stores](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-build.html)
- [Using S3 Vectors with Bedrock Knowledge Bases](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors-bedrock-kb.html)

**Do:** list which parts of your own RAG a Knowledge Base replaces (chunking, embedding, vector storage, retrieval) and which it doesn't (your evaluation, your tools, your citations format).

**Done when:** you can say what you'd gain and lose by using it.

### Day 2: Create a Knowledge Base

**Do**
1. Upload `data/sources/*.md` and the plan files to an S3 bucket with `sources upload` from Week 26.
2. In the Bedrock console, create a Knowledge Base with that bucket as the data source, Titan Text Embeddings V2, and **S3 Vectors** as the vector store, using the quick-create option.
3. **Sync** the data source.

**Done when:** the sync finishes, and the Knowledge Base shows your documents.

### Day 3: Query it

**Do:** test it in the console's **Test knowledge base** panel, then from C#:
```csharp
// dotnet add package AWSSDK.BedrockAgentRuntime
using Amazon.BedrockAgentRuntime;
using Amazon.BedrockAgentRuntime.Model;

var kb = new AmazonBedrockAgentRuntimeClient(Amazon.RegionEndpoint.USEast1);
var result = await kb.RetrieveAsync(new RetrieveRequest
{
    KnowledgeBaseId = "<your KB id>",
    RetrievalQuery = new KnowledgeBaseQuery { Text = "Which day teaches cosine similarity?" }
});
foreach (var r in result.RetrievalResults)
    Console.WriteLine($"{r.Score:F3} {r.Location.S3Location.Uri}\n{r.Content.Text[..Math.Min(200, r.Content.Text.Length)]}\n");
```

**Done when:** retrieval returns the right chunks from C#.

### Day 4: The Knowledge Base as one more store

**Do:** add `BedrockKbKnowledgeStore : IKnowledgeStore`, which calls `RetrieveAsync` and maps the results to `KnowledgeChunk`. Its `UpsertAsync` should say indexing is handled by the Knowledge Base sync.

**Done when:** the assistant can answer using the Knowledge Base by changing the store setting.

### Day 5: Compare it with your own RAG

**Do:** run your Week 12 retrieval evaluation against the Knowledge Base, and fill in a table for your own RAG versus the Knowledge Base, covering hits@3, MRR, setup time, control over chunking, the cost per month at your size, and how hard it is to debug.

**Done when:** you have a recommendation you could give a customer. This is a classic forward deployed engineer question: "Should we build it or use the managed service?"

### Day 6: S3 Vectors directly

**Learn (~15 min)**
- [Getting started with S3 Vectors](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors-getting-started.html)

**Do:** create your own vector bucket and index (1,024 dimensions, cosine). Write `S3VectorsKnowledgeStore : IKnowledgeStore` with the `AWSSDK.S3Vectors` package, putting vectors with your `KnowledgeChunk` fields as metadata and querying them. Index your sources with Bedrock embeddings into it.

**Done when:** the assistant works with S3 Vectors as its store, with your own chunking and hybrid search on top. This is the store you'll use in the deployed version.

### Day 7: Review and catch-up (light)

- **Clean up:** delete the Knowledge Base and its quick-created vector index. Keep your own S3 Vectors index for next week. Run your cleanup script.

---

## Week 35: Deploy the RAG assistant to AWS

**By the end of the week:** the Curriculum Assistant API and chat page running on AWS: Fargate for the API, Bedrock for the models, S3 Vectors for search, DynamoDB for progress, and S3 for sources, all defined in CDK.

**Cost warning:** this uses a load balancer and a Fargate task. Deploy, test, and destroy on the same day, as in Week 32.

### Day 1: Architecture

**Do:** draw the target architecture in the README: browser, then the load balancer, then Fargate (`Assistant.Api`), which calls Bedrock, S3 Vectors, DynamoDB, and S3. Use the Fargate-or-Lambda decision you made in Week 32. Fargate suits streaming answers.

**Done when:** you have a diagram and a list of the IAM permissions the task needs.

### Day 2: CDK stack for the data

**Do:** in `infra`, add a `DataStack` with the sources bucket, the progress table (from Week 30), and the S3 Vectors bucket and index. Check the CDK docs for current S3 Vectors support; if your CDK version has no construct for it, create it with a CDK custom resource or the CLI, and note which you used.

**Done when:** `cdk deploy DataStack` creates them all.

### Day 3: CDK stack for the API

**Do:** add an `ApiStack` with `ApplicationLoadBalancedFargateService` (as in Week 32), with:
- environment variables setting the provider to Bedrock, the store to S3 Vectors, and the progress store to DynamoDB
- a task role with least privilege: `bedrock:InvokeModel` on your two model IDs only, read on the sources bucket, query and put on the vector index, and read and write on the progress table

**Done when:** `cdk deploy ApiStack` starts the task, and `/health` reports that everything is reachable.

### Day 4: Index the sources in AWS

**Do:** run `index build` from your laptop against AWS (Bedrock embeddings into S3 Vectors), or add a one-off ECS task that runs it. Then ask questions through the deployed chat page.

**Done when:** the deployed chat page answers questions about your plan, with sources.

### Day 5: Protect the public URL

**Do:** right now anyone with the URL can use your Bedrock budget. Add simple protection:
- an API key header checked by the API, with the key in Secrets Manager (as in Week 32), and the chat page asking for it once and saving it in the browser
- the rate limit from Week 14, which is still on
- a CloudWatch alarm on the `/ask` request count that emails you if there are over 200 requests in an hour

**Done when:** requests without the key get `401`, and the alarm is set up.

### Day 6: Run your evaluation against AWS

**Do:** point your Week 12 evaluation at the deployed API's URL, and compare the results with local Ollama. Write down the cost of the full evaluation run.

**Done when:** you've measured the deployed system, not just your laptop.

### Day 7: Review and catch-up (light)

- **Clean up:** `cdk destroy ApiStack`. Keep `DataStack`, which costs cents. Run your cleanup script.

---

## Week 36: Agents on AWS

**By the end of the week:** the Curriculum Agent running with a Bedrock model, and deployed to Amazon Bedrock AgentCore Runtime.

### Day 1: Agent options on AWS

**Learn (~20 min)**
- [What is Amazon Bedrock AgentCore?](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html)

**Do:** compare three ways to run your agent: in your own Fargate API (as now), as **Bedrock Agents** (AWS-managed agents configured in the console), or in **AgentCore Runtime** (AWS hosts your own agent's container). Write down when each fits.

**Done when:** you can explain what AgentCore Runtime gives you: isolated sessions, scaling, and identity, without managing servers.

### Day 2: The Curriculum Agent on Bedrock

**Do:** switch the agent's model to Bedrock with your Week 33 setting. Run your Week 20 agent tests against it, checking which tools it called.

**Done when:** the agent tests pass on Bedrock. Write down any tool-calling differences from your local model.

### Day 3: The AgentCore HTTP contract

**Learn (~15 min)**
- [AgentCore Runtime HTTP protocol contract](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-http-protocol-contract.html)

**Do:** create `src/Assistant.AgentHost`, a minimal API on port 8080 with:
- `GET /ping`, returning `{ "status": "Healthy" }`
- `POST /invocations`, which takes `{ "prompt": "...", "sessionId": "..." }`, runs the Curriculum Agent, and returns `{ "response": "..." }`

Test it locally with `Invoke-RestMethod`.

**Done when:** both endpoints work locally.

### Day 4: Build for ARM64 and deploy

**Topic:** AgentCore Runtime requires ARM64 container images.

**Do**
```powershell
docker buildx build --platform linux/arm64 -t <account-id>.dkr.ecr.us-east-1.amazonaws.com/curriculum-agent:v1 --push .
```
In the AgentCore console, create an agent runtime from that image, and give its execution role the Bedrock, S3 Vectors, and DynamoDB permissions from Week 35.

**Done when:** the runtime shows as ready.

### Day 5: Invoke it from C#

**Do:** call the deployed agent with `AWSSDK.BedrockAgentCore`'s `InvokeAgentRuntimeAsync`, passing a payload and a session ID. Then add an `"Agent": "Local"` or `"AgentCore"` setting to `Assistant.Api`, so the chat page can use the hosted agent.

**Done when:** a question from your laptop is answered by the agent running in AgentCore, and a follow-up in the same session remembers the conversation.

### Day 6: Observability for the hosted agent

**Do:** find the agent's logs and traces in CloudWatch (AgentCore has built-in observability; see its docs). Ask three questions and follow one of them through its tool calls.

**Done when:** you can see each tool call the hosted agent made for one question.

### Day 7: Review and catch-up (light)

- **Clean up:** delete the AgentCore runtime (or note that it charges only while it's working, and check the current pricing page), and run your cleanup script.

---

## Week 37: Deploy your MCP server to AWS

**By the end of the week:** your Curriculum Assistant MCP server reachable over HTTPS on AWS, so your editor can use it from anywhere.

### Day 1: Options for hosting MCP servers

**Learn (~20 min)**
- [MCP deployment patterns on AWS: AgentCore](https://docs.aws.amazon.com/prescriptive-guidance/latest/mcp-deployment-patterns-on-aws/deployment-pattern-1-amazon-bedrock-agent-core.html) (AWS Prescriptive Guidance)

**Do:** compare running your Week 24 `Assistant.McpHttp` container on Fargate with deploying it to AgentCore Runtime, which supports MCP servers directly.

**Done when:** you've picked one, with your reasons written down.

### Day 2: MCP server on Fargate

**Do:** add an `McpStack` to CDK, similar to the API stack: a Fargate service for `Assistant.McpHttp` behind a load balancer, with the API key in Secrets Manager and the same least-privilege task role.

**Done when:** the Inspector connects to `http://<load-balancer>/mcp` with your API key.

### Day 3: HTTPS

**Topic:** API keys must never travel over plain HTTP.

**Do:** if you have a domain, add an ACM certificate and an HTTPS listener in CDK. If you don't, put **Amazon CloudFront** in front of the load balancer, which gives you an HTTPS URL on a `cloudfront.net` domain. Check that CloudFront passes the `Authorization` header through.

**Done when:** the Inspector connects over `https://`.

### Day 4: MCP server on AgentCore Runtime (alternative)

**Learn (~15 min)**
- [Deploy MCP servers in AgentCore Runtime](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-mcp.html)

**Do:** follow the guide to deploy your MCP server (built for ARM64) to AgentCore Runtime, and connect with the authentication method the guide describes.

**Done when:** you've connected to the AgentCore-hosted server, and you can compare the setup effort with Fargate.

### Day 5: Use the remote server from your editor

**Do:** add the remote server to your editor's MCP config with the HTTPS URL and an `Authorization` header from an input variable. Remove the local `dotnet run` server from the config, then ask your editor's AI for today's lesson.

**Done when:** your editor uses the AWS-hosted MCP server.

### Day 6: Agent plus remote MCP

**Do:** point the Curriculum Agent's MCP settings at the remote server instead of the local one, deploy it, and run your agent tests.

**Done when:** the deployed agent gets its tools from the deployed MCP server. This is a real distributed AI system.

### Day 7: Review and catch-up (light)

- **Clean up:** `cdk destroy McpStack`, and delete the AgentCore runtime if you created one. Run your cleanup script.

---

## Week 38: Security for AI on AWS

**By the end of the week:** guardrails on model input and output, tighter permissions, an audit trail, and a written security review of the deployed assistant.

### Day 1: Bedrock Guardrails

**Learn (~20 min)**
- [How Amazon Bedrock Guardrails works](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-how.html)

**Do:** create a guardrail with a denied topic ("financial advice"), content filters at medium strength, and a sensitive-information filter that masks email addresses and AWS access keys. Test it in the console.

**Done when:** a question asking for investment advice is blocked, and an email address in an answer is masked.

### Day 2: Guardrails from C#

**Learn (~15 min)**
- [Use the ApplyGuardrail API](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-use-independent-api.html)

**Do:** add a guardrail check to the API with `ApplyGuardrailAsync` (from `AWSSDK.BedrockRuntime`) on the question before answering, and on the answer before returning it. Because it's a separate call, it works whichever model provider you use.

**Done when:** blocked questions get a polite refusal in the chat page, and your Week 20 input and output tests still pass.

### Day 3: Least-privilege review

**Do:** open IAM Access Analyzer and generate a policy from your task role's real activity in CloudTrail (the **Generate policy** option). Compare it with the policy you wrote. Remove anything the role never used.

**Done when:** the task role has only the permissions it actually uses.

### Day 4: Audit trail

**Learn (~15 min)**
- [What is AWS CloudTrail?](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html)

**Do:** in CloudTrail **Event history**, find your recent Bedrock `InvokeModel` calls and the IAM changes you made this week. Filter by your task role's name.

**Done when:** you can answer "who called Bedrock, and when?" from CloudTrail.

### Day 5: Secrets and encryption

**Do:** check that every secret (API keys) is in Secrets Manager, not in environment variables, task definitions, or Git. Search your repositories with `git log -p | Select-String "AKIA|sk-"`. Check that the S3 buckets and the DynamoDB table are encrypted at rest; by default they are.

**Done when:** you've found no secrets in your code or history, and you've written down where each one is stored.

### Day 6: Security review of the deployed assistant

**Do:** update `SECURITY.md` with an AWS section:
- the data flows, and where data is stored
- IAM roles and what each can do
- guardrails and their limits
- what's public, and how it's protected (API key, rate limit, alarm)
- the alarms and audit logs you have

Then check it against the security pillar of the [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html).

**Done when:** the review is written, and every gap has a fix or is listed as an accepted risk.

### Day 7: Review and catch-up (light)

- Push, and destroy anything still running. Section G is complete. Tick the topics on [roadmap.sh/aws](https://roadmap.sh/aws).
