// === Configuration ===
const DISCORD_ID = '992637058906603590';
const LANYARD_WS = 'wss://api.lanyard.rest/socket';
const LANYARD_API = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;

// === Bio Text ===
const BIO_TEXT = `Hi, I'm Asra! (Az-ruh) I usually spend my time listening to music, watching anime, or playing games...

\u{1D649}\u{1D664}! me being nice does not mean i want you.
\u{1D649}\u{1D664}! Just because we talk frequently does not mean you can get with me.
\u{1D608}\u{1D5F2}\u{1D600}! I am looking for friends.`;

// === State ===
let music = null;
let isMuted = false;
let hasEntered = false;
let lanyardWs = null;
let spotifyTimestamps = null;
let spotifyProgressInterval = null;

// === Initialize on DOM Load ===
document.addEventListener('DOMContentLoaded', () => {
    music = document.getElementById('bg-music');
    createEnterParticles();
    initCursorGlow();
});

// === Click to Enter ===
document.getElementById('enter-screen').addEventListener('click', () => {
    if (hasEntered) return;
    hasEntered = true;

    const enterScreen = document.getElementById('enter-screen');
    enterScreen.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    enterScreen.style.opacity = '0';
    enterScreen.style.transform = 'scale(1.05)';

    // Play music
    if (music) {
        music.volume = 0.3;
        music.play().catch(() => {
            console.log('Audio autoplay blocked');
        });
    }

    setTimeout(() => {
        enterScreen.classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        initParticles();
        startTypingAnimation();
        connectLanyard();
    }, 800);
});

// === Enter Screen Particles ===
function createEnterParticles() {
    const container = document.getElementById('enter-particles');
    for (let i = 0; i < 40; i++) {
        const particle = document.createElement('div');
        particle.className = 'enter-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (4 + Math.random() * 4) + 's';
        const size = 2 + Math.random() * 4;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        container.appendChild(particle);
    }
}

// === Floating Particles Background ===
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: 0, y: 0 };

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2.5 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.hue = 270 + Math.random() * 30;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Mouse interaction
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                const force = (150 - dist) / 150;
                this.x -= (dx / dist) * force * 0.5;
                this.y -= (dy / dist) * force * 0.5;
            }

            // Wrap around
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${this.opacity})`;
            ctx.fill();

            // Glow
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${this.opacity * 0.15})`;
            ctx.fill();
        }
    }

    // Create particles
    const numParticles = Math.min(80, Math.floor(window.innerWidth * window.innerHeight / 15000));
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `hsla(275, 70%, 60%, ${0.08 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(animate);
    }

    animate();
}

// === Cursor Glow ===
function initCursorGlow() {
    const glow = document.getElementById('cursor-glow');
    document.addEventListener('mousemove', (e) => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    });
}

// === Mute Button ===
document.getElementById('mute-btn').addEventListener('click', () => {
    isMuted = !isMuted;
    const icon = document.getElementById('mute-icon');

    if (music) {
        music.muted = isMuted;
    }

    if (isMuted) {
        icon.className = 'fas fa-volume-mute';
    } else {
        icon.className = 'fas fa-volume-up';
    }
});

// === Typing Animation ===
function startTypingAnimation() {
    const bioElement = document.getElementById('bio-text');
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    bioElement.appendChild(cursor);

    let charIndex = 0;
    const speed = 25;

    function type() {
        if (charIndex < BIO_TEXT.length) {
            // Insert text before the cursor
            const textNode = document.createTextNode(BIO_TEXT.charAt(charIndex));
            bioElement.insertBefore(textNode, cursor);
            charIndex++;
            setTimeout(type, speed);
        } else {
            // Typing done - keep text, hide cursor after a moment
            setTimeout(() => {
                cursor.classList.add('hidden-cursor');
            }, 1500);
        }
    }

    type();
}

// === Dropdown Toggle ===
function toggleDropdown(button) {
    const section = button.parentElement;
    section.classList.toggle('open');
}

// === Lanyard (Discord Presence + Spotify) ===
function connectLanyard() {
    // First try REST API
    fetchLanyardData();
    // Then connect WebSocket for live updates
    connectLanyardWs();
}

async function fetchLanyardData() {
    try {
        const res = await fetch(LANYARD_API);
        const data = await res.json();
        if (data.success) {
            updatePresence(data.data);
        }
    } catch (err) {
        console.error('Lanyard API error:', err);
    }
}

function connectLanyardWs() {
    if (lanyardWs) {
        lanyardWs.close();
    }

    lanyardWs = new WebSocket(LANYARD_WS);

    lanyardWs.onopen = () => {
        console.log('Lanyard WS connected');
    };

    lanyardWs.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.op) {
            case 1: // Hello
                // Send init
                lanyardWs.send(JSON.stringify({
                    op: 2,
                    d: {
                        subscribe_to_id: DISCORD_ID
                    }
                }));
                // Start heartbeat
                setInterval(() => {
                    if (lanyardWs.readyState === WebSocket.OPEN) {
                        lanyardWs.send(JSON.stringify({ op: 3 }));
                    }
                }, data.d.heartbeat_interval);
                break;

            case 0: // Event (INIT_STATE or PRESENCE_UPDATE)
                if (data.t === 'INIT_STATE' || data.t === 'PRESENCE_UPDATE') {
                    updatePresence(data.d);
                }
                break;
        }
    };

    lanyardWs.onclose = () => {
        console.log('Lanyard WS disconnected, reconnecting in 5s...');
        setTimeout(connectLanyardWs, 5000);
    };

    lanyardWs.onerror = (err) => {
        console.error('Lanyard WS error:', err);
    };
}

function updatePresence(data) {
    updateDiscordStatus(data);
    updateDiscordActivities(data);
    updateSpotify(data);
}

function updateDiscordStatus(data) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    const status = data.discord_status || 'offline';

    dot.className = 'status-dot ' + status;

    const statusMap = {
        online: 'Online',
        idle: 'Idle',
        dnd: 'Do Not Disturb',
        offline: 'Offline'
    };

    text.textContent = statusMap[status] || 'Offline';

    // Update Discord user info
    if (data.discord_user) {
        const user = data.discord_user;
        const avatarEl = document.getElementById('discord-avatar');
        const displayNameEl = document.getElementById('discord-display-name');
        const usernameEl = document.getElementById('discord-username');

        if (user.avatar) {
            avatarEl.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`;
        }

        displayNameEl.textContent = user.display_name || user.global_name || user.username;
        usernameEl.textContent = '@' + user.username;
    }
}

