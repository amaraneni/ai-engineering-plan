# Section B: Python for AI (Weeks 5–8)

You already know how to program, so these weeks map Python onto what you know from C#. Each day has a "C# equivalent" note. All of it runs on plain Windows.

**Setup once:** install uv, which handles both Python versions and packages (like `dotnet` plus NuGet):
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```
Close and reopen the terminal, then run `uv --version`. In VS Code, install the **Python** extension from Microsoft.

**Videos for the whole block (pick one):** "Python for Everybody" (Coursera, University of Michigan), or any LinkedIn Learning "Python Essential Training" course. Watch only the parts matching each day's topic.

---

## Week 5: Python for C# developers

**By the end of the week:** you can write, run, and structure small Python programs, and you know the main differences from C#.

### Day 1: Install, run, and the REPL

**Topic:** uv creates projects and virtual environments. A virtual environment is a per-project folder of packages, like a project's NuGet packages.

**Learn (~15 min)**
- [uv: Getting started](https://docs.astral.sh/uv/getting-started/)
- [The Python Tutorial](https://docs.python.org/3/tutorial/): sections 1–3, skimmed

**Do**
1. Create a project and run it:
   ```powershell
   uv init py-basics
   cd py-basics
   uv run main.py
   ```
2. Open `main.py` in VS Code. Notice there's no class and no `Main`. The file just runs from top to bottom.
3. Start the interactive shell with `uv run python` and try `2 ** 10`, `"abc".upper()`, `len("hello")`, and `help(str.split)`. Quit with `exit()`.

**Done when:** `uv run main.py` prints its greeting, and you've used the REPL.

**C# equivalent:** `uv init` ≈ `dotnet new console`, `uv run` ≈ `dotnet run`, and the REPL ≈ C# Interactive.

### Day 2: Types, collections, and comprehensions

**Topic:** Python's lists, dicts, sets, and tuples replace `List`, `Dictionary`, `HashSet`, and tuples. Comprehensions do much of what LINQ does.

**Learn (~20 min)**
- [Data Structures](https://docs.python.org/3/tutorial/datastructures.html) (Python tutorial, section 5)

**Do:** in `main.py`, write each of these, run it, and check the output:
```python
words = ["rag", "mcp", "aws", "agent", "llm", "rag"]

upper = [w.upper() for w in words]                 # Select
long_words = [w for w in words if len(w) > 3]       # Where
unique = set(words)                                 # Distinct
counts = {w: words.count(w) for w in unique}        # ToDictionary
first_r = next((w for w in words if w.startswith("r")), None)  # FirstOrDefault
by_length = sorted(words, key=len, reverse=True)    # OrderByDescending

print(upper, long_words, unique, counts, first_r, by_length, sep="\n")

point = (3, 4)          # tuple: fixed size, can't be changed
x, y = point            # unpacking, like a C# deconstruction
print(f"x={x}, y={y}")  # f-string = C# $"..."
```

**Done when:** you can write each LINQ method you use daily as a comprehension or built-in.

### Day 3: Functions, type hints, and dataclasses

**Topic:** Python is dynamically typed, but type hints plus a checker give you much of C#'s safety. A `dataclass` is roughly a C# `record`.

**Learn (~15 min)**
- [dataclasses](https://docs.python.org/3/library/dataclasses.html): the first example only

**Do**
1. Create `models.py`:
   ```python
   from dataclasses import dataclass

   @dataclass(frozen=True)          # frozen = immutable, like a record
   class Lesson:
       week: int
       day: int
       title: str
       minutes: int = 75             # default value

   def total_minutes(lessons: list[Lesson]) -> int:
       return sum(l.minutes for l in lessons)

   def find(lessons: list[Lesson], week: int) -> list[Lesson]:
       return [l for l in lessons if l.week == week]
   ```
2. Use it from `main.py` with `from models import Lesson, total_minutes, find`, creating a few lessons.
3. Add a deliberate type error, `total_minutes("oops")`, then run the type checker:
   ```powershell
   uv add --dev mypy
   uv run mypy .
   ```

**Done when:** mypy reports your type error, and you've fixed it.

**C# equivalent:** `def f(x: int) -> str` ≈ `string F(int x)`, and the `@dataclass(frozen=True)` class ≈ `record Lesson(int Week, ...)`.

### Day 4: Classes, interfaces, and exceptions

**Topic:** Python classes have explicit `self`. A `Protocol` acts like an interface (matched by shape, not declared). Exceptions work as in C#, with `try`/`except`.

**Do:** create `stores.py`:
```python
from typing import Protocol

