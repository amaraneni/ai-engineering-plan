# Section J: Capstone (Weeks 51–52)

Two weeks to finish the **Curriculum Assistant 1.0**: the chatbot you started in Week 1 that knows your plan, its sources, and your progress, answers questions about them, and compares your plan with outside roadmaps and current docs. Nothing new to learn. This is about finishing, polishing, and showing it.

**What 1.0 must do** (each item was built earlier; the week is in brackets):
- answer questions about the plan and its sources, with citations and source age (Weeks 4, 9–13)
- search with hybrid search and reranking, with quality measured on 30+ questions (Weeks 11–12)
- run as an agent with tools, memory, and approval for changes (Weeks 15–17)
- compare the plan with roadmap.sh and report changed or broken sources (Weeks 13, 18)
- work as an MCP server from your editor, locally and remotely (Weeks 22–24, 37)
- run on AWS with Bedrock, S3 Vectors, and DynamoDB, from CDK (Weeks 33–35)
- have CI/CD, tracing, evaluation in CI, guardrails, and alarms (Weeks 38–43)

**Review resources:** AlgoMaster's [System Design](https://algomaster.io/learn/system-design) and the [System Design roadmap](https://roadmap.sh/system-design), for checking your final architecture.

---

## Week 51: Finish and harden

**By the end of the week:** every 1.0 feature works on AWS, and nothing on the list above is half-done.

### Day 1: Gap check

**Do:** go through the 1.0 list. For each item, run it on the deployed version and mark it **works**, **partly works**, or **missing**. Then pick the fixes for this week, most important first. Use the assistant itself: ask it "What did I skip in this plan?", using your progress data.

**Done when:** you have a short, ordered list of fixes for Days 2–5.

### Day 2: Fix the gaps (part 1)

**Do:** work through your fix list. Run the tests and the evaluation after each fix.

**Done when:** the top half of your list is fixed.

### Day 3: Fix the gaps (part 2)

**Do:** finish the list. Anything you can't finish goes into a "known limitations" section of the README, with a reason.

**Done when:** every item on the 1.0 list works or is listed as a known limitation.

### Day 4: Final evaluation

**Do:** grow your test set to 50 questions, including 10 about sources and 5 compare requests. Run the full evaluation on the deployed version, and record the final scores in `eval/history.csv` and the README.

**Done when:** you have the final scores, and they're no worse than your best earlier run.

### Day 5: Architecture review

**Do:** compare your final design with the AlgoMaster system design lessons on caching, rate limiting, and reliability, and with the [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) pillars. Write a short "what I'd change at 100 times the users" section.

**Done when:** you can defend each major choice, and you've written down what you'd change at scale.

### Day 6: Clean install test

**Do:** on a clean folder (or in WSL Ubuntu), follow only your README: clone, set up, run locally, and deploy to AWS. Fix any step that was missing or wrong.

**Done when:** someone else could get it running from the README alone.

### Day 7: Review and catch-up (light)

- Push, and tag the release `v1.0.0-rc1`.

---

## Week 52: Release, demo, and look back

**By the end of the week:** version 1.0 released, demoed, and written up, plus a plan for what comes next.

### Day 1: Release 1.0

**Do:** publish GitHub release `v1.0.0`. Let the Week 39 pipeline deploy it, with the Week 42 evaluation gate. Check `/health` and ask five questions on the deployed version.

**Done when:** 1.0 is live, deployed by the pipeline, not by hand.

### Day 2: Polish the README

**Do:** make the README a portfolio page: a one-paragraph summary, a screenshot of the chat page, the architecture diagram, the features list, the evaluation scores, the cost per month, how to run it, and links to the security, runbook, and design documents.

**Done when:** someone could understand the project in two minutes from the README.

### Day 3: Record the demo

**Do:** record a 5–8 minute demo, using what you practiced in Week 48:
1. Asking about the plan, with citations
2. A follow-up question, and memory
3. "Compare my plan with the AI Engineer roadmap"
4. "Which sources changed?"
5. Using it as an MCP server from your editor
6. The traces and the evaluation scores

**Done when:** the video is linked from the README.

### Day 4: Write it up

**Do:** write a blog post or long LinkedIn post: what you built over the year, the hardest problem and how you solved it, what surprised you about RAG, agents, and MCP, and what you'd do differently. Link the repository and the demo.

**Done when:** it's published, or saved as a draft ready to post.

### Day 5: Look back at your progress

**Do**
1. Open each [roadmap.sh](https://roadmap.sh/ai-engineer) roadmap from [resources.md](../resources.md) and check off everything you've done.
2. Ask the Curriculum Assistant: "Compare my progress with the AI Engineer and AI Agents roadmaps. What are my biggest gaps?"
3. Re-read your Week 45 skills map, and update it.

**Done when:** you have an honest list of what you're strong at, and your top three gaps.

### Day 6: Plan the next quarter

**Do:** write a 12-week plan for your top gaps, in the same week-by-week format as this plan. Options could include an AWS certification exam (with the Udemy courses in [resources.md](../resources.md)), fine-tuning small models, multimodal RAG with images and PDFs, Kubernetes, or contributing to an open-source MCP or agent project. Add the new plan to the assistant's index, so it can help you with it.

**Done when:** next quarter's plan exists, and the assistant can answer questions about it.

### Day 7: Shut down and celebrate

- **Clean up:** destroy the AWS stacks you don't need running, and check that Cost Explorer shows nothing unexpected. Keep the code, the recordings, and the write-ups.
- You've finished the plan.
