import os
import json
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

    def identify_speakers(self, transcript_segments):
        """Enhanced speaker identification with detailed analysis."""
        try:
            # Prepare transcript for analysis
            transcript_text = "\n".join([
                f"[{segment['start']:.2f}s]: {segment['text']}"
                for segment in transcript_segments
            ])

            logger.debug(f"Sending transcript for enhanced speaker identification, length: {len(transcript_segments)} segments")

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert transcript analyzer specializing in speaker identification.
                        Analyze the transcript and provide detailed speaker identification with the following:

                        For each segment, return:
                        1. speaker_id: Unique identifier (e.g., 'Host', 'Guest 1', 'Panelist A')
                        2. speaker_info: Object containing:
                           - role: The speaker's role (e.g., 'Host', 'Guest', 'Interviewer')
                           - characteristics: Notable speaking characteristics
                           - confidence: Confidence score (0.0-1.0) for this identification
                        3. context: Speaking context or relationship to other speakers

                        Return a JSON object with a 'segments' array where each element includes these details.
                        Use conversation flow, topic changes, and speaking patterns for identification."""
                    },
                    {"role": "user", "content": f"Here's the transcript:\n\n{transcript_text}"}
                ],
                response_format={"type": "json_object"}
            )

            # Parse the response
            result = json.loads(response.choices[0].message.content)
            logger.debug(f"Received enhanced speaker identification result: {result}")

            # Process and format the segments
            segments = []
            for i, original_segment in enumerate(transcript_segments):
                # Get speaker details from AI response or create default
                speaker_data = result.get('segments', [])[i] if i < len(result.get('segments', [])) else {}

                # Create enhanced speaker information
                speaker_info = speaker_data.get('speaker_info', {
                    'role': 'Unknown',
                    'characteristics': '',
                    'confidence': 0.5
                })

                segments.append({
                    'start': original_segment['start'],
                    'text': original_segment['text'],
                    'speaker_id': speaker_data.get('speaker_id', f'Speaker {i % 2 + 1}'),
                    'speaker_info': speaker_info,
                    'context': speaker_data.get('context', '')
                })

            return segments

        except Exception as e:
            logger.error(f"Error in enhanced speaker identification: {e}")
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