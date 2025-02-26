import os
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

    def summarize_transcript(self, transcript_text):
        """Generate a concise summary of the transcript."""
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that creates concise summaries of video transcripts."},
                    {"role": "user", "content": f"Please provide a concise summary of this video transcript:\n\n{transcript_text}"}
                ],
                max_tokens=300
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error summarizing transcript: {e}")
            raise

    def extract_key_points(self, transcript_text):
        """Extract key points and insights from the transcript."""
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Extract the main points and insights from this video transcript. Format as a bulleted list."},
                    {"role": "user", "content": f"Please extract the key points from this transcript:\n\n{transcript_text}"}
                ],
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error extracting key points: {e}")
            raise
