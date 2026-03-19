const fs = require('fs');
const logFile = 'C:/Users/Prem/.gemini/antigravity/brain/d8745872-f985-47ed-bba1-72616900a367/.system_generated/steps/129/output.txt';

try {
    const data = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    const results = data.result.result;
    results.forEach(entry => {
        if (entry.status_code === 400 || entry.event_message.toLowerCase().includes('error')) {
            console.log(JSON.stringify(entry, null, 2));
        }
    });
} catch (e) {
    console.error(e);
}
