/** WebPRO / Sudip Sah / TypeScript messenger controller. */
import { ApiService } from './api.js';
const api = new ApiService(), root = document.getElementById('app');
let contacts = [], active = null, loading = false, loadTicket = 0;
const get = (id) => document.getElementById(id);
function node(tag, text = '') { const element = document.createElement(tag); element.textContent = text; return element; }
function button(text, action) { const b = node('button', text); b.type = 'button'; b.addEventListener('click', action); return b; }
async function act(action) { if (loading)
    return; loading = true; get('error').textContent = ''; try {
    await action();
}
catch (e) {
    get('error').textContent = e instanceof Error ? e.message : 'Something went wrong.';
}
finally {
    loading = false;
} }
function connect() { api.connect(message => { if (active === message.sender_id)
    void displayMessages();
else {
    const notice = get('notification');
    notice.replaceChildren();
    notice.append(button((contacts.find(u => u.id === message.sender_id)?.name || 'New message') + ': ' + message.message, () => { active = message.sender_id; api.rememberContact(active); notice.replaceChildren(); void displayMessages(); }));
} }); }
function login() { root.innerHTML = '<form id="auth"><h2>Connect with WebPRO.</h2><p>Local demo accounts stay in this browser. Use a demo password. Live mode requires your course backend.</p><label>Name or email<input id="name" required minlength="2" autocomplete="username"></label><label>Password<input id="password" type="password" required minlength="4" autocomplete="current-password"></label><label>Email (for live registration)<input id="email" type="email"></label><label>Group<input id="group" value="webpro"></label><label class="check"><input id="remember" type="checkbox"> Remember demo account</label><div class="actions"><button>Log in</button><button type="button" id="register">Register & log in</button></div><details><summary>Backend configuration</summary><label>Mode<select id="mode"><option value="demo">Local demo</option><option value="live">Live course API</option></select></label><label>API base URL<input id="api-url" placeholder="http://your-server/messenger"></label><p>Use HTTPS APIs on this site. For an HTTP course server, run locally over HTTP with VPN access.</p></details></form>'; async function submit(register) { const name = get('name').value.trim(), password = get('password').value, email = get('email').value, group = get('group').value, remember = get('remember').checked; await act(async () => { api.configure(get('mode').value === 'live' ? 'live' : 'demo', get('api-url').value); if (register)
    await api.register(name, email, password, group); await api.login(name, password, remember); connect(); await showChat(); }); } get('auth').addEventListener('submit', e => { e.preventDefault(); void submit(false); }); get('register').addEventListener('click', () => void submit(true)); }
async function showChat() { contacts = await api.users(); root.innerHTML = '<div class="actions"><strong id="identity"></strong><button id="refresh">Refresh contacts</button><button id="logout">Log out</button></div><div class="chat-layout"><aside id="contacts" aria-label="Contacts"></aside><section><h2 id="partner">Select a contact</h2><div id="messages" class="chat-log" role="log" aria-label="Conversation"></div><form id="compose" class="compose"><input id="message" aria-label="Message" placeholder="Write a message…" required maxlength="2000"><button>Send ↗</button></form><p class="note">The WebPRO Guide is a simulated demo contact. Another account in a second tab can exchange real local messages.</p></section></div>'; get('identity').textContent = api.session.name + ' · ' + api.mode; contacts.forEach(user => get('contacts').append(button(user.name + (api.isKnown(user.id) ? ' ★' : ''), () => { active = user.id; api.rememberContact(user.id); void act(displayMessages); }))); get('refresh').onclick = () => void act(showChat); get('logout').onclick = () => { api.logout(); active = null; contacts = []; get('notification').replaceChildren(); login(); }; get('compose').onsubmit = e => { e.preventDefault(); const text = get('message').value.trim(); if (!active) {
    get('error').textContent = 'Select a contact first.';
    return;
} const partner = active; void act(async () => { await api.send(partner, text); if (active === partner) {
    get('message').value = '';
    await displayMessages();
} }); }; if (active && contacts.some(u => u.id === active))
    await displayMessages(); }
async function displayMessages() { if (!active)
    return; const partner = active, ticket = ++loadTicket; const messages = await api.messages(partner); if (active !== partner || ticket !== loadTicket || !document.getElementById('messages'))
    return; get('partner').textContent = contacts.find(u => u.id === partner)?.name || 'Conversation'; const log = get('messages'); log.replaceChildren(); messages.forEach(message => { const bubble = node('div'); bubble.className = 'bubble' + (message.sender_id === api.session?.id ? ' sent' : ''); bubble.append(node('div', message.message), node('small', new Date(message.timestamp_ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))); log.append(bubble); }); log.scrollTop = log.scrollHeight; }
if (api.restore()) {
    connect();
    void act(showChat);
}
else
    login();
