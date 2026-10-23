export function conversation(messages, a, b) {
    return messages.filter(m => m.sender_id === a && m.receiver_id === b || m.sender_id === b && m.receiver_id === a).sort((x, y) => x.timestamp_ms - y.timestamp_ms);
}
export function addUnique(messages, next) { return messages.some(m => m.id === next.id) ? messages : [...messages, next]; }
export class ApiService {
    session = null;
    mode = 'demo';
    base = '';
    liveBase = '';
    storageKey = 'webpro-project-chat-v1';
    channel = null;
    socket = null;
    receive = null;
    known = new Set();
    onStorage = (e) => { if (e.key === this.storageKey)
        this.checkIncoming(); };
    seen = new Set();
    pending = new Set();
    constructor() { try {
        this.channel = new BroadcastChannel('webpro-project-chat');
        this.channel.onmessage = () => this.checkIncoming();
    }
    catch { } window.addEventListener('storage', this.onStorage); }
    configure(mode, base = '', liveBase = '') {
        if (this.session)
            this.logout();
        this.mode = mode;
        this.base = base.replace(/\/$/, '');
        this.liveBase = liveBase.replace(/\/$/, '');
        if (mode === 'live') {
            const url = new URL(this.base);
            if (!['http:', 'https:'].includes(url.protocol))
                throw Error('Use an HTTP or HTTPS API URL.');
            if (location.protocol === 'https:' && url.protocol === 'http:')
                throw Error('HTTPS blocks the HTTP course server. Run locally over HTTP while connected to the VPN.');
        }
    }
    read() { try {
        const d = JSON.parse(localStorage.getItem(this.storageKey) || 'null');
        if (d && Array.isArray(d.users) && Array.isArray(d.messages))
            return d;
    }
    catch { } return { users: [{ id: 'guide', name: 'WebPRO Guide' }], messages: [] }; }
    save(db) { localStorage.setItem(this.storageKey, JSON.stringify(db)); this.channel?.postMessage('updated'); }
    async digest(password, salt) { const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + password)); return [...new Uint8Array(bytes)].map(v => v.toString(16).padStart(2, '0')).join(''); }
    async request(url, init) { const r = await fetch(url, { ...init, signal: AbortSignal.timeout(12000) }); if (!r.ok)
        throw Error(`Server returned HTTP ${r.status}`); const data = await r.json(); if (data && typeof data === 'object' && 'error' in data)
        throw Error(String(data.error)); return data; }
    post(path, body) { return this.request(this.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
    async register(name, email, password, group) {
        if (!name.trim() || password.length < 4)
            throw Error('Enter a name and a password of at least four characters.');
        if (this.mode === 'live') {
            await this.request(this.base + '/registrieren.php', { method: 'POST', body: new URLSearchParams({ name, email, password, group_id: group }) });
            return;
        }
        let db = this.read();
        if (db.users.some(u => u.name.toLowerCase() === name.trim().toLowerCase()))
            throw Error('That name is already registered.');
        const salt = crypto.randomUUID(), digest = await this.digest(password, salt);
        db = this.read();
        if (db.users.some(u => u.name.toLowerCase() === name.trim().toLowerCase()))
            throw Error('That name is already registered.');
        db.users.push({ id: crypto.randomUUID(), name: name.trim(), salt, digest, group_id: group });
        this.save(db);
    }
    async login(name, password, remember) {
        let session;
        if (this.mode === 'live') {
            const r = await this.post('/login.php', { username_or_email: name, password });
            if (!r.id || !r.token)
                throw Error('Login response is missing a user ID or token.');
            session = { id: String(r.id), token: r.token, name, mode: 'live' };
        }
        else {
            const u = this.read().users.find(u => u.name.toLowerCase() === name.trim().toLowerCase());
            if (!u?.salt || !u.digest || await this.digest(password, u.salt) !== u.digest)
                throw Error('Name or password is incorrect.');
            session = { id: u.id, name: u.name, token: crypto.randomUUID(), mode: 'demo' };
        }
        this.session = session;
        sessionStorage.setItem('webpro-project-session', JSON.stringify(session));
        if (remember && session.mode === 'demo')
            localStorage.setItem('webpro-project-remember', JSON.stringify(session));
        else
            localStorage.removeItem('webpro-project-remember');
        this.loadKnown();
        this.seen = new Set(this.read().messages.map(m => m.id));
        return session;
    }
    restore() { try {
        const s = JSON.parse(sessionStorage.getItem('webpro-project-session') || localStorage.getItem('webpro-project-remember') || 'null');
        if (s?.mode === 'demo' && this.read().users.some(u => u.id === s.id)) {
            this.session = s;
            this.mode = 'demo';
            this.loadKnown();
            this.seen = new Set(this.read().messages.map(m => m.id));
            return s;
        }
    }
    catch { } return null; }
    loadKnown() { try {
        this.known = new Set(JSON.parse(localStorage.getItem('webpro-contacts-' + this.session?.id) || '[]'));
    }
    catch {
        this.known = new Set();
    } }
    rememberContact(id) { this.known.add(id); localStorage.setItem('webpro-contacts-' + this.session?.id, JSON.stringify([...this.known])); }
    isKnown(id) { return this.known.has(id); }
    async users() {
        const s = this.requireSession();
        let users;
        if (this.mode === 'live') {
            users = await this.request(this.base + '/get_users.php?' + new URLSearchParams({ token: s.token, id: s.id }));
            if (!Array.isArray(users))
                throw Error('Invalid user list');
        }
        else {
            const seed = await this.request('demo-users.json');
            const db = this.read();
            for (const u of seed)
                if (!db.users.some(x => x.id === u.id))
                    db.users.push(u);
            this.save(db);
            users = db.users.map(({ id, name, group_id }) => ({ id, name, group_id }));
        }
        return users.filter(u => String(u.id) !== s.id).map(u => ({ ...u, id: String(u.id) })).sort((a, b) => Number(this.isKnown(b.id)) - Number(this.isKnown(a.id)) || a.name.localeCompare(b.name));
    }
    async messages(partner) {
        const s = this.requireSession();
        if (this.mode === 'demo')
            return conversation(this.read().messages, s.id, partner);
        const raw = await this.request(this.base + '/get_conversation.php?' + new URLSearchParams({ token: s.token, user1_id: s.id, user2_id: partner }));
        if (!Array.isArray(raw))
            throw Error('Invalid conversation');
        return raw.map((m, i) => this.normalize(m, i));
    }
    normalize(m, i = 0) { const time = Number(m['timestamp_ms']) || Number(m['timestamp']) * 1000 || Date.now(); return { id: String(m['id'] || `${m['sender_id']}-${time}-${i}-${m['message']}`), sender_id: String(m['sender_id']), receiver_id: String(m['receiver_id']), message: String(m['message'] || ''), timestamp_ms: time }; }
    async send(partner, text, realtime = false) {
        const s = this.requireSession(), clean = text.trim();
        if (!clean)
            throw Error('Write a message first.');
        const m = { id: crypto.randomUUID(), sender_id: s.id, receiver_id: partner, message: clean, timestamp_ms: Date.now() };
        if (this.mode === 'live') {
            const body = { token: s.token, sender_id: s.id, receiver_id: partner, message: clean };
            if (realtime) {
                if (!this.liveBase)
                    throw Error('Configure the realtime HTTP endpoint.');
                await this.request(this.liveBase + '/send-message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            }
            else
                await this.post('/send_message.php', body);
        }
        else {
            const db = this.read();
            db.messages.push(m);
            this.seen.add(m.id);
            this.save(db);
            if (partner === 'guide') {
                const timer = setTimeout(() => { this.pending.delete(timer); const reply = { id: crypto.randomUUID(), sender_id: 'guide', receiver_id: s.id, message: 'Simulated guide: received “' + clean.slice(0, 100) + '”. Register another demo account in a second tab for a real local exchange.', timestamp_ms: Date.now() }; const d = this.read(); d.messages.push(reply); this.save(d); this.checkIncoming(); }, 650);
                this.pending.add(timer);
            }
        }
        return m;
    }
    connect(receive, websocketUrl = '') {
        this.disconnect();
        this.receive = receive;
        if (this.mode === 'demo')
            return;
        const s = this.requireSession();
        if (!websocketUrl)
            return;
        const url = new URL(websocketUrl);
        if (!['ws:', 'wss:'].includes(url.protocol))
            throw Error('Use a WebSocket URL.');
        if (location.protocol === 'https:' && url.protocol === 'ws:')
            throw Error('HTTPS requires a secure wss:// endpoint.');
        url.searchParams.set('user_id', s.id);
        url.searchParams.set('token', s.token);
        this.socket = new WebSocket(url);
        this.socket.onmessage = e => { try {
            const data = JSON.parse(String(e.data));
            if (data.event === 'message' && String(data.receiver_id) === s.id)
                this.receive?.(this.normalize(data));
        }
        catch { } };
    }
    checkIncoming() { const db = this.read(); for (const m of db.messages) {
        if (!this.seen.has(m.id) && m.receiver_id === this.session?.id)
            this.receive?.(m);
        this.seen.add(m.id);
    } }
    disconnect() { this.socket?.close(); this.socket = null; this.receive = null; }
    logout() { this.disconnect(); this.pending.forEach(clearTimeout); this.pending.clear(); this.session = null; sessionStorage.removeItem('webpro-project-session'); localStorage.removeItem('webpro-project-remember'); }
    requireSession() { if (!this.session)
        throw Error('Please log in.'); return this.session; }
    dispose() { this.logout(); this.channel?.close(); window.removeEventListener('storage', this.onStorage); }
}