class ProgressStore(Protocol):          # like an interface
    def mark_done(self, lesson_id: str) -> None: ...
    def is_done(self, lesson_id: str) -> bool: ...

class MemoryStore:                      # doesn't need to say it implements ProgressStore
    def __init__(self) -> None:         # constructor
        self._done: set[str] = set()    # leading _ means "private" by convention

    def mark_done(self, lesson_id: str) -> None:
        if not lesson_id:
            raise ValueError("lesson_id is required")
        self._done.add(lesson_id)

    def is_done(self, lesson_id: str) -> bool:
        return lesson_id in self._done

def report(store: ProgressStore, ids: list[str]) -> None:
    for i in ids:
        print(i, "done" if store.is_done(i) else "todo")

store = MemoryStore()
store.mark_done("W5D4")
report(store, ["W5D3", "W5D4"])
try:
    store.mark_done("")
except ValueError as e:
    print("Error:", e)
```
Run `uv run stores.py`, then `uv run mypy stores.py`.

**Done when:** it prints the report and the error, and mypy is happy.

### Day 5: Modules, packages, and project layout

**Topic:** a file is a module and a folder of modules is a package. `if __name__ == "__main__":` marks the "only when run directly" code.

**Learn (~15 min)**
- [Modules](https://docs.python.org/3/tutorial/modules.html) (Python tutorial, section 6)

**Do**
1. Reorganize `py-basics` into:
   ```text
   py-basics/
     learning/
       __init__.py      (empty)
       models.py
       stores.py
     main.py
   ```
2. Update the imports (`from learning.models import Lesson`) and move the demo code in `stores.py` under `if __name__ == "__main__":`.
3. Add a package with `uv add rich`, then print a colored table:
   ```python
   from rich.console import Console
   from rich.table import Table

   table = Table("Week", "Day", "Title")
   table.add_row("5", "5", "Modules and packages")
   Console().print(table)
   ```
4. Open `pyproject.toml` (the Python version of a `.csproj`) and `uv.lock`, and find `rich` in both.

**Done when:** `uv run main.py` prints the table, and importing `stores` no longer runs its demo.

### Day 6: Mini project, plan statistics CLI

**Do:** write `plan_stats.py`, a command-line tool that reads `plan.md` and the `weeks` files, then prints:
- the number of weeks and days found (count lines starting with `## Week ` and `### Day `)
- the 10 most common words longer than 4 letters (use `collections.Counter`)
- every link in the plan (use `re.findall(r"\((https?://[^)]+)\)", text)`)

Use `argparse` so it can be run as `uv run plan_stats.py ..\ai-engineering-plan`, and use `pathlib.Path` for files: `Path(folder).glob("**/*.md")`.

**Done when:** it prints all three reports for your plan folder.

### Day 7: Review and catch-up (light)

- Push `py-basics` to `ai-learning/week-05`.
- Write a "Python vs C#" cheat sheet in the README with the 15 differences that surprised you most.

---

## Week 6: Files, HTTP, async, and tests

**By the end of the week:** you can build a real Python tool. You'll build an async link checker for the plan, which the Curriculum Assistant reuses later.

### Day 1: Files and JSON

**Do**
1. Create `uv init py-tools` and add a `io_demo.py` script that:
   - reads `plan.md` with `Path("...").read_text(encoding="utf-8")`
   - writes a summary dict to `summary.json` using `json.dumps(data, indent=2)`
   - reads it back with `json.loads` and prints one field