function updateDiscordActivities(data) {
    const container = document.getElementById('discord-activity');
    container.innerHTML = '';

    if (!data.activities || data.activities.length === 0) return;

    // Filter out Spotify and custom status
    const activities = data.activities.filter(a => a.type !== 2 && a.type !== 4);

    activities.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';

        let imageUrl = '';
        if (activity.assets && activity.assets.large_image) {
            if (activity.assets.large_image.startsWith('mp:external')) {
                imageUrl = `https://media.discordapp.net/external/${activity.assets.large_image.replace('mp:external/', '')}`;
            } else {
                imageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
            }
        }

        const imgHtml = imageUrl ? `<img src="${imageUrl}" alt="${activity.name}" onerror="this.style.display='none'">` : '';

        item.innerHTML = `
            ${imgHtml}
            <div class="activity-details">
                <div class="activity-name">${escapeHtml(activity.name)}</div>
                ${activity.details ? `<div class="activity-state">${escapeHtml(activity.details)}</div>` : ''}
                ${activity.state ? `<div class="activity-state">${escapeHtml(activity.state)}</div>` : ''}
            </div>
        `;

        container.appendChild(item);
    });
}

function updateSpotify(data) {
    const notPlaying = document.getElementById('spotify-not-playing');
    const playing = document.getElementById('spotify-playing');

    if (data.spotify && data.listening_to_spotify) {
        notPlaying.classList.add('hidden');
        playing.classList.remove('hidden');

        document.getElementById('spotify-art').src = data.spotify.album_art_url || '';
        document.getElementById('spotify-song').textContent = data.spotify.song || 'Unknown';
        document.getElementById('spotify-artist').textContent = data.spotify.artist || 'Unknown';
        document.getElementById('spotify-album').textContent = data.spotify.album || '';

        spotifyTimestamps = data.spotify.timestamps;
        updateSpotifyProgress();

        // Clear old interval
        if (spotifyProgressInterval) clearInterval(spotifyProgressInterval);
        spotifyProgressInterval = setInterval(updateSpotifyProgress, 1000);
    } else {
        notPlaying.classList.remove('hidden');
        playing.classList.add('hidden');

        if (spotifyProgressInterval) {
            clearInterval(spotifyProgressInterval);
            spotifyProgressInterval = null;
        }
    }
}

function updateSpotifyProgress() {
    if (!spotifyTimestamps) return;

    const now = Date.now();
    const start = spotifyTimestamps.start;
    const end = spotifyTimestamps.end;
    const elapsed = now - start;
    const total = end - start;
    const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);

    document.getElementById('spotify-progress-bar').style.width = progress + '%';
    document.getElementById('spotify-elapsed').textContent = formatTime(elapsed);
    document.getElementById('spotify-duration').textContent = formatTime(total);
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make toggleDropdown available globally
window.toggleDropdown = toggleDropdown;
