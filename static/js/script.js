document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('transcriptForm');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const transcriptContainer = document.getElementById('transcriptContainer');
    const transcriptText = document.getElementById('transcript');
    const downloadBtn = document.getElementById('downloadBtn');

    function showLoading() {
        loading.classList.remove('d-none');
        error.classList.add('d-none');
        transcriptContainer.classList.add('d-none');
    }

    function showError(message) {
        loading.classList.add('d-none');
        error.textContent = message;
        error.classList.remove('d-none');
        transcriptContainer.classList.add('d-none');
    }

    function formatTranscriptEntry(entry) {
        const timestamp = entry.start;
        const minutes = Math.floor(timestamp / 60);
        const seconds = Math.floor(timestamp % 60);
        const text = entry.text.trim();
        return `<div class="transcript-entry">
            <button class="timestamp-btn btn btn-link" data-time="${timestamp}">
                [${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}]
            </button>
            <span class="transcript-text">${text}</span>
        </div>`;
    }

    function showTranscript(transcript) {
        loading.classList.add('d-none');
        error.classList.add('d-none');
        transcriptContainer.classList.remove('d-none');

        // Convert transcript data to HTML with clickable timestamps
        if (Array.isArray(transcript)) {
            transcriptText.innerHTML = transcript.map(formatTranscriptEntry).join('\n');

            // Add click handlers for timestamps
            document.querySelectorAll('.timestamp-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const time = parseFloat(btn.dataset.time);
                    // Send message to YouTube iframe to seek to timestamp
                    if (window.player && window.player.seekTo) {
                        window.player.seekTo(time);
                        window.player.playVideo();
                    }
                });
            });
        } else {
            transcriptText.innerHTML = transcript; // Fallback for plain text
        }
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const url = document.getElementById('youtubeUrl').value;

        showLoading();

        const formData = new FormData();
        formData.append('url', url);

        try {
            const response = await fetch('/get-transcript', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch transcript');
            }

            // Extract video ID from URL
            let videoId;
            try {
                const urlObj = new URL(url);
                if (url.includes('youtube.com')) {
                    videoId = urlObj.searchParams.get('v');
                } else if (url.includes('youtu.be')) {
                    videoId = urlObj.pathname.slice(1);
                }
            } catch (e) {
                console.error('Error parsing URL:', e);
                videoId = url.split('/').pop().split('?')[0];
            }

            // Reinitialize player with new video
            if (videoId) {
                // Clean up existing player
                const playerElement = document.getElementById('player');
                playerElement.innerHTML = '';
                window.player = null;
                loadYouTubePlayer(videoId);
            }

            showTranscript(data.transcript_data);
        } catch (err) {
            showError(err.message);
        }
    });

    downloadBtn.addEventListener('click', async function() {
        const transcript = transcriptText.textContent;
        if (!transcript) return;

        const formData = new FormData();
        formData.append('transcript', transcript);

        try {
            const response = await fetch('/download-transcript', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to download transcript');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transcript.txt';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            showError(err.message);
        }
    });

    // YouTube Player API integration
    window.onYouTubeIframeAPIReady = function() {
        console.log('YouTube API Ready');
    };

    function loadYouTubePlayer(videoId) {
        if (!videoId) {
            console.error('No video ID provided');
            return;
        }

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
            createPlayer(videoId);
        }
    }

    function createPlayer(videoId) {
        window.player = new YT.Player('player', {
            height: '360',
            width: '640',
            videoId: videoId,
            playerVars: {
                'playsinline': 1,
                'enablejsapi': 1
            },
            events: {
                'onReady': onPlayerReady,
                'onError': onPlayerError
            }
        });
    }

    function onPlayerReady(event) {
        console.log('Player ready');
    }

    function onPlayerError(event) {
        console.error('Player error:', event.data);
        showError('Error loading YouTube video');
    }
});