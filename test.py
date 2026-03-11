from google import genai

client = genai.Client(api_key="AIzaSyBlOop5FEDZtaslUMYbpc1whDIRJpLM2rE")

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Explain how AI works in one sentence"
)

print(response.text)