document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('transcriptForm');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const transcriptContainer = document.getElementById('transcriptContainer');
    const transcriptText = document.getElementById('transcript');
    const downloadBtn = document.getElementById('downloadBtn');
    const languageSelector = document.getElementById('languageSelector');
    const languageSelect = document.getElementById('language');
    const currentLanguage = document.getElementById('currentLanguage');
    let currentVideoUrl = '';
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    const searchStats = document.getElementById('searchStats');
    const matchCount = document.getElementById('matchCount');
    const prevMatch = document.getElementById('prevMatch');
    const nextMatch = document.getElementById('nextMatch');
    let currentMatchIndex = -1;
    let matches = [];
    let currentTranscriptData = null;

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
        const milliseconds = Math.floor((timestamp % 1) * 1000);
        const text = entry.text.trim();
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;

        // Generate confidence indicator class for speaker identification
        let confidenceClass = 'confidence-medium';
        if (entry.speaker_info?.confidence >= 0.8) {
            confidenceClass = 'confidence-high';
        } else if (entry.speaker_info?.confidence < 0.4) {
            confidenceClass = 'confidence-low';
        }

        // Format speaker label with enhanced information
        const speakerLabel = entry.speaker_id ? `
            <div class="speaker-label">
                ${entry.speaker_id}
                ${entry.speaker_info?.role ? `
                    <span class="speaker-info">(${entry.speaker_info.role})</span>
                ` : ''}
                <span class="confidence-indicator ${confidenceClass}" 
                      title="Confidence: ${Math.round(entry.speaker_info?.confidence * 100)}%"></span>
            </div>
        ` : '';

        // Add characteristics if available
        const characteristics = entry.speaker_info?.characteristics ? `
            <span class="speaker-characteristic">${entry.speaker_info.characteristics}</span>
        ` : '';

        // Add context if available
        const context = entry.context ? `
            <div class="speaker-context">${entry.context}</div>
        ` : '';

        // Get video ID from current URL
        const videoId = currentVideoUrl ? extractVideoId(currentVideoUrl) : '';

        // Generate thumbnail URL for preview (using YouTube's thumbnail API)
        const thumbnailUrl = videoId ?
            `https://img.youtube.com/vi/${videoId}/${Math.floor(timestamp / 60)}.jpg` : '';

        return `<div class="transcript-entry" data-timestamp="${timestamp}">
            <div class="timestamp-wrapper">
                <button class="timestamp-btn btn btn-link" data-time="${timestamp}">
                    [${formattedTime}]
                    ${thumbnailUrl ? `
                        <div class="timestamp-preview">
                            <img src="${thumbnailUrl}" alt="Video preview">
                        </div>
                    ` : ''}
                    <div class="timestamp-copied">Copied! ✓</div>
                </button>
                <div class="timestamp-actions">
                    <button class="timestamp-action-btn" title="Copy timestamp" data-action="copy-time">
                        📋
                    </button>
                    <button class="timestamp-action-btn" title="Copy timestamp with text" data-action="copy-time-text">
                        📝
                    </button>
                </div>
            </div>
            ${speakerLabel}
            <span class="transcript-text">
                ${text}
                ${characteristics}
            </span>
            ${context}
            <button class="copy-btn" title="Copy text" data-text="${text.replace(/"/g, '&quot;')}">
                📋
            </button>
        </div>`;
    }

    function showTranscript(transcript, language) {
        loading.classList.add('d-none');
        error.classList.add('d-none');
        transcriptContainer.classList.remove('d-none');

        // Store the raw transcript data for downloads
        currentTranscriptData = transcript;

        // Show current language
        if (language) {
            currentLanguage.textContent = `Current language: ${language}`;
            currentLanguage.classList.remove('d-none');
        }

        // Convert transcript data to HTML with clickable timestamps
        if (Array.isArray(transcript)) {
            transcriptText.innerHTML = transcript.map(formatTranscriptEntry).join('\n');

            // Add click handlers for timestamps
            document.querySelectorAll('.timestamp-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const time = parseFloat(btn.dataset.time);
                    if (window.player && window.player.seekTo) {
                        window.player.seekTo(time);
                        window.player.playVideo();
                    }
                });
            });

            // Clear any existing search
            clearSearchHighlights();
        } else {
            transcriptText.innerHTML = transcript;
        }
    }

    // Search functionality
    function highlightSearch(searchText) {
        if (!searchText.trim()) {
            clearSearchHighlights();
            return;
        }

        const text = transcriptText.innerHTML;
        const searchRegex = new RegExp(`(${searchText})`, 'gi');

        // Remove existing highlights but keep the transcript structure
        const cleanText = text.replace(/<span class="search-highlight( active)?">([^<]+)<\/span>/g, '$2');

        // Add new highlights
        const highlightedText = cleanText.replace(searchRegex, '<span class="search-highlight">$1</span>');
        transcriptText.innerHTML = highlightedText;

        // Update matches array
        matches = Array.from(transcriptText.querySelectorAll('.search-highlight'));
        currentMatchIndex = matches.length > 0 ? 0 : -1;

        // Update UI
        matchCount.textContent = matches.length;
        searchStats.classList.toggle('d-none', matches.length === 0);

        if (matches.length > 0) {
            highlightCurrentMatch();
        }
    }

    function clearSearchHighlights() {
        const text = transcriptText.innerHTML;
        transcriptText.innerHTML = text.replace(/<span class="search-highlight( active)?">([^<]+)<\/span>/g, '$2');
        matches = [];
        currentMatchIndex = -1;
        searchStats.classList.add('d-none');
        searchInput.value = '';
    }

    function highlightCurrentMatch() {
        // Remove current highlight
        matches.forEach(match => match.classList.remove('active'));

        if (currentMatchIndex >= 0 && currentMatchIndex < matches.length) {
            const currentMatch = matches[currentMatchIndex];
            currentMatch.classList.add('active');
            currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Search event listeners
    searchInput.addEventListener('input', () => {
        highlightSearch(searchInput.value);
    });

    clearSearch.addEventListener('click', clearSearchHighlights);

    prevMatch.addEventListener('click', () => {
        if (matches.length > 0) {
            currentMatchIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
            highlightCurrentMatch();
        }
    });

    nextMatch.addEventListener('click', () => {
        if (matches.length > 0) {
            currentMatchIndex = (currentMatchIndex + 1) % matches.length;
            highlightCurrentMatch();
        }
    });

    async function fetchTranscript(url, languageCode = 'en') {
        showLoading();

        const formData = new FormData();
        formData.append('url', url);
        formData.append('language', languageCode);

        try {
            const response = await fetch('/get-transcript', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch transcript');
            }

            showTranscript(data.transcript_data, data.language);
        } catch (err) {
            showError(err.message);
        }
    }

    async function fetchLanguages(url) {
        const formData = new FormData();
        formData.append('url', url);

        try {
            const response = await fetch('/get-languages', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch languages');
            }

            // Populate language selector
            languageSelect.innerHTML = '<option value="" disabled selected>Choose a language...</option>';
            data.languages.forEach(lang => {
                const option = document.createElement('option');
                option.value = lang.code;
                option.textContent = `${lang.name} (${lang.type})`;
                languageSelect.appendChild(option);
            });

            // Show language selector
            languageSelector.classList.remove('d-none');

            // Select first language and fetch transcript
            if (data.languages.length > 0) {
                languageSelect.value = data.languages[0].code;
                await fetchTranscript(url, data.languages[0].code);
            }

            return data.video_id;
        } catch (err) {
            showError(err.message);
            languageSelector.classList.add('d-none');
            return null;
        }
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const url = document.getElementById('youtubeUrl').value;
        currentVideoUrl = url;

        try {
            // Extract video ID and initialize player
            const videoId = await fetchLanguages(url);

            if (videoId) {
                // Clean up existing player
                const playerElement = document.getElementById('player');
                playerElement.innerHTML = '';
                window.player = null;
                loadYouTubePlayer(videoId);
            }
        } catch (err) {
            showError(err.message);
        }
    });

    languageSelect.addEventListener('change', function() {
        if (currentVideoUrl && this.value) {
            fetchTranscript(currentVideoUrl, this.value);
        }
    });


    // Update download handling
    document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(item => {
        item.addEventListener('click', async function() {
            const format = this.dataset.format;
            if (!currentTranscriptData) return;

            const formData = new FormData();
            formData.append('transcript_data', JSON.stringify(currentTranscriptData));
            formData.append('format', format);

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
                a.download = `transcript.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } catch (err) {
                showError(err.message);
            }
        });
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

    // Word Cloud functionality
    const wordCloudBtn = document.getElementById('wordCloudBtn');
    const wordCloudModal = new bootstrap.Modal(document.getElementById('wordCloudModal'));
    const wordCloudImage = document.getElementById('wordCloudImage');
    const wordCloudLoading = document.getElementById('wordCloudLoading');

    wordCloudBtn.addEventListener('click', async function() {
        if (!currentTranscriptData) return;

        wordCloudImage.style.display = 'none';
        wordCloudLoading.classList.remove('d-none');
        wordCloudModal.show();

        const formData = new FormData();
        formData.append('transcript_data', JSON.stringify(currentTranscriptData));

        try {
            const response = await fetch('/generate-wordcloud', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to generate word cloud');
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            wordCloudImage.src = imageUrl;
            wordCloudImage.style.display = 'block';
            wordCloudLoading.classList.add('d-none');

            // When word cloud image is clicked
            wordCloudImage.addEventListener('click', function(e) {
                const rect = this.getBoundingClientRect();
                // Calculate click coordinates relative to the image
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Send coordinates to get the word at that position
                const formData = new FormData();
                formData.append('x', x);
                formData.append('y', y);
                formData.append('width', this.width);
                formData.append('height', this.height);

                fetch('/get-word-at-position', {
                    method: 'POST',
                    body: formData
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.word) {
                            // Hide the modal
                            wordCloudModal.hide();
                            // Search for the word in transcript
                            searchInput.value = data.word;
                            highlightSearch(data.word);
                        }
                    })
                    .catch(err => {
                        console.error('Error getting word:', err);
                        showError('Failed to get word from word cloud');
                    });
            });

            // Clean up the URL when the image loads
            wordCloudImage.onload = () => URL.revokeObjectURL(imageUrl);
        } catch (err) {
            showError(err.message);
            wordCloudModal.hide();
        }
    });

    // AI Analysis functionality
    const aiAnalysisModal = new bootstrap.Modal(document.getElementById('aiAnalysisModal'));
    const aiAnalysisContent = document.getElementById('aiAnalysisContent');
    const aiAnalysisLoading = document.getElementById('aiAnalysisLoading');

    document.querySelectorAll('[data-analysis]').forEach(button => {
        button.addEventListener('click', async function() {
            if (!currentTranscriptData) return;

            const analysisType = this.dataset.analysis;
            const analysisTitle = this.textContent.trim();

            // Update modal title based on analysis type
            document.getElementById('aiAnalysisModalLabel').textContent = analysisTitle;

            aiAnalysisContent.innerHTML = '';
            aiAnalysisLoading.classList.remove('d-none');
            aiAnalysisModal.show();

            const formData = new FormData();
            formData.append('transcript_data', JSON.stringify(currentTranscriptData));
            formData.append('type', analysisType);

            try {
                const response = await fetch('/analyze-transcript', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Failed to analyze transcript');
                }

                const data = await response.json();

                // Format the content based on analysis type
                let formattedContent = '<div class="ai-analysis-content">';
                if (analysisType === 'summary') {
                    formattedContent += `
                        <h6><i class="fa fa-file-text-o me-2"></i>Summary</h6>
                        <p>${data.summary}</p>
                    `;
                } else if (analysisType === 'key_points') {
                    // Assume key_points comes as a bullet-pointed string
                    const points = data.key_points.split('\n').filter(point => point.trim());
                    formattedContent += `
                        <h6><i class="fa fa-list me-2"></i>Key Points</h6>
                        <ul>
                            ${points.map(point => `<li>${point.replace(/^[•\-\*]\s*/, '')}</li>`).join('')}
                        </ul>
                    `;
                }
                formattedContent += '</div>';

                aiAnalysisContent.innerHTML = formattedContent;
            } catch (err) {
                aiAnalysisContent.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fa fa-exclamation-circle me-2"></i>
                        Failed to analyze transcript: ${err.message}
                    </div>
                `;
            } finally {
                aiAnalysisLoading.classList.add('d-none');
            }
        });
    });

    // Add this after the existing event listeners
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('copy-btn')) {
            const textToCopy = e.target.dataset.text;
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    // Visual feedback
                    const originalText = e.target.textContent;
                    e.target.textContent = '✅';
                    setTimeout(() => {
                        e.target.textContent = originalText;
                    }, 1000);
                })
                .catch(err => {
                    console.error('Failed to copy text:', err);
                    // Error feedback
                    const originalText = e.target.textContent;
                    e.target.textContent = '❌';
                    setTimeout(() => {
                        e.target.textContent = originalText;
                    }, 1000);
                });
        }
    });

    // Add speaker identification functionality
    async function identifySpeakers() {
        if (!currentTranscriptData) return;

        try {
            // Show loading state
            identifySpeakersBtn.disabled = true;
            identifySpeakersBtn.innerHTML = '🔄 Analyzing Speakers...';

            const formData = new FormData();
            formData.append('transcript_data', JSON.stringify(currentTranscriptData));

            const response = await fetch('/identify-speakers', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to identify speakers');
            }

            const data = await response.json();
            console.log('Speaker identification response:', data);

            if (!data.segments || !Array.isArray(data.segments)) {
                throw new Error('Invalid response format from speaker identification');
            }

            // Update transcript data with enhanced speaker information
            currentTranscriptData = currentTranscriptData.map((entry, index) => ({
                ...entry,
                speaker_id: data.segments[index]?.speaker_id || '',
                speaker_info: data.segments[index]?.speaker_info || {},
                context: data.segments[index]?.context || ''
            }));

            // Refresh transcript display
            showTranscript(currentTranscriptData);

        } catch (err) {
            console.error('Speaker identification error:', err);
            showError('Failed to identify speakers: ' + err.message);
        } finally {
            // Reset button state
            identifySpeakersBtn.disabled = false;
            identifySpeakersBtn.innerHTML = '👥 Identify Speakers';
        }
    }

    // Add event listener for the identify speakers button
    const identifySpeakersBtn = document.getElementById('identifySpeakersBtn');
    if (identifySpeakersBtn) {
        identifySpeakersBtn.addEventListener('click', identifySpeakers);
    }

    // Add timestamp-related event listeners
    document.addEventListener('click', function(e) {
        // Handle timestamp copy buttons
        if (e.target.classList.contains('timestamp-action-btn')) {
            const action = e.target.dataset.action;
            const entry = e.target.closest('.transcript-entry');
            const timestamp = entry.dataset.timestamp;
            const formattedTime = formatTimestamp(timestamp);
            const text = entry.querySelector('.transcript-text').textContent.trim();

            let copyText = '';
            if (action === 'copy-time') {
                copyText = formattedTime;
            } else if (action === 'copy-time-text') {
                copyText = `[${formattedTime}] ${text}`;
            }

            navigator.clipboard.writeText(copyText).then(() => {
                const copiedLabel = entry.querySelector('.timestamp-copied');
                copiedLabel.classList.add('show');
                setTimeout(() => {
                    copiedLabel.classList.remove('show');
                }, 1500);
            });
        }

        // Handle timestamp seeking
        if (e.target.classList.contains('timestamp-btn')) {
            const time = parseFloat(e.target.dataset.time);
            if (window.player && window.player.seekTo) {
                window.player.seekTo(time);
                window.player.playVideo();
            }
        }
    });

    // Helper function to format timestamp
    function formatTimestamp(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const millisecs = Math.floor((seconds % 1) * 1000);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millisecs.toString().padStart(3, '0')}`;
    }

    // Helper function to extract video ID from YouTube URL
    function extractVideoId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length == 11) ? match[7] : false;
    }

    // Handle timestamp range selection
    let selectionStart = null;
    document.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('transcript-entry')) {
            selectionStart = parseFloat(e.target.dataset.timestamp);
        }
    });

    document.addEventListener('mouseup', function(e) {
        if (selectionStart !== null && e.target.classList.contains('transcript-entry')) {
            const selectionEnd = parseFloat(e.target.dataset.timestamp);
            if (selectionEnd > selectionStart) {
                const timeRange = `${formatTimestamp(selectionStart)} - ${formatTimestamp(selectionEnd)}`;
                navigator.clipboard.writeText(timeRange).then(() => {
                    showToast('Time range copied: ' + timeRange);
                });
            }
            selectionStart = null;
        }
    });

    // Helper function to show toast notification
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
});