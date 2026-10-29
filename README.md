# AI Engineering Plan

A 52-week curriculum for learning how to build real AI systems with .NET, Python, retrieval-augmented generation (RAG), agents, MCP, and AWS.

This repository is a structured study plan that takes you from local LLMs and C# chat apps through advanced topics like semantic search, tool calling, multi-agent systems, MCP servers, and cloud deployment.

## What this repo contains

- `plan.md` — the main curriculum overview, goals, and Week 1 in full
- `schedule.md` — the date-based checklist in Markdown
- `schedule.html` — browser-friendly schedule with clickable progress tracking
- `resources.md` — courses, docs, roadmaps, and week-to-resource mapping
- `plan.html` — generated HTML version of the main plan
- `resources.html` — generated HTML version of the resource guide
- `weeks/` — lesson files organized by section and week
- `tools/` — scripts to generate schedules and validate links

## Curriculum summary

The plan is organized into major sections:

- A. AI foundations in .NET (Weeks 1–4)
- B. Python for AI (Weeks 5–8)
- C. RAG in depth (Weeks 9–14)
- D. Agents (Weeks 15–20)
- E. MCP (Weeks 21–24)
- F. AWS foundations with .NET (Weeks 25–32)
- G. AI on AWS (Weeks 33–38)
- H. Production and DevOps (Weeks 39–44)
- I. Forward deployed engineering (Weeks 45–50)
- J. Capstone (Weeks 51–52)

The long-term project is a growing "Curriculum Assistant" chatbot that starts as a simple prompt-based app and evolves into a production-style AI system using RAG, agents, MCP, and AWS services.

## Start here

1. Open `schedule.html` in a browser for the daily checklist.
2. Read `plan.md` for the overall goals and the detailed Week 1 walkthrough.
3. Use `weeks/` for the rest of the curriculum by section.
4. Use `resources.md` for supporting courses, docs, and roadmap links.

## Repository structure

```text
.
├── README.md
├── plan.md
├── plan.html
├── resources.md
├── resources.html
├── schedule.md
├── schedule.html
├── weeks/
│   ├── A-ai-foundations-weeks-02-04.md
│   ├── B-python-weeks-05-08.md
│   ├── C-rag-weeks-09-14.md
│   ├── D-agents-weeks-15-20.md
│   ├── E-mcp-weeks-21-24.md
│   ├── F-aws-foundations-weeks-25-32.md
│   ├── G-ai-on-aws-weeks-33-38.md
│   ├── H-production-weeks-39-44.md
│   ├── I-forward-deployed-weeks-45-50.md
│   └── J-capstone-weeks-51-52.md
├── tools/
│   ├── build-html.mjs
│   ├── build-schedule.mjs
│   ├── check-links.mjs
│   └── link-report.json
└── .gitignore
```

## Useful commands

```bash
# Rebuild the static HTML pages
node tools/build-html.mjs

# Rebuild the date-based schedule from a start date
node tools/build-schedule.mjs 2026-10-28

# Re-check all links in the plan
node tools/check-links.mjs
```

## Purpose

This project is designed as a self-paced AI engineering roadmap for developers who want practical experience building AI-powered applications, not just theory. The plan emphasizes:

- local-first AI experimentation
- .NET and Python both being used in real workflows
- retrieval-augmented generation over your own knowledge base
- tool-using agents and MCP integration
- AWS deployment and production patterns
- portfolio-building projects and real-world evaluation

## License and ownership

This repository is a learning and planning resource. It is intended for personal study and project-based exploration.

## Notes

- The schedule starts on Wednesday, October 28, 2026, and runs through Tuesday, October 26, 2027.
- Daily lessons include a learning goal, hands-on task, and a "done when" condition.
- Day 7 of each week is a light catch-up and review day.

