"""A thin model interface, so the architect and runner never import a vendor SDK directly.

Any model that can turn (system, prompt) into text can sit behind `LLM`.
Gemini is the default. `ScriptedLLM` replays canned replies for offline tests.
"""

from __future__ import annotations

import json
import os
import re
from typing import Protocol

# Model ids change often. Run `python -m workflow_architect models` to see what your key can use.
DEFAULT_MODELS = {
    "fast": os.getenv("WA_FAST_MODEL", "gemini-3-flash-preview"),
    "smart": os.getenv("WA_SMART_MODEL", "gemini-3-pro-preview"),
}


class LLM(Protocol):
    def generate(
        self, prompt: str, *, system: str = "", tier: str = "smart", temperature: float = 0.7, json_mode: bool = False
    ) -> str: ...


class GeminiLLM:
    def __init__(self, models: dict[str, str] | None = None, api_key: str | None = None):
        from google import genai  # imported lazily so tests run without the SDK configured

        self._types = genai.types
        self.client = genai.Client(api_key=api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
        self.models = {**DEFAULT_MODELS, **(models or {})}

    def generate(self, prompt, *, system="", tier="smart", temperature=0.7, json_mode=False):
        config = self._types.GenerateContentConfig(
            system_instruction=system or None,
            temperature=temperature,
            response_mime_type="application/json" if json_mode else None,
        )
        response = self.client.models.generate_content(model=self.models[tier], contents=prompt, config=config)
        return response.text or ""

    def list_models(self) -> list[str]:
        return [m.name for m in self.client.models.list()]


class ScriptedLLM:
    """Returns pre-written replies in order and records every call (for tests and dry runs)."""

    def __init__(self, replies: list[str]):
        self.replies = list(replies)
        self.calls: list[dict] = []

    def generate(self, prompt, *, system="", tier="smart", temperature=0.7, json_mode=False):
        self.calls.append({"prompt": prompt, "system": system, "tier": tier, "json_mode": json_mode})
        if not self.replies:
            raise RuntimeError("ScriptedLLM ran out of replies")
        return self.replies.pop(0)


def parse_json(text: str):
    """Parse JSON from a model reply, tolerating ```json fences and stray prose around it."""
    text = text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = min((i for i in (text.find("{"), text.find("[")) if i != -1), default=-1)
        if start == -1:
            raise
        end = max(text.rfind("}"), text.rfind("]"))
        return json.loads(text[start : end + 1])
