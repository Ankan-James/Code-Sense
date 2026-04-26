import os
from dotenv import load_dotenv
from groq import Groq

# Load the API key from .env file
load_dotenv()

# Create the Groq client
client = Groq(
    api_key = os.getenv("GROQ_API_KEY")
)

# Send a message to the AI
response = client.chat.completions.create(
    model = "llama-3.3-70b-versatile",
    messages = [
        {
            "role": "user",
            "content": "Say hello and introduce yourself!"
        }
    ]
)

# print the response
print(response.choices[0].message.content)