import os
import re
from urllib.parse import urlparse, parse_qs
from flask import Flask, render_template, request, jsonify, send_file
import youtube_transcript_api
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound
import logging
import io

# Configure logging with more detail
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key")

def extract_video_id(url):
    """Extract YouTube video ID from URL with improved parsing."""
    try:
        logger.debug(f"Extracting video ID from URL: {url}")
        parsed_url = urlparse(url)

        if 'youtube.com' in parsed_url.netloc:
            if 'watch' in parsed_url.path:
                query_params = parse_qs(parsed_url.query)
                video_id = query_params.get('v', [None])[0]
            elif 'embed' in parsed_url.path or 'v' in parsed_url.path:
                video_id = parsed_url.path.split('/')[-1]
            else:
                video_id = None
        elif 'youtu.be' in parsed_url.netloc:
            video_id = parsed_url.path.lstrip('/')
        else:
            video_id = None

        logger.debug(f"Extracted video ID: {video_id}")
        return video_id
    except Exception as e:
        logger.error(f"Error extracting video ID: {str(e)}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get-languages', methods=['POST'])
def get_languages():
    try:
        url = request.form.get('url', '')
        logger.info(f"Received request for available languages with URL: {url}")

        if not url:
            logger.warning("No URL provided")
            return jsonify({'error': 'Please enter a YouTube URL'}), 400

        video_id = extract_video_id(url)
        if not video_id:
            logger.warning(f"Invalid YouTube URL: {url}")
            return jsonify({'error': 'Invalid YouTube URL'}), 400

        logger.info(f"Fetching available languages for video ID: {video_id}")
        transcript_list = youtube_transcript_api.YouTubeTranscriptApi.list_transcripts(video_id)

        # Get all available languages
        languages = []
        try:
            # Get manually created transcripts
            for transcript in transcript_list._manually_created_transcripts.values():
                languages.append({
                    'code': transcript.language_code,
                    'name': transcript.language,
                    'type': 'manual'
                })
            # Get auto-generated transcripts
            for transcript in transcript_list._generated_transcripts.values():
                languages.append({
                    'code': transcript.language_code,
                    'name': transcript.language,
                    'type': 'generated'
                })
        except Exception as e:
            logger.error(f"Error processing transcripts: {str(e)}")

        if not languages:
            logger.warning(f"No transcripts available for video ID: {video_id}")
            return jsonify({'error': 'No transcripts available for this video'}), 404

        logger.info(f"Found {len(languages)} available languages")
        return jsonify({
            'languages': languages,
            'video_id': video_id
        })

    except TranscriptsDisabled:
        logger.warning(f"Transcripts are disabled for video ID: {video_id}")
        return jsonify({'error': 'Transcripts are disabled for this video'}), 400
    except NoTranscriptFound:
        logger.warning(f"No transcript found for video ID: {video_id}")
        return jsonify({'error': 'No transcript found for this video'}), 400
    except Exception as e:
        logger.error(f"Error getting languages: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching available languages'}), 500

@app.route('/get-transcript', methods=['POST'])
def get_transcript():
    try:
        url = request.form.get('url', '')
        language_code = request.form.get('language', 'en')  # Default to English
        logger.info(f"Received request for transcript with URL: {url} and language: {language_code}")

        if not url:
            logger.warning("No URL provided")
            return jsonify({'error': 'Please enter a YouTube URL'}), 400

        video_id = extract_video_id(url)
        if not video_id:
            logger.warning(f"Invalid YouTube URL: {url}")
            return jsonify({'error': 'Invalid YouTube URL'}), 400

        logger.info(f"Fetching transcript for video ID: {video_id} in language: {language_code}")
        transcript_list = youtube_transcript_api.YouTubeTranscriptApi.list_transcripts(video_id)

        try:
            transcript = transcript_list.find_transcript([language_code])
            transcript_data = transcript.fetch()
        except Exception as e:
            logger.error(f"Error fetching transcript in {language_code}: {str(e)}")
            # Try to get any available transcript if specified language is not available
            transcript = transcript_list.find_transcript([])
            transcript_data = transcript.fetch()
            logger.info(f"Falling back to available transcript in {transcript.language_code}")

        if not transcript_data:
            logger.warning(f"No transcript found for video ID: {video_id}")
            return jsonify({'error': 'No transcript available for this video'}), 404

        logger.info(f"Successfully retrieved transcript for video ID: {video_id}")
        return jsonify({
            'transcript_data': transcript_data,
            'video_id': video_id,
            'language': transcript.language,
            'language_code': transcript.language_code
        })

    except TranscriptsDisabled:
        logger.warning(f"Transcripts are disabled for video ID: {video_id}")
        return jsonify({'error': 'Transcripts are disabled for this video'}), 400
    except NoTranscriptFound:
        logger.warning(f"No transcript found for video ID: {video_id}")
        return jsonify({'error': 'No transcript found for this video'}), 400
    except Exception as e:
        logger.error(f"Error getting transcript: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching the transcript'}), 500

@app.route('/download-transcript', methods=['POST'])
def download_transcript():
    try:
        transcript = request.form.get('transcript', '')
        if not transcript:
            logger.warning("No transcript provided for download")
            return jsonify({'error': 'No transcript to download'}), 400

        # Create a text file in memory
        buffer = io.StringIO()
        buffer.write(transcript)
        buffer.seek(0)

        # Convert to bytes for sending
        bytes_io = io.BytesIO()
        bytes_io.write(buffer.getvalue().encode('utf-8'))
        bytes_io.seek(0)

        logger.info("Sending transcript file for download")
        return send_file(
            bytes_io,
            mimetype='text/plain',
            as_attachment=True,
            download_name='transcript.txt'
        )
    except Exception as e:
        logger.error(f"Error downloading transcript: {str(e)}")
        return jsonify({'error': 'Failed to download transcript'}), 500