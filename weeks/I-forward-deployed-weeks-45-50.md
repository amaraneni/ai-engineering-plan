# Section I: Forward deployed engineering (Weeks 45–50)

A **forward deployed engineer** (FDE) works inside a customer's environment to get an AI system working on the customer's real data and systems. The work runs from the first conversation through to production and handover. It's part engineer, part consultant: you scope the problem, build and integrate, deploy into an account you don't control, explain trade-offs, fix things on the spot, and leave something the customer can run.

These weeks practice that with a **made-up customer**, so every exercise has a realistic brief.

**The customer for this section:** *Northwind Logistics*, a 400-person company. Their support team answers the same internal questions all day: how to book freight, which forms to use, and what the refund policy is. They have about 200 policy documents (Markdown and PDF) in a shared drive, a ticketing system with an API, and an AWS account their IT team owns. They want "a chatbot that answers staff questions from our policies". You'll adapt your Curriculum Assistant for them, since it's already a RAG agent with tools, MCP, evaluation, and an AWS deployment.

**Courses for this section (optional, see [resources.md](../resources.md)):** [What is a forward deployed engineer?](https://hatchworks.com/blog/fde/forward-deployed-engineer/) for the role, LinkedIn Learning's [technical consulting courses](https://www.linkedin.com/learning/search?keywords=technical%20consulting%20skills) for Weeks 45 and 48, and the [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) for Weeks 46–47.

---

## Week 45: The role, and scoping the work

**By the end of the week:** a scoping document for Northwind that a real customer would sign off: the problem, success measures, data, risks, and a plan.

### Day 1: What the role is

**Learn (~25 min)**
- [What is a forward deployed engineer?](https://hatchworks.com/blog/fde/forward-deployed-engineer/) (HatchWorks)
- Search any job site for "Forward Deployed Engineer AI", and read three current job posts from different companies.

**Do:** from the job posts, list the ten skills that appear most often. Next to each, write the weeks of this plan where you practiced it, or "gap".

**Done when:** you have a skills map, and you know which gaps the next six weeks need to cover.

### Day 2: Discovery questions

**Do:** write the questions you'd ask Northwind in a first one-hour meeting, grouped as:
- **Problem:** who asks the questions, how many a day, and what a wrong answer costs
- **Success:** how they'll judge it, for example the percentage of questions answered correctly, or time saved
- **Data:** where the documents are, how often they change, who owns them, and whether any are confidential
- **Systems:** single sign-on, the ticketing system, and AWS account rules
- **Constraints:** budget, deadline, data location, and security review

**Done when:** you have about 25 questions, with the five most important marked.

### Day 3: A practice discovery call

**Do:** play the meeting with an AI model taking the customer's role. Give your local model this system prompt: "You are Dana, head of support at Northwind Logistics (details: ...). Answer as a busy, slightly sceptical customer. Don't volunteer information unless asked." Ask your Day 2 questions, and take notes as you would in a real call.

**Done when:** you have call notes, and you've written down two facts that changed your assumptions.

### Day 4: Success measures

**Do:** turn "a chatbot that answers staff questions" into measurable targets, for example:
- 85% of answers on a 50-question test set are correct and cite the right policy.
- "I don't know" is the answer for questions outside the policies, at least 90% of the time.
- p95 answer time is under 8 seconds.
- Cost is under $X a month at 2,000 questions a day.

Use your Week 12 evaluation and Week 41 cost numbers to make the targets realistic.

**Done when:** every target is a number you can measure with tools you've already built.

### Day 5: Risks and options

**Do:** write the risks (out-of-date policies, confidential documents, staff trusting wrong answers, prompt injection through documents, and cost overruns), each with a mitigation. Then write two solution options, as in Week 34: your own RAG versus a Bedrock Knowledge Base, with cost, effort, control, and risk for each.

**Done when:** you have a risk table and an options table, with your recommendation.

### Day 6: The scoping document

**Do:** write `northwind/SCOPE.md` (no more than three pages):
1. The problem, in Northwind's words
2. The success measures
3. What's in scope and what's out (for example, no ticket creation in phase 1)
4. The data and access you need from them
5. The recommended option, and why
6. A four-week plan with a demo at the end of each week
7. The risks and their mitigations

**Done when:** a non-technical manager could read it in ten minutes and say yes or no.

### Day 7: Review and catch-up (light)

- Ask your local model, playing Dana, to review `SCOPE.md` and raise objections. Answer each objection in the document.

---

## Week 46: Connecting to customer data and systems

**By the end of the week:** the assistant indexes Northwind's documents with access rules, and calls their ticketing system through an MCP server.

**Setup:** create the made-up customer data. Ask your local model to write 30 short policy documents for Northwind (freight booking, refunds, travel, IT access, and so on), and save them to `northwind/data/policies/`. Mark three as `confidential: true` in a front-matter line at the top.

### Day 1: A new tenant in the assistant

**Do:** add a `TenantId` to `KnowledgeChunk` and to every store query, so Northwind's documents never mix with your plan. Index the 30 policies under `tenant=northwind`.

**Done when:** a question in the Northwind tenant can't return any plan chunks, and a test proves it.

### Day 2: Access rules on documents

**Do:** store a `Confidential` flag on each chunk, read from the front matter. Add a `UserRole` (staff or manager) to each request, and filter out confidential chunks for staff.

**Done when:** a staff user asking about a confidential policy gets "I can't help with that", while a manager gets the answer. Add a test for both.

### Day 3: A fake ticketing system

**Do:** create a small minimal API, `northwind/TicketApi`, with:
- `GET /tickets?status=open`
- `GET /tickets/{id}`
- `POST /tickets`, which creates a ticket with a title and description

Store tickets in memory, with an API key header for authentication. This stands in for the customer's real system, such as Jira or ServiceNow.

**Done when:** you can create and list tickets with `Invoke-RestMethod`.

### Day 4: An MCP server for their system

**Do:** build `northwind/TicketMcp`, an MCP server as in Week 22, with tools `list_open_tickets`, `get_ticket(id)`, and `create_ticket(title, description)`. It calls the Ticket API with its key, taken from an environment variable. Mark `create_ticket` clearly in its description as changing data.

**Done when:** the tools work in the MCP Inspector.

### Day 5: The agent uses both

**Do:** give the Northwind agent your RAG tools (Northwind tenant only) plus `TicketMcp`. Put `create_ticket` behind approval, as in Week 17. Ask: "A customer says their refund is late. What's our policy, and can you open a ticket?"

**Done when:** the answer cites the refund policy, and a ticket is created only after you approve it.

### Day 6: Data handling notes

**Do:** write `northwind/DATA.md`, covering what data is copied where (S3, the vector store, and logs), how long it's kept, who can see it, how a document is removed everywhere when Northwind deletes it (use your Week 13 `index prune`), and what's sent to the model provider.

**Done when:** you could hand this to Northwind's security team.

### Day 7: Review and catch-up (light)

- Push the `northwind` folder, with fake data only.

---

## Week 47: Deploying into the customer's AWS account

**By the end of the week:** the whole system deployed into a **separate AWS account** that stands in for Northwind's, using only the access a customer would give you.

**Cost warning:** this uses a second AWS account. Set a $10 budget alert on it on Day 1, and destroy everything at the end of each day.

### Day 1: A separate "customer" account

**Learn (~20 min)**
- [What is AWS Organizations?](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_introduction.html)

**Do:** create an AWS Organization from your account, and add a new member account named `northwind-sandbox`. Set a $10 budget with alerts in it. In IAM Identity Center, give your user access to it with a **limited** permission set that you'll define on Day 2, not admin.

**Done when:** you can sign in to `northwind-sandbox` through the portal.

### Day 2: Working with limited access

**Do:** write the permission set a cautious customer would give you: CloudFormation, ECS, ECR, S3, DynamoDB, the Bedrock models they approved, CloudWatch, and Secrets Manager. No IAM user creation, and no access to anything not tagged `project=northwind-assistant`. Attach it, then try to deploy your CDK stacks.

**Done when:** you've hit at least one permission error, worked out exactly which permission was missing, and written it in a "permissions we need" list for the customer.

### Day 3: Their rules, not yours

**Do:** customers have their own rules. Pretend Northwind requires:
- every resource tagged `cost-center=support`
- data kept only in `us-east-1`
- no public load balancer, so it's reachable only through their VPN (simulate this by allowing only your own IP in the load balancer's security group)

Change your CDK app so these come from settings for each customer, not code changes.

**Done when:** you deploy to `northwind-sandbox` following all three rules, and your own account deployment is unchanged.

### Day 4: Deploy and smoke test

**Do:** deploy `DataStack`, `ApiStack`, and the `TicketMcp` service to `northwind-sandbox`. Upload the policies, run indexing, and run the Northwind evaluation (50 questions you write from the policies, in the same format as Week 12).

**Done when:** the system runs in the customer account, and you have its evaluation scores against the Week 45 targets.

### Day 5: The deployment guide

**Do:** write `northwind/DEPLOY.md` for Northwind's IT team: the prerequisites, the permissions needed, the settings (tags, region, allowed IPs, and model IDs), the exact commands to deploy, how to check it worked, how to update, how to roll back, and how to remove it all.

**Done when:** following the guide from a clean state works. Destroy everything and redeploy from the guide alone.

### Day 6: Handing over pipelines

**Do:** add a GitHub Actions deployment for the customer account, using an OIDC role created in `northwind-sandbox` (as in Week 39), so their own pipeline can deploy future versions without you.

**Done when:** a release deploys to the customer account from GitHub.

### Day 7: Review and catch-up (light)

- **Clean up:** destroy everything in `northwind-sandbox`. Keep the account and its budget alert for Weeks 49–50.

---

## Week 48: Demos and explaining trade-offs

**By the end of the week:** a polished demo, a short recorded walkthrough, and practice explaining technical choices to non-technical people.

### Day 1: Planning a demo

**Do:** write a ten-minute demo script for Northwind's head of support:
1. The problem, in their words (1 minute)
2. Three real questions answered with citations (3 minutes)
3. One "I don't know" answer, to show it doesn't make things up (1 minute)
4. A ticket created with approval (2 minutes)
5. The evaluation scores against the targets (2 minutes)
6. Next steps (1 minute)

**Done when:** you have the script, with the exact questions you'll ask.

### Day 2: Make the demo reliable

**Do:** demos fail at the worst moment. Prepare for it:
- run every demo question ten times, and replace any that fail
- add a `/demo/reset` endpoint that restores the demo data
- record a backup video of the demo working, in case the live version breaks

**Done when:** the demo works ten times in a row, and the backup video exists.

### Day 3: Explaining trade-offs

**Do:** write a short, plain-language answer, with no jargon, to each question a customer always asks:
- "Why does it sometimes say it doesn't know?"
- "Why does it cost money each time someone asks a question?"
- "Can it learn from our tickets?"
- "Is our data used to train the model?"
- "Why not just use ChatGPT?"

Use your Week 33 and 38 notes on how Bedrock handles data, and check the current Bedrock data-privacy docs before writing the training answer.

**Done when:** each answer is three or four sentences that a support manager would understand.

### Day 4: Handling hard questions

**Do:** practice with your local model playing a sceptical CTO: "You are Northwind's CTO. You're worried about cost, security, and whether this will be abandoned. Ask hard questions one at a time." Answer five questions, then ask the model to grade your answers.

**Done when:** you've answered five hard questions, and improved the two weakest answers.

### Day 5: The weekly status update

**Do:** write the kind of status update a forward deployed engineer sends every Friday: what was done, the current scores against the targets, the risks or blockers (with what you need from the customer), and next week's plan. Keep it under 200 words.

**Done when:** a manager could read it in a minute and know where things stand.

### Day 6: Record the walkthrough

**Do:** record a five-minute screen recording of the demo, with you narrating. This works as a portfolio piece too.

**Done when:** the video is saved and linked from the `northwind` README.

### Day 7: Review and catch-up (light)

- Watch your recording, and write down three things to do better next time.

---

## Week 49: Debugging in the field

**By the end of the week:** practice handling a live incident in the customer's system: find the cause fast, fix it safely, communicate clearly, and write it up.

**Setup:** redeploy to `northwind-sandbox` from your `DEPLOY.md`. Destroy it at the end of each day.

### Day 1: How to run an incident

**Learn (~20 min)**
- Re-read your `RUNBOOK.md` from Weeks 39–43.

**Do:** write an incident checklist: confirm the problem, check the scope (who's affected), stop the damage (roll back, or switch off the feature), find the cause, fix it, tell people at each stage, and write it up afterwards.

**Done when:** your checklist fits on one page.

### Day 2: Incident 1, "It's giving wrong answers"

**Do:** set this up yourself without looking at the details later. Change one policy document to say the opposite of the others ("refunds take 90 days"), re-index, then a day later treat it as a report from a user. Use traces and citations to find which document caused it.

**Done when:** you've found the bad document from the evidence, and written a one-paragraph incident summary.

### Day 3: Incident 2, "It's very slow"

**Do:** lower the Fargate task to 0.25 vCPU and turn on reranking for 20 results. Use the CloudWatch dashboard and traces to find the cause, then fix it.

**Done when:** you've found both causes, and p95 is back under target.

### Day 4: Incident 3, "It stopped working this morning"

**Do:** expire or rotate the Ticket API key without updating Secrets Manager, so ticket creation fails. Find it from the logs, fix it, and work out how to catch it earlier, for example with a health check that calls the Ticket API.

**Done when:** it's fixed, and the new health check would have caught it.

### Day 5: Communicating during an incident

**Do:** for Incident 3, write the three messages you'd send: the first notice ("We know about it and we're looking into it"), an update with the cause and expected fix time, and the "resolved" message with next steps. Keep each under 80 words.

**Done when:** the messages are clear, calm, and don't blame anyone.

### Day 6: The post-incident review

**Do:** write `northwind/incidents/2-slow-answers.md`, covering the timeline, the impact, the cause, how you found it, the fix, and three actions to stop it happening again (each with an owner and a date). Keep it blameless: it's about the system, not the person.

**Done when:** the review is written, and at least one action is already done, such as a new alarm.

### Day 7: Review and catch-up (light)

- **Clean up** `northwind-sandbox`. Add the incident checklist to `RUNBOOK.md`.

---

## Week 50: Handover

**By the end of the week:** everything Northwind needs to run the system without you: documentation, runbooks, training, and a final review.

### Day 1: The architecture document

**Do:** write `northwind/ARCHITECTURE.md` with a diagram, each component and why it was chosen, the data flows, the security controls, the costs at current usage, and the limits you know about.

**Done when:** a new engineer could understand the system in 20 minutes.

### Day 2: The operations runbook

**Do:** turn your notes into `northwind/RUNBOOK.md`, for the people who'll run it:
- daily and weekly checks
- how to add, update, or remove a policy document
- how to rotate each secret
- each alarm: what it means, and what to do
- the incident checklist from Week 49
- who to contact

**Done when:** each alarm in CloudWatch has a matching runbook entry.

### Day 3: Training the support team

**Do:** write a one-page user guide for Northwind's support staff: what to ask, what it can't do, how to read citations, what to do when it says "I don't know", and how to report a wrong answer.

**Done when:** it's one page, with no technical terms.

### Day 4: Keeping quality up after you leave

**Do:** set up what keeps it working: the monthly evaluation run in GitHub Actions (from Week 42) against the Northwind test set, the source-freshness report (from Week 13) run weekly, and a simple "report a wrong answer" button in the chat page that saves the question for the next evaluation.

**Done when:** the evaluation and freshness jobs are scheduled, and the feedback button works.

### Day 5: The final review

**Do:** write `northwind/FINAL-REVIEW.md`, covering each Week 45 target with its final number, what went well, what didn't, open risks, and recommended next steps (phase 2).

**Done when:** every target has a measured result next to it.

### Day 6: Your portfolio case study

**Do:** turn the Northwind work into a one-page case study for your portfolio: the problem, your approach, the architecture, the results, and what you learned. Link the demo video and the repository. Say clearly that the customer is made up.

**Done when:** the case study is in your `CurriculumAssistant` README or on your GitHub profile.

### Day 7: Review and catch-up (light)

- **Clean up:** destroy everything in `northwind-sandbox`. You can close the account, or keep it with a $0 budget alert.
- Section I is complete.
