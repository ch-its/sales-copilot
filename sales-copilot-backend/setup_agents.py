import os
from elevenlabs.client import ElevenLabs

# 🚨 PASTE YOUR ELEVENLABS API KEY HERE
API_KEY = "sk_dd4814e6d3322e338fafc0e34a3d4be54a9881357cf91d00"
client = ElevenLabs(api_key=API_KEY)

def setup_sales_copilot_agents():
    print("🚀 Connecting to ElevenLabs...")

    try:
        # 1. UPLOAD THE KNOWLEDGE FIRST
        # We must have the 'brain' ready before we build the 'person'
        print("📁 Uploading B2B Case Studies to Knowledge Base...")
        with open("CaseStudies.md", "rb") as f:
            kb_doc = client.conversational_ai.knowledge_base.documents.create_from_file(
                file=f,
                name="B2B Sales Playbooks"
            )
        print(f"✅ Knowledge Base Document ID: {kb_doc.id}")

        # 2. CREATE THE AGENT WITH THE KNOWLEDGE ATTACHED
        # We pass the document ID directly into the creation config
        print("👤 Creating 'Sarah' with pre-loaded Knowledge...")
        sarah_prompt = """
        You are Sarah, a busy VP of Sales. You are skeptical of new vendors.
        Use B2B objections: 'No budget', 'Already have a solution', or 'Implementation is too long'.
        Keep responses under 2 sentences. Be professional but firm.
        """

        agent = client.conversational_ai.agents.create(
            name="Sarah - Enterprise VP",
            conversation_config={
                "prompt": {
                    "prompt": sarah_prompt,
                    "llm": "gemini-2.0-flash", # Google Prize Eligibility!
                    "temperature": 0.7
                },
                "first_message": "Look, I'm busy, and I highly doubt you have anything new for me.",
                "language": "en",
                "knowledge_base": [
                    {
                        "id": kb_doc.id,
                        "type": "file"
                    }
                ]
            }
        )
        
        print(f"✨ Setup Complete! Copy this Agent ID: {agent.agent_id}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    setup_sales_copilot_agents()