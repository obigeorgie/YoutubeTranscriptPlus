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
        # Log the incoming URL
        logger.debug(f"Extracting video ID from URL: {url}")

        # Parse the URL
        parsed_url = urlparse(url)

        # Handle youtube.com/watch?v= format
        if 'youtube.com' in parsed_url.netloc:
            if 'watch' in parsed_url.path:
                query_params = parse_qs(parsed_url.query)
                video_id = query_params.get('v', [None])[0]
            elif 'embed' in parsed_url.path or 'v' in parsed_url.path:
                video_id = parsed_url.path.split('/')[-1]
            else:
                video_id = None
        # Handle youtu.be format
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

@app.route('/get-transcript', methods=['POST'])
def get_transcript():
    try:
        url = request.form.get('url', '')
        logger.info(f"Received request for transcript with URL: {url}")

        if not url:
            logger.warning("No URL provided")
            return jsonify({'error': 'Please enter a YouTube URL'}), 400

        video_id = extract_video_id(url)
        if not video_id:
            logger.warning(f"Invalid YouTube URL: {url}")
            return jsonify({'error': 'Invalid YouTube URL'}), 400

        logger.info(f"Fetching transcript for video ID: {video_id}")
        transcript_list = youtube_transcript_api.YouTubeTranscriptApi.get_transcript(video_id)

        if not transcript_list:
            logger.warning(f"No transcript found for video ID: {video_id}")
            return jsonify({'error': 'No transcript available for this video'}), 404

        formatted_transcript = ''
        for entry in transcript_list:
            timestamp = entry['start']
            minutes = int(timestamp // 60)
            seconds = int(timestamp % 60)
            text = entry['text'].strip()
            formatted_transcript += f'[{minutes:02d}:{seconds:02d}] {text}\n'

        logger.info(f"Successfully retrieved transcript for video ID: {video_id}")
        return jsonify({'transcript': formatted_transcript})

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