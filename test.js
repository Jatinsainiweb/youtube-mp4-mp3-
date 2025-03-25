import fetch from 'node-fetch';

async function testBackend() {
    try {
        console.log('Testing backend...');
        const response = await fetch('https://youtube-converter-backend-hfxq4237q-jatin-sainis-projects.vercel.app/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                format: 'mp4'
            })
        });

        console.log('Response status:', response.status);
        const data = await response.text();
        console.log('Response body:', data);
        
        try {
            const jsonData = JSON.parse(data);
            console.log('Parsed JSON:', jsonData);
        } catch (e) {
            console.log('Could not parse response as JSON');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testBackend();
