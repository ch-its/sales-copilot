import os
from elevenlabs.client import ElevenLabs

# 🚨 PASTE YOUR ELEVENLABS API KEY HERE
API_KEY = "sk_dd4814e6d3322e338fafc0e34a3d4be54a9881357cf91d00"

AGENT_ID = "agent_4701kk5ew4mser6txys12yb0hy6t"
KB_ID = "PPXXJdvgpXIRqD44dksL" # Pulled right from your previous successful upload!

client = ElevenLabs(api_key=API_KEY)

def update_sales_agent():
    print(f"🔄 Updating Agent: {AGENT_ID}...")

    sarah_prompt = """
    You are Sarah, a busy VP of Sales. You are skeptical of new vendors.
    Use B2B objections: 'No budget', 'Already have a solution', or 'Implementation is too long'.
    Keep responses under 2 sentences. Be professional but firm.
    """

    try:
        # We push the exact same config we used to create her, 
        # but with the fixed phone greeting!
        client.conversational_ai.agents.update(
            agent_id=AGENT_ID,
            conversation_config={
                "prompt": {
                    "prompt": sarah_prompt,
                    "llm": "gemini-2.0-flash",
                    "temperature": 0.7
                },
                "first_message": "Hello, Sarah speaking.", # <--- THE FIX
                "language": "en",
                "knowledge_base": [
                    {
                        "id": KB_ID,
                        "type": "file"
                    }
                ]
            }
        )
        
        print("✅ Agent successfully updated!")
        print("🎙️ Sarah will now answer the phone with: 'Hello, Sarah speaking.'")

    except Exception as e:
        print(f"❌ Error updating agent: {e}")

if __name__ == "__main__":
    update_sales_agent()