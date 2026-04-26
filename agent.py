"""
CodeSense v2 — AI Agent
All Groq API functions: explain segments, chat follow-ups, parse non-Python code.
"""

import os
from groq import Groq
from dotenv import load_dotenv
from tools import parse_code

# Load API key
load_dotenv()

# Create Groq client
client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

MODEL = "llama-3.3-70b-versatile"


def get_system_prompt(personality):
    """Creates a dynamic system prompt based on user's chosen personality."""
    return f"""You are a code tutor with this personality: {personality}.
Your job is to teach code to beginners in a clear and engaging way.
Keep explanations concise, friendly and easy to understand.
Stay in character with your personality at all times.
Use markdown formatting in your responses for better readability — use bold, bullet points, and code blocks where appropriate."""


def explain_segment(code, name, segment_type, personality):
    """Explains what a code segment does — works for functions, classes, and blocks."""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": get_system_prompt(personality)},
            {"role": "user", "content": f"""Explain what this {segment_type} called '{name}' does. 
Give a clear summary (2-4 sentences), then break down the key parts.

```
{code}
```"""}
        ]
    )
    return response.choices[0].message.content


def chat_reply(message, segment_code, history, personality):
    """
    Handles follow-up chat messages within a segment chatbox.
    Maintains conversation history for context.
    """
    messages = [
        {"role": "system", "content": get_system_prompt(personality)},
        {"role": "system", "content": f"""The user is asking about this code segment. Always reference it when answering:

```
{segment_code}
```"""}
    ]

    # Add conversation history
    for msg in history:
        messages.append({
            "role": msg.get("role", "user"),
            "content": msg.get("content", "")
        })

    # Add the new user message
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages
    )
    return response.choices[0].message.content


def analyze_code(code, personality, filename=""):
    """Parses code into segments using AST (Python) or AI (other languages)."""
    segments = parse_code(code, filename, client)
    return segments