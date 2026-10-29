# Resources and mapping

This page lists the courses, docs, and roadmaps behind the plan, and which weeks use each one. Daily lessons link to the exact docs page for that day. The courses here are **optional extra depth**: watch the parts that match the week you're on, not the whole course up front.

**How links were checked:** every link in the plan is tested by `tools/check-links.mjs`, and the latest results are in `tools/link-report.json`. Udemy, Coursera, and LinkedIn Learning pages often refuse automated checks, so those course links were also confirmed by searching each publisher's site. The date of the last check is at the bottom of this page.

**Udemy Business note:** Udemy Business includes most popular Udemy courses, but not all of them. If a 🅤 course isn't in your company's catalog, search Udemy Business for the course title or instructor; there's usually an equivalent.

**Access key:** 🆓 free · 🎓 Coursera Plus · 🅤 Udemy Business · 💼 LinkedIn Learning · 🧭 roadmap.sh Premium · 🅰 AlgoMaster Premium · ☁ AWS Skill Builder (free tier, with paid labs)

---

## roadmap.sh: your progress tracker

Tick topics on these roadmaps as you finish the matching weeks. Premium gives you progress tracking and the AI tutor; the roadmaps themselves are free.

| Roadmap | Link | Weeks |
|---|---|---|
| AI Engineer | [roadmap.sh/ai-engineer](https://roadmap.sh/ai-engineer) | 1–4, 9–14, 33–36, 41–42 |
| AI Agents | [roadmap.sh/ai-agents](https://roadmap.sh/ai-agents) | 2, 15–24 |
| Prompt Engineering | [roadmap.sh/prompt-engineering](https://roadmap.sh/prompt-engineering) | 1–2 |
| Python | [roadmap.sh/python](https://roadmap.sh/python) | 5–8 |
| Docker | [roadmap.sh/docker](https://roadmap.sh/docker) | 10, 14, 32 |
| AWS | [roadmap.sh/aws](https://roadmap.sh/aws) | 25–38 |
| ASP.NET Core | [roadmap.sh/aspnet-core](https://roadmap.sh/aspnet-core) | 14, 28 |
| DevOps | [roadmap.sh/devops](https://roadmap.sh/devops) | 39–44 |
| Linux | [roadmap.sh/linux](https://roadmap.sh/linux) | 44 |
| MLOps | [roadmap.sh/mlops](https://roadmap.sh/mlops) | 40–42 |
| System Design | [roadmap.sh/system-design](https://roadmap.sh/system-design) | 31, 41, 43, 51–52 |
| Git and GitHub | [roadmap.sh/git-github](https://roadmap.sh/git-github) | 1, 39 |

---

## Courses by section

### A. AI foundations in .NET (Weeks 1–4)

| Course | Access | Use it for |
|---|---|---|
| [Generative AI for Beginners .NET](https://github.com/microsoft/Generative-AI-for-beginners-dotnet) (Microsoft) | 🆓 | Weeks 1–4. The closest match to this section: chat, tools, RAG, all in C# |
| [Microsoft.Extensions.AI libraries](https://learn.microsoft.com/en-us/dotnet/ai/microsoft-extensions-ai) (Microsoft Learn) | 🆓 | Weeks 1–4 reference for `IChatClient` and `IEmbeddingGenerator` |
| [Generative AI with Large Language Models](https://www.coursera.org/learn/generative-ai-with-llms) (DeepLearning.AI and AWS) | 🎓 | Weeks 1–3, for how LLMs work underneath. Its labs are in Python; watch the videos |
| [LinkedIn Learning: Microsoft.Extensions.AI and .NET AI courses](https://www.linkedin.com/learning/search?keywords=.NET%20generative%20AI) | 💼 | Weeks 1–2. Pick a recent C# course from the search results |

### B. Python for AI (Weeks 5–8)

| Course | Access | Use it for |
|---|---|---|
| [Python for Everybody Specialization](https://www.coursera.org/specializations/python) (University of Michigan) | 🎓 | Weeks 5–6. Watch at 1.5× speed and skip parts you know from C# |
| [LinkedIn Learning: Python Essential Training](https://www.linkedin.com/learning/search?keywords=Python%20Essential%20Training) | 💼 | Weeks 5–6, if you prefer short videos |
| [The Python Tutorial](https://docs.python.org/3/tutorial/) (python.org) | 🆓 | Weeks 5–6 reference |
| [FastAPI tutorial](https://fastapi.tiangolo.com/tutorial/) | 🆓 | Week 8 |

### C. RAG in depth (Weeks 9–14)

| Course | Access | Use it for |
|---|---|---|
| [Retrieval Augmented Generation (RAG)](https://www.coursera.org/learn/retrieval-augmented-generation-rag) (DeepLearning.AI) | 🎓 | Weeks 9–13. The best single RAG course: chunking, hybrid search, reranking, evaluation |
| [Docker and Kubernetes: The Complete Guide](https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/) (Stephen Grider) | 🅤 | Week 10. Only the Docker sections; Kubernetes isn't needed in this plan |
| [Docker: Get started](https://docs.docker.com/get-started/) | 🆓 | Week 10 |
| [Qdrant documentation](https://qdrant.tech/documentation/) | 🆓 | Weeks 10–11 |
| [Vector data in .NET](https://learn.microsoft.com/en-us/dotnet/ai/vector-stores/overview) (Microsoft Learn) | 🆓 | Week 10 |

### D. Agents (Weeks 15–20)

| Course | Access | Use it for |
|---|---|---|
| [Microsoft Agent Framework: get started](https://learn.microsoft.com/en-us/agent-framework/get-started/) (Microsoft Learn) | 🆓 | Weeks 16–18, the main .NET agent framework (version 1.0 since April 2026) |
| [Microsoft AI Agents Professional Certificate](https://www.coursera.org/professional-certificates/microsoft-ai-agents) (Microsoft) | 🎓 | Weeks 15–18 |
| [AI Agents in LangGraph](https://learn.deeplearning.ai/courses/ai-agents-in-langgraph) (DeepLearning.AI) | 🆓 | Week 19 |
| [LinkedIn Learning: Microsoft Agent Framework](https://www.linkedin.com/learning/search?keywords=Microsoft%20Agent%20Framework) | 💼 | Weeks 16–18. Search result list; José Luis Latorre's courses are .NET-focused |
| [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) | 🆓 | Week 20 |

### E. MCP (Weeks 21–24)

| Course | Access | Use it for |
|---|---|---|
| [MCP: Build Rich-Context AI Apps with Anthropic](https://learn.deeplearning.ai/courses/mcp-build-rich-context-ai-apps-with-anthropic) (DeepLearning.AI) | 🆓 | Weeks 21–24. Short and clear; its labs are in Python |
| [Model Context Protocol documentation](https://modelcontextprotocol.io/docs/getting-started/intro) | 🆓 | Weeks 21–24 |
| [MCP C# SDK documentation](https://csharp.sdk.modelcontextprotocol.io/) | 🆓 | Weeks 22–24 |
| [The Complete Model Context Protocol (MCP) Masterclass](https://www.udemy.com/course/mcp-masterclass/) | 🅤 | Weeks 21–24, for more depth on deployment and clients |

### F. AWS foundations with .NET (Weeks 25–32)

| Course | Access | Use it for |
|---|---|---|
| [Ultimate AWS Certified Developer Associate](https://www.udemy.com/course/aws-certified-developer-associate-dva-c01/) (Stephane Maarek) | 🅤 | Weeks 25–32. Watch only the sections for each week's service |
| [Ultimate AWS Certified Solutions Architect Associate](https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/) (Stephane Maarek) | 🅤 | Weeks 31 and 38, for networking and architecture |
| [AWS Lambda For The .NET Developer](https://www.udemy.com/course/aws-lambda-dotnet/) | 🅤 | Weeks 27–28, Lambda in C# specifically |
| [AWS CDK v2: Beginner to Advanced](https://www.udemy.com/course/aws-cloud-development-kit-cdk-v2-beginner-to-advanced/) | 🅤 | Week 30 |
| [AWS SDK for .NET developer guide](https://docs.aws.amazon.com/sdk-for-net/v4/developer-guide/welcome.html) | 🆓 | Weeks 26–30 |
| [AWS Skill Builder](https://skillbuilder.aws/) | ☁ | Weeks 25–38. Free courses; **paid Builder Labs are worth it only for Weeks 31–32**, where a sandbox stops networking mistakes from costing money |
| [AWS Skill Builder: immersive learning and labs](https://aws.amazon.com/training/digital/immersive-learning/) | ☁ (paid) | Weeks 31–32, optional |

### G. AI on AWS (Weeks 33–38)

| Course | Access | Use it for |
|---|---|---|
| [Amazon Bedrock: Getting Started with Generative AI](https://www.coursera.org/learn/amazon-bedrock-getting-started) (AWS) | 🎓 | Week 33 |
| [Generative AI Applications with Amazon Bedrock](https://www.coursera.org/learn/generative-ai-applications-amazon-bedrock) (AWS) | 🎓 | Weeks 34–36 |
| [AWS training: generative AI](https://aws.amazon.com/training/learn-about/ai/) | ☁ | Weeks 33–38, free courses on Knowledge Bases, Agents, and Guardrails |
| [Amazon Bedrock user guide](https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html) | 🆓 | Weeks 33–38 |

### H. Production and DevOps (Weeks 39–44)

| Course | Access | Use it for |
|---|---|---|
| [OpenTelemetry for .NET](https://opentelemetry.io/docs/languages/dotnet/) | 🆓 | Week 40 |
| [OpenTelemetry semantic conventions for generative AI](https://github.com/open-telemetry/semantic-conventions-genai) | 🆓 | Week 40 |
| [AlgoMaster: System Design](https://algomaster.io/learn/system-design) | 🅰 | Weeks 41 and 43, for caching, rate limiting, and reliability patterns |
| [LinkedIn Learning: GitHub Actions](https://www.linkedin.com/learning/search?keywords=GitHub%20Actions) | 💼 | Week 39 |
| [LinkedIn Learning: Linux command line](https://www.linkedin.com/learning/search?keywords=Linux%20command%20line) | 💼 | Week 44 |

### I. Forward deployed engineering (Weeks 45–50)

| Resource | Access | Use it for |
|---|---|---|
| [What is a forward deployed engineer?](https://hatchworks.com/blog/fde/forward-deployed-engineer/) (HatchWorks) | 🆓 | Week 45, a plain description of the role |
| [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) | 🆓 | Weeks 46–47 |
| [LinkedIn Learning: technical consulting and stakeholder communication](https://www.linkedin.com/learning/search?keywords=technical%20consulting%20skills) | 💼 | Weeks 45 and 48 |

### J. Capstone (Weeks 51–52)

No new course. Use [AlgoMaster: System Design](https://algomaster.io/learn/system-design) 🅰 and the [System Design roadmap](https://roadmap.sh/system-design) to review your final architecture.

---

## Coverage map

Every outcome in the goal, and where you build it:

| Goal | Weeks | What you'll have built |
|---|---|---|
| AI / LLM apps | 1–4 | C# chat, tools, structured output, embeddings |
| Python development | 5–8, then 12, 19, 24 | Python CLI tools, a FastAPI service, a RAG app, a LangGraph agent, a Python MCP server |
| RAG | 4, 9–14, 34–35 | Curriculum Assistant: hybrid search, reranking, evaluation, API |
| Agents | 15–20, 36 | Tool-using agents, workflows with approval, multi-agent setups |
| MCP | 21–24, 37 | C# and Python MCP servers, local and remote |
| AWS | 25–38 | Lambda, API Gateway, DynamoDB, CDK, VPC, ECS, Bedrock |
| Production / DevOps | 39–44 | CI/CD, tracing, evaluation in CI, reliability |
| Forward deployed engineering | 45–50 | Scoping docs, a customer-account deployment, a demo, runbooks |
| Curriculum Assistant chatbot | 1, 4, 9–14, 16–18, 22–23, 35–42, 51–52 | Your portfolio project |

Last checked: see the date in `tools/link-report.json`.
