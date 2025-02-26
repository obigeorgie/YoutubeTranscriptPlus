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

    function showTranscript(transcript) {
        loading.classList.add('d-none');
        error.classList.add('d-none');
        transcriptContainer.classList.remove('d-none');
        transcriptText.textContent = transcript;
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

            showTranscript(data.transcript);
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

            // Create a blob from the response
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
});
