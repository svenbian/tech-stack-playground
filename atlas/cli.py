"""
Atlas CLI — interactive career planning assistant.

Usage:
    python -m atlas.cli
    python -m atlas.cli --session <session-id>   # resume a previous session
"""
import anyio
import argparse
import sys
import os

from claude_agent_sdk import (
    query,
    AssistantMessage,
    ResultMessage,
    SystemMessage,
    TextBlock,
)

from .agents import build_atlas_options
from .database import init_atlas_db

BANNER = """
╔══════════════════════════════════════════════════════════════╗
║   ░░░░  ATLAS  ░░░░                                          ║
║   AI Career Planning & Strategy Agent                        ║
║                                                              ║
║   Specialist subagents: career · finance · learning · wellness║
║   Type 'exit' or Ctrl-C to quit   |   'help' for commands   ║
╚══════════════════════════════════════════════════════════════╝
"""

HELP_TEXT = """
Atlas understands natural language — just talk to it.

Handy prompts to get started:
  "Give me a full status check"
  "Log that I studied Python for 90 minutes today"
  "I spent $50 on a Udemy course — add it to my expenses"
  "Create a 4-week study plan for SQL and APIs"
  "What should I focus on this week?"
  "Do a weekly review with me"
  "How's my budget looking?"
  "I'm feeling burned out — help me reset"

Commands:
  help    — show this text
  exit    — quit Atlas
"""


async def run_atlas(session_id: str | None = None) -> None:
    init_atlas_db()
    print(BANNER)

    if session_id:
        print(f"Resuming session: {session_id}\n")
    else:
        print("Starting a new Atlas session.\n")

    current_session_id = session_id

    # First message: give Atlas context from the existing notes.md
    notes_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "notes.md")
    first_message = (
        f"Hello Atlas. My tech stack notes are at {notes_path} — please read them "
        "to understand where I am, then greet me and ask what I'd like to work on today."
        if not session_id
        else None
    )

    try:
        while True:
            if first_message:
                user_input = first_message
                first_message = None
            else:
                try:
                    user_input = input("\nYou: ").strip()
                except (EOFError, KeyboardInterrupt):
                    print("\n\nAtlas: Safe travels. Come back when you're ready to keep moving forward.\n")
                    break

            if not user_input:
                continue

            lower = user_input.lower()
            if lower in ("exit", "quit", "bye"):
                print("\nAtlas: Safe travels. Come back when you're ready to keep moving forward.\n")
                break
            if lower == "help":
                print(HELP_TEXT)
                continue

            print("\nAtlas: ", end="", flush=True)

            options = build_atlas_options(current_session_id)

            async for message in query(prompt=user_input, options=options):
                if isinstance(message, SystemMessage) and message.subtype == "init":
                    new_sid = message.data.get("session_id")
                    if new_sid:
                        current_session_id = new_sid

                elif isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            print(block.text, end="", flush=True)

                elif isinstance(message, ResultMessage):
                    # ResultMessage carries the final summary text
                    if message.result and not message.result.isspace():
                        # Avoid double-printing if AssistantMessage already streamed it
                        pass

            print()  # newline after response

            if current_session_id:
                print(f"\n  [session: {current_session_id}]", flush=True)

    except KeyboardInterrupt:
        print("\n\nAtlas: Session interrupted. Your data is saved.\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Atlas — AI Career Planning & Strategy Agent"
    )
    parser.add_argument(
        "--session",
        metavar="SESSION_ID",
        default=None,
        help="Resume a previous Atlas session by ID",
    )
    args = parser.parse_args()

    anyio.run(run_atlas, args.session)


if __name__ == "__main__":
    main()
