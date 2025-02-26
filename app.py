import os
import re
from flask import Flask, render_template, request, jsonify, send_file
import youtube_transcript_api
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound
import logging
import io

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key")

def extract_video_id(url):
    """Extract YouTube video ID from URL."""
    # Regular expression pattern for YouTube URLs
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu.be\/)([^&\n?]*)',
        r'(?:youtube\.com\/embed\/)([^&\n?]*)'
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get-transcript', methods=['POST'])
def get_transcript():
    url = request.form.get('url', '')

    if not url:
        return jsonify({'error': 'Please enter a YouTube URL'}), 400

    video_id = extract_video_id(url)
    if not video_id:
        return jsonify({'error': 'Invalid YouTube URL'}), 400

    try:
        transcript_list = youtube_transcript_api.YouTubeTranscriptApi.get_transcript(video_id)
        formatted_transcript = ''

        for entry in transcript_list:
            timestamp = entry['start']
            minutes = int(timestamp // 60)
            seconds = int(timestamp % 60)
            text = entry['text']
            formatted_transcript += f'[{minutes:02d}:{seconds:02d}] {text}\n'

        return jsonify({'transcript': formatted_transcript})

    except TranscriptsDisabled:
        return jsonify({'error': 'Transcripts are disabled for this video'}), 400
    except NoTranscriptFound:
        return jsonify({'error': 'No transcript found for this video'}), 400
    except Exception as e:
        logging.error(f"Error getting transcript: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching the transcript'}), 500

@app.route('/download-transcript', methods=['POST'])
def download_transcript():
    transcript = request.form.get('transcript', '')
    if not transcript:
        return jsonify({'error': 'No transcript to download'}), 400

    # Create a text file in memory
    buffer = io.StringIO()
    buffer.write(transcript)
    buffer.seek(0)

    # Convert to bytes for sending
    bytes_io = io.BytesIO()
    bytes_io.write(buffer.getvalue().encode('utf-8'))
    bytes_io.seek(0)

    return send_file(
        bytes_io,
        mimetype='text/plain',
        as_attachment=True,
        download_name='transcript.txt'
    )