2. Use `with open(path, "w", encoding="utf-8") as f:` once. It's like C#'s `using`.

**Done when:** `summary.json` exists and reads back correctly.

### Day 2: HTTP with httpx

**Topic:** `httpx` is a modern HTTP client, the Python equivalent of `HttpClient`.

**Learn (~10 min)**
- [httpx QuickStart](https://www.python-httpx.org/quickstart/)

**Do:** run `uv add httpx`, then write `http_demo.py`:
```python
import httpx

r = httpx.get("https://api.github.com/repos/dotnet/runtime", timeout=10)
r.raise_for_status()                      # like EnsureSuccessStatusCode()
repo = r.json()
print(repo["full_name"], repo["stargazers_count"])
```

**Done when:** it prints the repository name and star count.

### Day 3: async and await

**Topic:** Python's `async`/`await` looks like C#'s, but you start it with `asyncio.run`, and `asyncio.gather` is `Task.WhenAll`.

**Learn (~20 min)**
- [Coroutines and Tasks](https://docs.python.org/3/library/asyncio-task.html): the first sections

**Do**
```python
import asyncio, time
import httpx

URLS = ["https://learn.microsoft.com", "https://docs.python.org", "https://docs.aws.amazon.com"]

async def status(client: httpx.AsyncClient, url: str) -> tuple[str, int]:
    r = await client.get(url, follow_redirects=True, timeout=15)
    return url, r.status_code

async def main() -> None:
    start = time.perf_counter()
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*(status(client, u) for u in URLS))   # Task.WhenAll
    for url, code in results:
        print(code, url)
    print(f"{time.perf_counter() - start:.2f}s")

asyncio.run(main())
```
Then write a version that awaits each request one after another, and compare the times.

**Done when:** the `gather` version is clearly faster.

### Day 4: Validation with Pydantic

**Topic:** Pydantic validates and converts data, much like model binding plus DataAnnotations. It's used all over AI tooling.

**Learn (~15 min)**
- [Pydantic: Models](https://pydantic.dev/docs/validation/latest/concepts/models/)

**Do:** run `uv add pydantic`, then:
```python
from pydantic import BaseModel, HttpUrl, ValidationError

class LinkResult(BaseModel):
    url: HttpUrl
    status: int
    ok: bool

print(LinkResult(url="https://example.com", status=200, ok=True).model_dump_json())
try:
    LinkResult(url="not a url", status="abc", ok=True)
except ValidationError as e:
    print(e)
```

**Done when:** the valid object prints as JSON, and the invalid one shows two clear errors.

### Day 5: Testing with pytest

**Topic:** pytest is the standard Python test runner. A test is any function named `test_...` that uses plain `assert`.

**Learn (~15 min)**
- [pytest: Get started](https://docs.pytest.org/en/stable/getting-started.html)

**Do**
1. Run `uv add --dev pytest`, then put a function `extract_links(text: str) -> list[str]` in `links.py`, using the regex from Week 5 Day 6.
2. Create `tests/test_links.py` with three tests: one link, no links, and a duplicate link counted once.
3. Run `uv run pytest -q`.

**Done when:** 3 tests pass.

### Day 6: Mini project, async link checker

**Do:** build `check_links.py`, which:
1. finds every `.md` file in a folder and extracts all links (reuse `extract_links`)
2. checks them in parallel with `httpx.AsyncClient`, at most 10 at a time using `asyncio.Semaphore(10)`
3. treats status 200–399 as OK and 401/403 as "needs login", while anything else, or a timeout, is broken
4. prints a summary and writes every result to `links-report.json` using your `LinkResult` model

Run it on your plan folder: `uv run check_links.py ..\ai-engineering-plan`.

**Done when:** you get a report of all the plan's links. Fix any broken ones in the plan. You'll turn this tool into an MCP server in Week 24.

### Day 7: Review and catch-up (light)

- Push `py-tools` to `ai-learning/week-06`, with the tests passing.

---

## Week 7: AI from Python

**By the end of the week:** you can call local models and embeddings from Python, use notebooks, and know the OpenAI-compatible API that most AI tools use.

### Day 1: Chat with Ollama from Python

**Learn (~10 min)**
- [ollama-python README](https://github.com/ollama/ollama-python)

**Do**
1. Run `uv init py-ai` and `uv add ollama`.
2. Port your Week 1 chat loop:
   ```python
   import ollama

   history = [{"role": "system", "content": "Answer in at most 3 bullet points."}]
   while (q := input("You: ").strip()):           # := assigns and tests in one go
       history.append({"role": "user", "content": q})
       reply = ollama.chat(model="llama3.2", messages=history)
       text = reply["message"]["content"]
       print("AI:", text, "\n")
       history.append({"role": "assistant", "content": text})
   ```
3. Add streaming with `ollama.chat(..., stream=True)`, printing each `chunk["message"]["content"]` with `end=""` and `flush=True`.

**Done when:** you have a streaming chat working in Python. Compare it with your C# version.

### Day 2: Embeddings and NumPy

**Topic:** NumPy is the array library that almost all AI Python code relies on.

**Do:** run `uv add numpy`, then:
```python
import numpy as np
import ollama

def embed(texts: list[str]) -> np.ndarray:
    result = ollama.embed(model="nomic-embed-text", input=texts)
    return np.array(result["embeddings"])

docs = ["Deploy .NET to AWS Lambda", "Pizza recipes", "Serverless functions in C#"]
doc_vectors = embed(docs)
query = embed(["How do I run C# serverless?"])[0]

# cosine similarity for every document at once
scores = doc_vectors @ query / (np.linalg.norm(doc_vectors, axis=1) * np.linalg.norm(query))
for i in np.argsort(-scores):
    print(f"{scores[i]:.3f}  {docs[i]}")
```

**Done when:** the two serverless documents rank above pizza. Notice that one line of NumPy replaces your C# loop.

### Day 3: Jupyter notebooks

**Topic:** notebooks mix code, output, and notes. They're the standard place to experiment in AI work.

**Learn (~10 min)**
- [Jupyter notebooks in VS Code](https://code.visualstudio.com/docs/datascience/jupyter-notebooks)

**Do**
1. Run `uv add --dev ipykernel`, create `explore.ipynb` in VS Code, and select the `.venv` interpreter as the kernel.
2. Move the Day 2 code into cells, then add a Markdown cell explaining the result.
3. Add a cell that embeds 10 of your plan's day titles and prints the similarity of each to "vector database".

**Done when:** the notebook runs from top to bottom, with output saved in it.

### Day 4: The OpenAI-compatible API

**Topic:** most AI tools speak the OpenAI API format. Ollama provides it at `http://localhost:11434/v1`, so the same code works locally or with a cloud provider.

**Learn (~10 min)**
- [Ollama OpenAI compatibility](https://docs.ollama.com/api/openai-compatibility)

**Do:** run `uv add openai`, then:
```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")  # key is ignored locally
r = client.chat.completions.create(
    model="llama3.2",
    messages=[{"role": "user", "content": "Name three AWS compute services."}],
)
print(r.choices[0].message.content)
print(r.usage)
```

**Done when:** it answers and prints token usage. You can now use any tool that "needs an OpenAI key" against your local model.

### Day 5: Structured output and pandas

**Do**
1. Ask for JSON that matches a Pydantic model:
   ```python
   from pydantic import BaseModel
   import ollama

   class Triage(BaseModel):
       severity: str
       area: str
       summary: str

   r = ollama.chat(
       model="llama3.2",
       messages=[{"role": "user", "content": "Triage: checkout is 10s slow since the release"}],
       format=Triage.model_json_schema(),          # forces JSON matching the schema
   )
   print(Triage.model_validate_json(r["message"]["content"]))
   ```
2. Run `uv add pandas`. Triage the same three bug reports you used in C# in Week 1, put the results in a `pandas.DataFrame`, and print it sorted by severity.

**Done when:** you have a typed result, plus a sorted table.

### Day 6: Notebook project, comparing two embedding models

**Do**
1. Run `ollama pull mxbai-embed-large`, a second embedding model.
2. In a notebook, take your 10 questions from `eval-questions.md` (Week 4 Day 5) and the plan chunks.
3. For each model, check whether the correct day appears in the top 3 results, and count the hits.
4. Show a small table with the model, its hits out of 10, and the average search time.

**Done when:** you know which embedding model works better on your own plan, and you have numbers to prove it.

### Day 7: Review and catch-up (light)

- Push `py-ai` and the notebooks to `ai-learning/week-07`.

---

## Week 8: RAG in Python, compared with .NET

**By the end of the week:** your Week 4 RAG app rebuilt in Python and served by an API, and an honest comparison of the two languages for AI work.

### Day 1: Chunk and embed the plan

**Do:** in a new project, `uv init py-rag`, write `index.py`. It ports `ChunkPlan` from Week 3 Day 6, embeds every chunk with `ollama.embed` in batches of 32, and saves the vectors with `np.save("vectors.npy", ...)` and the chunks to `chunks.json`.

**Done when:** both files exist and the chunk count matches your C# version.

### Day 2: Search

**Do:** write `search.py` with `search(question: str, k: int = 3) -> list[tuple[float, dict]]`, using the NumPy cosine trick from Week 7 Day 2. Add pytest tests: the question "cosine similarity" must return Week 3 Day 2 in its top 3.

**Done when:** the test passes.

### Day 3: Generate with citations

**Do:** write `rag.py` with `ask(question) -> str`, using the same system prompt, `[1]` citations, and minimum-score cut-off as your C# `RagService`.

**Done when:** answers match the quality of your C# version on five questions.

### Day 4: Serve it with FastAPI

**Topic:** FastAPI is the most common Python web framework for AI services. It's close to ASP.NET Core minimal APIs.

**Learn (~15 min)**
- [FastAPI: First Steps](https://fastapi.tiangolo.com/tutorial/first-steps/)

**Do**
```python
# app.py
from fastapi import FastAPI
from pydantic import BaseModel
from rag import ask

app = FastAPI()

class Question(BaseModel):
    question: str

@app.post("/ask")
def ask_endpoint(q: Question) -> dict:
    return {"answer": ask(q.question)}
```
Run `uv add "fastapi[standard]"`, then `uv run fastapi dev app.py`. Open `http://127.0.0.1:8000/docs` and try `/ask` from the built-in page. Stop it with Ctrl+C.

**Done when:** you get an answer from the API docs page.

**C# equivalent:** `app.MapPost("/ask", (Question q) => ...)` plus Swagger.

### Day 5: Compare .NET and Python

**Do:** fill in this table in `ai-learning/week-08/README.md`, with real numbers from your two versions:

| | C# (Week 4) | Python (this week) |
|---|---|---|
| Lines of code | | |
| Time to build the index | | |
| Average answer time | | |
| Score on your 10 eval questions | | |
| Libraries you needed | | |
| What was easier | | |

**Done when:** the table is filled in, with a short conclusion. The usual finding is that both work well. Python has more AI libraries and examples, and C# gives you stronger types and is what most enterprise teams already run.

### Day 6: Python version passes the same evaluation

**Do:** write `eval.py`, which reads `eval-questions.md`, runs `search()` on each question, and prints hits@3 for the Python version. Compare it with the C# search.

**Done when:** both versions are measured on the same questions. If the Python version scores differently, find out why (chunking, model, or threshold).

### Day 7: Review and catch-up (light)

- Push `py-rag` to `ai-learning/week-08`.
- Python is now one of your tools. From here on, lessons use C# by default and Python where its libraries are clearly better.
