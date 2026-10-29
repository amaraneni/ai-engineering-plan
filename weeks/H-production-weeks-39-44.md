# Section H: Production and DevOps (Weeks 39–44)

Running in AWS isn't the same as being production-ready. These weeks add automated deployment, visibility into every request, cost and speed controls, quality checks that block bad changes, reliability under failure, and the Linux skills you need when something breaks.

**Courses for this section (optional, see [resources.md](../resources.md)):** LinkedIn Learning's [GitHub Actions courses](https://www.linkedin.com/learning/search?keywords=GitHub%20Actions) for Week 39, AlgoMaster's [System Design](https://algomaster.io/learn/system-design) lessons on caching, rate limiting, and reliability for Weeks 41 and 43, and LinkedIn Learning's [Linux command line courses](https://www.linkedin.com/learning/search?keywords=Linux%20command%20line) for Week 44.
**roadmap.sh:** [DevOps](https://roadmap.sh/devops), [MLOps](https://roadmap.sh/mlops), [System Design](https://roadmap.sh/system-design), and [Linux](https://roadmap.sh/linux).

---

## Week 39: CI/CD with GitHub Actions to AWS

**By the end of the week:** every push builds and tests the Curriculum Assistant, and a release deploys it to AWS with no stored AWS keys.

### Day 1: GitHub Actions basics

**Learn (~20 min)**
- [Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions)

**Do:** add `.github/workflows/ci.yml` to `CurriculumAssistant`:
```yaml
name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "10.0.x"
      - run: dotnet restore
      - run: dotnet build --no-restore -c Release
      - run: dotnet test --no-build -c Release --filter "Category!=Integration"
```
Mark tests that need Ollama, Qdrant, or AWS with `[Trait("Category", "Integration")]`, so CI skips them.

**Done when:** pushing shows a green check on GitHub.

### Day 2: Build and push the container image

**Do:** add a job that runs only on the `main` branch, building the `Assistant.Api` image with `docker/build-push-action` and tagging it with the commit SHA. Push it to GitHub's container registry (`ghcr.io`) for now.

**Done when:** each push to `main` produces an image tagged with its commit.

### Day 3: AWS access without stored keys (OIDC)

**Learn (~20 min)**
- [Configuring OpenID Connect in Amazon Web Services](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)

**Do**
1. In CDK, add an IAM OIDC provider for `token.actions.githubusercontent.com`, and a `GitHubDeployRole` that only your repository's `main` branch can assume (restrict the trust policy with the `sub` claim `repo:<you>/CurriculumAssistant:ref:refs/heads/main`).
2. Give the role only what it needs: push to your ECR repository and run `cdk deploy`.
3. In the workflow, use [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials) with `role-to-assume` and `permissions: id-token: write`.

**Done when:** a workflow step runs `aws sts get-caller-identity` and shows the deploy role, with no AWS secrets stored in GitHub.

### Day 4: Deploy on release

**Do:** add `.github/workflows/deploy.yml`, triggered when you publish a GitHub release:
1. Build and push the image to ECR, tagged with the release version.
2. Run `cdk deploy DataStack ApiStack --require-approval never -c imageTag=<version>`.
3. Call `/health` on the deployed URL, and fail the job if it isn't healthy.

**Done when:** publishing release `v1.1.0` deploys that version to AWS, and the job checks it's healthy.

### Day 5: Environments and approval

**Do:** create two GitHub **environments**, `test` and `prod`. Deploy to `test` automatically, then require your manual approval before `prod`. Use the `-c env=` option from Week 30.

**Done when:** a release waits for your approval before going to `prod`.

### Day 6: Rollback

**Do:** release a deliberately broken version that fails `/health`. Check that the deploy job fails, then roll back by re-running the deploy for the previous release tag. Write the rollback steps in `RUNBOOK.md`.

**Done when:** you've rolled back once, and the runbook says how.

### Day 7: Review and catch-up (light)

- **Clean up:** destroy the `test` and `prod` stacks when you're done (`cdk destroy -c env=test`, and the same for `prod`). From now on, deploy only when a lesson needs it.

---

## Week 40: Observability for AI systems

**By the end of the week:** traces showing every step of an answer (search, model calls, tool calls, tokens, and time), plus logs and metrics in one place.

### Day 1: Logs, metrics, and traces

**Learn (~20 min)**
- [OpenTelemetry for .NET](https://opentelemetry.io/docs/languages/dotnet/)

**Do:** for one `/ask` request, write down what you'd want to see: the steps in order, the time each took, the tokens used, the tool calls, and any errors.

**Done when:** you can explain the difference between a log, a metric, and a trace, with an example of each from your app.

### Day 2: Tracing with the Aspire dashboard

**Learn (~10 min)**
- [Standalone Aspire dashboard](https://aspire.dev/dashboard/standalone/)

**Do**
1. Run the dashboard locally:
   ```powershell
   docker run --rm -it -p 18888:18888 -p 4317:18889 --name aspire-dashboard mcr.microsoft.com/dotnet/aspire-dashboard:latest
   ```
2. Add OpenTelemetry to `Assistant.Api` with `dotnet add package OpenTelemetry.Extensions.Hosting`, `OpenTelemetry.Exporter.OpenTelemetryProtocol`, and `OpenTelemetry.Instrumentation.AspNetCore`, then:
   ```csharp
   builder.Services.AddOpenTelemetry()
       .WithTracing(t => t.AddAspNetCoreInstrumentation()
                          .AddHttpClientInstrumentation()
                          .AddSource("Experimental.Microsoft.Extensions.AI*")
                          .AddSource("Assistant")
                          .AddOtlpExporter())
       .WithMetrics(m => m.AddAspNetCoreInstrumentation()
                          .AddMeter("Experimental.Microsoft.Extensions.AI*")
                          .AddOtlpExporter());
   ```
3. Open `http://localhost:18888` (the login token is printed in the container's output).

**Done when:** you see a trace for each `/ask` request in the dashboard.

### Day 3: Tracing model calls

**Learn (~15 min)**
- [OpenTelemetry semantic conventions for generative AI](https://github.com/open-telemetry/semantic-conventions-genai)

**Do:** add `.UseOpenTelemetry()` to your `ChatClientBuilder` and to the embedding generator. It records model calls using the generative AI conventions: model name, input and output tokens, and duration. Ask a question, then open its trace.

**Done when:** each model call appears in the trace with its token counts.

### Day 4: Your own spans

**Do:** add an `ActivitySource("Assistant")` and wrap your own steps in spans, such as `retrieve`, `rerank`, and `rewrite-question`, with tags for the retrieval mode, the number of hits, and the top score.

**Done when:** one trace shows the full path: request, rewrite, retrieve, rerank, model call, and response, with times for each.

### Day 5: Logs and metrics on AWS

**Do:** send the deployed API's traces and metrics to AWS. Either add the AWS Distro for OpenTelemetry collector as a sidecar container in the Fargate task, exporting to CloudWatch and X-Ray, or use the CloudWatch agent. Follow the AWS Distro for OpenTelemetry docs for ECS. Then create a CloudWatch dashboard with requests per minute, p95 answer time, tokens per hour, and the error rate.

**Done when:** after deploying and asking 10 questions, the dashboard shows real numbers.

### Day 6: Find a slow request

**Do:** make one step slow on purpose (add a 3-second `Task.Delay` in reranking), deploy it, and use only the traces to find which step is slow. Then remove it.

**Done when:** you found the slow step from the trace, without reading the code first. Write the steps in `RUNBOOK.md`.

### Day 7: Review and catch-up (light)

- **Clean up** AWS resources. Push, and add a screenshot of a full trace to the README.

---

## Week 41: Cost and performance

**By the end of the week:** a cheaper and faster assistant, using caching, model routing, and limits, with numbers to prove it.

### Day 1: Where the money and time go

**Do:** from your traces, work out the average tokens and time per question, broken down by step (rewrite, embeddings, rerank, and answer). Multiply by your Bedrock prices.

**Done when:** you know which step costs the most money, and which takes the most time.

### Day 2: Caching answers and embeddings

**Learn (~15 min)**
- AlgoMaster [System Design](https://algomaster.io/learn/system-design): the caching lessons

**Do:** add `.UseDistributedCache(...)` to the chat client and embedding generator pipelines (it's part of `Microsoft.Extensions.AI`), backed by an `IDistributedCache` (memory for now). Ask the same question twice and compare the times in the trace.

**Done when:** the second identical question is much faster and costs no tokens. Write down when caching answers would be wrong, for example when sources have changed.

### Day 3: Routing to cheaper models

**Do:** use a small cheap model for question rewriting and reranking scores, and the bigger model only for the final answer. Make each model a separate setting. Re-run your Week 12 evaluation.

**Done when:** the cost per question drops, and quality stays within a point or two. Record both.

### Day 4: Fewer tokens

**Do:** try three changes, measuring each on your evaluation:
1. Send 3 chunks instead of 5.
2. Cut each chunk to its 800 most relevant characters.
3. Shorten the system prompt.

**Done when:** you've kept the changes that save tokens without hurting scores.

### Day 5: Rate limits and quotas

**Learn (~15 min)**
- [Rate limiting middleware in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit)

**Do:** add a per-API-key token budget, for example 50,000 tokens a day, tracked in DynamoDB. When it's used up, return `429` with a clear message. Also find the Bedrock service quotas for your models in the **Service Quotas** console.

**Done when:** going over the budget gets a `429`, and you know your Bedrock limits.

### Day 6: Load test

**Do:** run a small load test against your local API with [k6](https://grafana.com/docs/k6/latest/), simulating 10 users for 2 minutes. Record the p50 and p95 response times and the error rate, then repeat with caching turned off.

**Done when:** you have before and after numbers in the README.

### Day 7: Review and catch-up (light)

- Push. Write a one-page "cost and performance" summary in the README, with your numbers.

---

## Week 42: Automated AI tests in CI

**By the end of the week:** your evaluation runs automatically, and a change that makes answers worse can't be merged.

### Day 1: What to run when

**Do:** decide on three test levels, and write them in the README:
- **Every push:** unit tests and retrieval scores on the JSON store, which needs no models (fast).
- **Every pull request:** the full evaluation on a small model.
- **Every release:** the full evaluation on the production model, plus the agent tests.

**Done when:** you can say why you wouldn't run the full evaluation on every push (it's slow and costs money).

### Day 2: Retrieval tests in CI

**Do:** commit a small fixed index (`tests/fixtures/index.json`) built from the plan, so CI can run retrieval tests without Ollama or AWS. Add a test that fails if hits@3 drops below the current value minus 5%.

**Done when:** CI runs the retrieval checks on every push.

### Day 3: The full evaluation on pull requests

**Do:** add a workflow that runs `tests/Assistant.Eval` on pull requests using a Bedrock model, through the OIDC role from Week 39 with permission for that one model only. Post the scores as a pull request comment with `actions/github-script`.

**Done when:** opening a pull request shows its evaluation scores in a comment.

### Day 4: Blocking regressions

**Do:** save the scores from `main` as `eval/baseline.json`. Make the pull request evaluation fail if faithfulness or hits@3 falls more than 5 points below the baseline. Make a deliberately bad change, such as breaking the citations prompt, and check that it's blocked.

**Done when:** a bad change is blocked automatically.

### Day 5: Tracking quality over time

**Do:** after each release evaluation, add a row to `eval/history.csv` with the date, version, model, and scores. Add a small chart to the README (Mermaid or an image) showing scores over versions.

**Done when:** you can see how quality changed across your last few versions.

### Day 6: Agent tests in CI

**Do:** run your Week 20 agent tests (which tools were called, what must not be called, and approval behavior) in the release workflow.

**Done when:** the release workflow fails if the agent calls `MarkDayDone` without approval.

### Day 7: Review and catch-up (light)

- Push. Tick the testing and monitoring topics on [roadmap.sh/mlops](https://roadmap.sh/mlops).

---

## Week 43: Reliability

**By the end of the week:** the assistant handles slow or failing services gracefully, and you've proven it by breaking things on purpose.

### Day 1: Failure modes

**Do:** list every dependency (Bedrock, S3 Vectors, DynamoDB, S3, and the MCP server). For each, write what happens to a user today if it's slow, if it fails, or if it's throttled.

**Done when:** you have a failure table, with the worst cases marked.

### Day 2: Timeouts and retries

**Learn (~15 min)**
- [Build resilient HTTP apps](https://learn.microsoft.com/en-us/dotnet/core/resilience/http-resilience) (Microsoft Learn)

**Do:** add `dotnet add package Microsoft.Extensions.Http.Resilience`, and use `AddStandardResilienceHandler()` on your `HttpClient`s (source fetching and the Python agent). Set explicit timeouts on AWS SDK clients (`Timeout` in the client config), and use the SDK's built-in retry mode `Standard`.

**Done when:** every outgoing call has a timeout, and retries happen with backoff. You can see them in your traces.

### Day 3: Fallbacks

**Do:** add fallbacks:
- If the main model fails or is throttled, retry once with the smaller model, and say so in the answer.
- If reranking fails, return the hybrid search order.
- If the vector store fails, fall back to BM25 over a local copy of the plan.

**Done when:** each fallback has been triggered by a test, and the user still gets an answer.

### Day 4: Circuit breakers

**Topic:** a circuit breaker stops calling a failing service for a while, so it doesn't slow every request.

**Do:** wrap the Bedrock reranker in a Polly circuit breaker (`ResiliencePipelineBuilder` with `AddCircuitBreaker`). After 5 failures in 30 seconds, skip reranking for 60 seconds.

**Done when:** a test shows reranking being skipped while the breaker is open.

### Day 5: Chaos drill

**Do:** with the assistant deployed to `test`, break one thing at a time and watch the dashboard and traces:
1. Remove the task role's `bedrock:InvokeModel` permission.
2. Point the vector store setting at an index that doesn't exist.
3. Set the reranker model ID to a model you don't have access to.

For each break, record what users saw, how you noticed, and how long it took to fix.

**Done when:** you have three incident notes in `RUNBOOK.md`.

### Day 6: Alerts that matter

**Do:** create CloudWatch alarms for:
- 5xx errors over 5% for 5 minutes
- p95 answer time over 15 seconds
- tokens per hour over twice your normal level

Send them to email through SNS.

**Done when:** each alarm has been triggered once on purpose, and you received the email.

### Day 7: Review and catch-up (light)

- **Clean up** AWS. Push the updated `RUNBOOK.md`.

---

## Week 44: Linux and troubleshooting skills

**By the end of the week:** you're comfortable on a Linux command line, which is what you'll use inside containers, on servers, and in customer environments.

**Setup:** you need a normal Linux distribution in WSL, not `docker-desktop`. In PowerShell, run `wsl --install -d Ubuntu`, then open Ubuntu from the Start menu and create your Linux user.

**Learn (for the whole week)**
- [Install WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
- [The Linux command line](https://linuxcommand.org/lc3_learning_the_shell.php) (LinuxCommand.org, free)

### Day 1: Moving around and files

**Do:** in Ubuntu, practice `pwd`, `ls -la`, `cd`, `mkdir -p`, `cp`, `mv`, `rm`, `cat`, `less`, `head`, `tail -f`, `find . -name "*.md"`, and `grep -rn "Week 44" .`. Clone your `CurriculumAssistant` repository inside your Linux home (`~/code`), not under `/mnt/c`.

**Done when:** you can find every file mentioning "Bedrock" in your repository, from the command line.

### Day 2: Permissions, users, and packages

**Do:** practice `chmod`, `chown`, `sudo`, `whoami`, and `id`. Install the .NET 10 SDK with `apt` (following Microsoft's Ubuntu install page). Build and run `CurriculumAssistant` on Linux.

**Done when:** `dotnet test` passes on Linux.

### Day 3: Processes, ports, and services

**Do:** start the API and practice `ps aux | grep dotnet`, `top` or `htop`, `kill`, `ss -tlnp` (which ports are listening), `curl -v http://localhost:5000/health`, and `env`.

**Done when:** you can find which process is using a port, and stop it.

### Day 4: Networking troubleshooting

**Do:** practice `dig learn.microsoft.com`, `curl -I https://...`, `curl -v` to see TLS and headers, `nc -zv host port`, and `traceroute`. Then explain each failure you saw in Week 31's troubleshooting drill with these tools.

**Done when:** you can tell a DNS failure, a refused connection, and a timeout apart from the command output.

### Day 5: Inside containers

**Do:** run `docker exec -it <container> /bin/sh` into your API container. Look at the environment variables, the files, and the running process, and check whether it can reach Qdrant (`wget -qO- http://qdrant:6333`). Then read its logs with `docker logs --since 10m`.

**Done when:** you can debug a container that starts but doesn't work, from inside it.

### Day 6: Shell scripts

**Do:** port your Week 25 `cleanup-check.ps1` to a bash script, `cleanup-check.sh`, with `set -euo pipefail`, a function, an `if`, and a loop over the tagged resources. Make it executable and run it.

**Done when:** the bash script gives the same result as the PowerShell one.

### Day 7: Review and catch-up (light)

- Push the script. Section H is complete. Tick the topics on [roadmap.sh/linux](https://roadmap.sh/linux) and [roadmap.sh/devops](https://roadmap.sh/devops).
