import os
from openai import OpenAI
import logging
import json

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

    def identify_speakers(self, transcript_segments):
        """Identify speakers in transcript segments using OpenAI."""
        try:
            # Prepare transcript for analysis
            transcript_text = "\n".join([
                f"[{segment['start']:.2f}s]: {segment['text']}"
                for segment in transcript_segments
            ])

            logger.debug(f"Sending transcript for speaker identification, length: {len(transcript_segments)} segments")

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a transcript speaker identifier. Analyze the transcript and identify different speakers.
                        Return a JSON object with a 'segments' array where each element matches the input segments and includes:
                        - speaker_id: string (e.g., 'Host', 'Guest', 'Speaker 1')
                        Identify speakers based on context, speaking patterns, and conversation flow."""
                    },
                    {"role": "user", "content": f"Here's the transcript:\n\n{transcript_text}"}
                ],
                response_format={"type": "json_object"}
            )

            # Parse the response
            result = json.loads(response.choices[0].message.content)
            logger.debug(f"Received speaker identification result: {result}")

            # Ensure we have a segments array with speaker_id for each segment
            segments = []
            for i, original_segment in enumerate(transcript_segments):
                speaker_id = (
                    result.get('segments', [])[i].get('speaker_id', f'Speaker {i % 2 + 1}')
                    if i < len(result.get('segments', []))
                    else f'Speaker {i % 2 + 1}'
                )
                segments.append({
                    'start': original_segment['start'],
                    'text': original_segment['text'],
                    'speaker_id': speaker_id
                })

            return segments

        except Exception as e:
            logger.error(f"Error identifying speakers: {e}")
            raise

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