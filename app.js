const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const notificationsBtn = document.getElementById('notificationsBtn');

const messages = [
  { role: 'assistant', content: 'Hello — I\'m Signal Operator. I can analyze your receipts, invoices, and statements for hidden charges and subscription risks.' },
  { role: 'user', content: 'Please check my recent transactions for duplicates and trial-to-paid conversions.' },
  { role: 'assistant', content: 'Done. I found one likely duplicate utility payment and a trial that will convert in 3 days. Want me to prepare cancellation and dispute steps?' }
];

function renderMessages() {
  chatMessages.innerHTML = '';
  messages.forEach(({ role, content, thinking }) => {
    const el = document.createElement('div');
    el.className = `msg ${role} ${thinking ? 'thinking' : ''}`;
    el.textContent = content;
    chatMessages.appendChild(el);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function runRealChat(prompt) {
  const response = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: prompt,
      history: messages.slice(-8).map(({ role, content }) => ({ role, content })),
    })
  });

  if (!response.ok) throw new Error('Operator backend unavailable');

  const data = await response.json();
  return data?.reply || data?.message || 'Operation completed.';
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const prompt = chatInput.value.trim();
  if (!prompt) return;

  messages.push({ role: 'user', content: prompt });
  chatInput.value = '';
  messages.push({ role: 'assistant', content: 'Thinking…', thinking: true });
  renderMessages();

  try {
    const reply = await runRealChat(prompt);
    messages[messages.length - 1] = { role: 'assistant', content: reply };
  } catch {
    messages[messages.length - 1] = {
      role: 'assistant',
      content: 'I could not reach the live operator service. Please try again or open Activity for the latest analysis.'
    };
  }

  renderMessages();
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

document.querySelectorAll('.pill-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    chatInput.value = btn.dataset.prompt || '';
    chatInput.focus();
  });
});

document.getElementById('viewAllBtn').addEventListener('click', () => {
  document.getElementById('activitySection').scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('activityAllBtn').addEventListener('click', () => {
  window.location.hash = '#activity';
});

notificationsBtn.addEventListener('click', () => {
  alert('4 actionable alerts are available in Activity.');
});

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((node) => node.classList.remove('active'));
    btn.classList.add('active');
    window.location.hash = btn.dataset.route;
  });
});

renderMessages();
