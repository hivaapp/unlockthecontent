const fs = require('fs');
const path = require('path');

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    let original = content;

    // We do explicit replacements to keep things stable.

    // Types
    content = content.replace(/AccountabilityConfigData/g, 'FollowerPairingConfigData');
    content = content.replace(/AccountabilityConfigForm/g, 'FollowerPairingConfigForm');
    content = content.replace(/accountabilityConfig/g, 'followerPairingConfig');
    content = content.replace(/setAccountabilityConfig/g, 'setFollowerPairingConfig');
    content = content.replace(/hasAccountabilityErrors/g, 'hasFollowerPairingErrors');
    content = content.replace(/setHasAccountabilityErrors/g, 'setHasFollowerPairingErrors');
    content = content.replace(/AccountabilityUnlock/g, 'FollowerPairingUnlock');

    // Values & Paths (except keeping the /accountability/chat route structurally)
    content = content.replace(/'accountability'/g, "'follower_pairing'");
    content = content.replace(/"accountability"/g, '"follower_pairing"');
    content = content.replace(/`accountability`/g, '`follower_pairing`');

    // Labels
    content = content.replace(/Accountability Pairing/g, 'Follower Pairing');
    content = content.replace(/Accountability pairing/g, 'Follower pairing');
    content = content.replace(/Accountability Partner/g, 'Follower Partner');
    content = content.replace(/Accountability Matching/g, 'Follower Pairing Matching');
    
    // Some general components and routes might just use "Accountability" alone.
    // e.g., <AccountabilityLanding />, AccountabilityMatch, AccountabilityChat
    // Let's rename the component names and imports:
    content = content.replace(/AccountabilityLanding/g, 'FollowerPairingLanding');
    content = content.replace(/AccountabilityMatch(?!ing)/g, 'FollowerPairingMatch');
    content = content.replace(/AccountabilityMatching/g, 'FollowerPairingMatching');
    content = content.replace(/AccountabilityChat/g, 'FollowerPairingChat');

    // Restore route strings that were inadvertently changed if we did a blanket replacement.
    // The prompt: Route /r/:slug/match, /r/:slug/matching, /accountability/chat/:sessionId stay the same structurally
    content = content.replace(/\/follower_pairing\/chat/g, '/accountability/chat');

    // Fix textual "Accountability" -> "Follower Pairing" safely where not part of a word.
    // But since it's tricky with variable names, let's just do it directly.
    content = content.replace(/\>Accountability\s*\</g, '>Follower Pairing<');
    content = content.replace(/>Accountability</g, '>Follower Pairing<');
    content = content.replace(/"Accountability"/g, '"Follower Pairing"');
    content = content.replace(/'Accountability'/g, "'Follower Pairing'");

    // Update the "No file needed for Accountability links." text.
    content = content.replace(/Accountability links/g, 'Follower Pairing links');

    if (original !== content) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log('Updated', filepath);
    }
}

function walkArgs(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkArgs(file));
        } else if (file.match(/\.(ts|tsx|jsx|json)$/)) {
            results.push(file);
        }
    });
    return results;
}

const files = walkArgs('src');
files.forEach(processFile);
