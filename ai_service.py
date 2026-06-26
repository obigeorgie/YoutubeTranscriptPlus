import os
import json
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        # Configure the Gemini API client
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set.")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def _call_gemini_api(self, prompt, is_json_output=False):
        """Generic method to call the Gemini API."""
        try:
            logger.debug(f"Sending prompt to Gemini, length: {len(prompt)} chars")
            generation_config = {}
            if is_json_output:
                generation_config["response_mime_type"] = "application/json"

            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )
            
            response_text = response.text
            logger.debug("Received response from Gemini.")
            
            if is_json_output:
                return json.loads(response_text)
            return response_text
            
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            # In case of API error, provide a structured error message
            # or raise a more specific exception.
            if is_json_output:
                return {"error": "API call failed", "details": str(e)}
            return f"Error: The AI service failed to process the request. Details: {e}"

    def identify_speakers(self, transcript_segments):
        """Speaker identification using Gemini."""
        transcript_text = "\n".join([
            f"[{segment['start']:.2f}s]: {segment['text']}"
            for segment in transcript_segments
        ])
        
        prompt = f"""You are an expert transcript analyzer specializing in speaker identification.
        Analyze the following transcript and identify the speakers. For each segment, provide a speaker ID (e.g., 'Speaker 1', 'Speaker 2').
        
        Return a JSON object with a 'segments' array. Each object in the array should contain the original 'start' and 'text', plus a 'speaker_id'.
        
        Transcript:
        {transcript_text}"""
        
        result = self._call_gemini_api(prompt, is_json_output=True)
        
        if "error" in result:
             # Fallback: if API fails, just return original segments with default speaker IDs
            return [
                {**seg, 'speaker_id': f'Speaker {(i % 2) + 1}'} 
                for i, seg in enumerate(transcript_segments)
            ]

        # Combine AI result with original data
        ai_segments = result.get('segments', [])
        for i, original_segment in enumerate(transcript_segments):
            if i < len(ai_segments):
                original_segment['speaker_id'] = ai_segments[i].get('speaker_id', f'Speaker {(i % 2) + 1}')
            else:
                original_segment['speaker_id'] = f'Speaker {(i % 2) + 1}'
                
        return transcript_segments

    def summarize_transcript(self, transcript_text):
        """Generate a concise summary of the transcript using Gemini."""
        prompt = f"Please provide a concise summary of this video transcript:\n\n{transcript_text}"
        return self._call_gemini_api(prompt)

    def extract_key_points(self, transcript_text):
        """Extract key points and insights from the transcript using Gemini."""
        prompt = f"Extract the main points and insights from this video transcript. Format as a bulleted list:\n\n{transcript_text}"
        return self._call_gemini_api(prompt)
