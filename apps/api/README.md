# LUXOR9 API

FastAPI modular monolith for identity, Trust Engine, workflows, evidence and the CMO pack.

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest -q
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
