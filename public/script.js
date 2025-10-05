const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Array to store the conversation history
const conversationHistory = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Add user message to history and display it
  conversationHistory.push({ role: 'user', text: userMessage });
  appendMessage('user', userMessage);
  input.value = '';

  // Display a "thinking" message from the bot
  const thinkingMessageElement = appendMessage('bot', 'Gemini is thinking...');

  try {
    // Send the conversation history to the backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation: conversationHistory }),
    });

    const data = await response.json();

    // Remove the "thinking" message
    chatBox.removeChild(thinkingMessageElement);

    if (data.success) {
      // Add model's response to history and display it
      conversationHistory.push({ role: 'model', text: data.data });
      appendMessage('bot', data.data);
    } else {
      // Display error message from the backend
      appendMessage('bot', `Error: ${data.message}`);
    }
  } catch (error) {
    // Remove the "thinking" message
    chatBox.removeChild(thinkingMessageElement);
    console.error('Error sending message:', error);
    appendMessage('bot', 'Oops! Something went wrong. Please try again.');
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg; // Return the message element so it can be removed later
}