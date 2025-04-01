let conversationHistory = [];
let userIsScrolling = false;
let areFollowUpsHidden = false; 
let userMessage = null;
let isResponseGenerating = false; 

// Real-time Date & Time
function getPhilippinesTime() {
    return new Date().toLocaleString("en-US", {
        timeZone: "Asia/Manila",
        hour12: true,
        hour: "numeric",
        minute: "numeric",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const toggleThemeButton = document.querySelector("#theme-toggle-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

// API configuration
const GREPTILE_API_KEY = "A1+sUJ/IzDKoKvl8L7/40JEmcTccnjSMlpwV31BqfvOv2M/8";
const GITHUB_TOKEN = "<MY_GH_TOKEN>";
const API_URL = "https://api.greptile.com/query";

// Load theme and chat data from local storage on page load
const loadDataFromLocalstorage = () => {
  const savedChats = localStorage.getItem("saved-chats");
  const savedHistory = localStorage.getItem("conversation-history");
  const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

  // Load conversation history if exists
  if (savedHistory) {
    conversationHistory = JSON.parse(savedHistory);
  }

  // Restore saved chats or clear the chat container
  chatContainer.innerHTML = savedChats || '';
  document.body.classList.toggle("hide-header", savedChats);

  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
}

// Create a new message element and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
}

const displaySuggestions = async (messageDiv, aiResponse) => {
    
    if (isResponseGenerating) return;

     const existingSuggestions = messageDiv.querySelector(".suggestions-container");
    if (existingSuggestions) {
        existingSuggestions.remove();
    }

    // Follow-ups Suggestions Rules
    const suggestionsPrompt = `Based on the content of your previous response: "${aiResponse}",
        generate exactly 4 related follow-up questions that:
        1. Directly relate to the discussed codebase or programming topic.
        2. Continue the technical conversation.
        3. Help drive further discussion about software development.
        Return only the questions, separated by |`;
    
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": "Bearer " + GREPTILE_API_KEY,
                "X-Github-Token": GITHUB_TOKEN
            },
            body: JSON.stringify({
                messages: [{
                    id: "msg-suggestions",
                    role: "user",
                    content: suggestionsPrompt
                }],
                repositories: [
                    {
                        remote: "github",
                        repository: "pcmi-infnta/pcmi-official",
                        branch: "main"
                    }
                ]
            })
        });

        const data = await response.json();
        const suggestions = data.message.split("|");
        
        // Only create and append suggestions container after response is complete
        const suggestionsContainer = document.createElement("div");
        suggestionsContainer.classList.add("suggestions-container");
        suggestionsContainer.innerHTML = `
            <div class="suggestions-header">
                <h4 class="suggestions-title">Follow-ups:</h4>
                <div class="suggestions-options">
                    <span class="three-dots material-symbols-rounded">more_horiz</span>
                    <div class="options-dropdown">
                        <div class="option-item">Hide Follow-ups</div>
                    </div>
                </div>
            </div>
            <div class="suggestions-list">
                ${suggestions.map(suggestion => `
                    <div class="suggestion-item">
                        <p class="suggestion-text">${suggestion.trim()}</p>
                    </div>
                `).join('<div class="suggestion-separator"></div>')}
            </div>
        `;
        
        messageDiv.appendChild(suggestionsContainer);
        
        // After creating the suggestions container
        const threeDots = suggestionsContainer.querySelector('.three-dots');
        const optionsDropdown = suggestionsContainer.querySelector('.options-dropdown');
        const hideOption = suggestionsContainer.querySelector('.option-item');

        threeDots.addEventListener('click', (e) => {
            e.stopPropagation();
            optionsDropdown.classList.toggle('show');
        });

        hideOption.addEventListener('click', () => {
            const suggestionsContainer = optionsDropdown.closest('.suggestions-container');
            const messageDiv = suggestionsContainer.closest('.message');
            
            // Hiding class for animation
            suggestionsContainer.classList.add('hiding');
            
            // Wait for animation to complete before setting display none
            setTimeout(() => {
                suggestionsContainer.style.display = 'none';
                localStorage.setItem('hideFollowUps', 'true');
                areFollowUpsHidden = true;
                
                // Show menu icon message
                const menuIcon = messageDiv.querySelector('.menu-icon');
                if (menuIcon) {
                    menuIcon.style.display = 'inline-flex';
                }
                
                // Show menu icons for all messages
                document.querySelectorAll('.message .menu-icon').forEach(icon => {
                    icon.style.display = 'inline-flex';
                });
            }, 400);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            optionsDropdown.classList.remove('show');
        });

        // Click handlers
        messageDiv.querySelectorAll(".suggestion-item").forEach(item => {
            item.addEventListener("click", () => {
                const text = item.querySelector(".suggestion-text").textContent;
                document.querySelector(".typing-input").value = text;
                
                document.querySelectorAll(".suggestions-container").forEach(container => {
                    container.remove();
                });
                
                document.querySelector("#send-message-button").click();
            });
        });
    } catch (error) {
        console.error("Error generating suggestions:", error);
    }
}

// Show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWordIndex = 0;

    const existingSuggestions = incomingMessageDiv.querySelector(".suggestions-container");
    if (existingSuggestions) {
        existingSuggestions.remove();
    }

    const typingInterval = setInterval(() => {
        textElement.innerHTML += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        if (currentWordIndex === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("saved-chats", chatContainer.innerHTML);
            
            // Only show suggestions if it's NOT the inappropriate response
            if (text.trim() !== "I'm sorry, I can't answer that.") {
                setTimeout(() => {
                    displaySuggestions(incomingMessageDiv, text);
                }, 500);
            }
        }
        
        if (!userIsScrolling) {
            chatContainer.scrollTo(0, chatContainer.scrollHeight);
        }
    }, 75);
}

// Event listener detect manual scrolling
chatContainer.addEventListener('scroll', () => {
    userIsScrolling = true;
    // Reset the flag after a short delay
    clearTimeout(chatContainer.scrollTimeout);
    chatContainer.scrollTimeout = setTimeout(() => {
        userIsScrolling = false;
    }, 1000);
});

const getCustomErrorMessage = (error) => {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        const offlineMessages = [
            "Hmm... looks like we lost connection. Please check your internet and try again! 🌐",
            "Oops! We can't seem to connect right now. Mind checking your internet connection? 📶",
            "Connection hiccup! Please make sure you're connected to the internet and try again. ⚡",
            "We're having trouble connecting to our servers. Could you check your internet connection? 🔄",
            "It seems the internet connection is taking a break. Please check your connection and try again! 🔌",
            "Unable to connect right now. Please check if you're online and try once more. 🌍",
            "Connection lost! A quick internet check might help us get back on track. 🔎",
            "We hit a small bump - please check your internet connection and give it another try! 🚀"
        ];
        return offlineMessages[Math.floor(Math.random() * offlineMessages.length)];
    }
    return error.message;
};

const isInappropriateContent = (message) => {
    const inappropriateKeywords = ["badword1", "badword2", "offensive phrase"]; 
    return inappropriateKeywords.some(keyword => message.toLowerCase().includes(keyword));
};

// Fetch response from the API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");
    
    // Check inappropriate content
    if (isInappropriateContent(userMessage)) {
        textElement.textContent = "I'm sorry, I can't answer that.";
        isResponseGenerating = false;
        incomingMessageDiv.classList.remove("loading");
        
        // Save to conversation history
        conversationHistory.push({
            id: "msg-" + conversationHistory.length,
            role: "assistant",
            content: "I'm sorry, I can't answer that."
        });
        localStorage.setItem("conversation-history", JSON.stringify(conversationHistory));
        
        return;
    }
    
    // Create the conversation payload
    const messagesPayload = conversationHistory.map((msg, i) => {
        return {
            id: "msg-" + i, // you can generate a unique ID or use a counter
            role: msg.role,
            content: msg.content
        };
    });

    // Add the current user message
    messagesPayload.push({
        id: "msg-" + messagesPayload.length,
        role: "user",
        content: userMessage
    });

    const payload = {
        messages: messagesPayload,
        repositories: [
            {
                remote: "github",
                repository: "pcmi-infnta/pcmi-official", // Ensure this matches the expected repo
                branch: "main"
            }
        ]
    };

    console.log(JSON.stringify(payload)); // Log the payload to verify the format

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": "Bearer " + GREPTILE_API_KEY,
                "X-Github-Token": GITHUB_TOKEN
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error.message);

        const apiResponse = data.message;
        conversationHistory.push({
            id: "msg-" + conversationHistory.length,
            role: "assistant",
            content: apiResponse
        });
        
        localStorage.setItem("conversation-history", JSON.stringify(conversationHistory));

        textElement.textContent = '';
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);

    } catch (error) {
        isResponseGenerating = false;
        const customErrorMessage = getCustomErrorMessage(error);
        textElement.innerText = customErrorMessage;
        textElement.parentElement.closest(".message").classList.add("error");
    } finally {
        incomingMessageDiv.classList.remove("loading");
        
        const answerIndicator = incomingMessageDiv.querySelector('.answer-indicator');
        if (answerIndicator) {
            answerIndicator.textContent = "Answer";
        }
    }
};

// Show loading animation while waiting for API response
const showLoadingAnimation = () => {
  const html = `<div class="message-content">
                  <div class="header-row">
                    <div class="avatar-container">
                      <img class="avatar default-avatar" src="images/avatars/pcmi-bot.png" alt="Bot avatar">
                      <img class="avatar thinking-avatar" src="images/avatars/thinking.gif" alt="Thinking avatar">
                    </div>
                    <div class="answer-indicator">Thinking</div>
                  </div>
                  <div class="message-container">
                    <p class="text"></p>
                    <div class="loading-indicator">
                      <div class="loading-bar"></div>
                      <div class="loading-bar"></div>
                      <div class="loading-bar"></div>
                    </div>
                    <div class="message-actions">
                      <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>
                      <span onClick="toggleFollowUps(this)" class="menu-icon icon material-symbols-rounded" style="display: none;">more_horiz</span>
                    </div>
                  </div>
                </div>`;
  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatContainer.appendChild(incomingMessageDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  generateAPIResponse(incomingMessageDiv);
}

// Copy message text to clipboard
const copyMessage = (copyButton) => {
  const messageContainer = copyButton.closest('.message-container');
  const messageText = messageContainer.querySelector(".text").innerText;

  navigator.clipboard.writeText(messageText).then(() => {
    copyButton.innerText = "done"; 
    setTimeout(() => copyButton.innerText = "content_copy", 1000); // Revert icon after 1 second
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

const toggleFollowUps = (menuButton) => {
    const messageDiv = menuButton.closest('.message');
    
    if (areFollowUpsHidden) {
        // If suggestions are hidden, show them
        areFollowUpsHidden = false;
        localStorage.setItem('hideFollowUps', 'false');
        displaySuggestions(messageDiv, messageDiv.querySelector('.text').textContent);
        menuButton.style.display = 'none'; 
    }
};

const hideFollowUps = (suggestionsContainer) => {
    const messageDiv = suggestionsContainer.closest('.message');
    const menuButton = messageDiv.querySelector('.menu-icon');
    
    suggestionsContainer.classList.add('hiding');
    
    // Wait for animation to complete before setting display none
    setTimeout(() => {
        suggestionsContainer.style.display = 'none';
        localStorage.setItem('hideFollowUps', 'true');
        areFollowUpsHidden = true;
        
        // Show the menu icon ONLY after hiding follow-ups
        if (menuButton) {
            menuButton.style.display = 'inline-flex';
        }
    }, 400);
};

// Handle sending outgoing chat messages
const handleOutgoingChat = () => {
  userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if(!userMessage || isResponseGenerating) return;

  isResponseGenerating = true;

  // Add user message to conversation history
  conversationHistory.push({
    id: "msg-" + conversationHistory.length,
    role: "user",
    content: userMessage
  });

  // Keep the user message structure simple and inline
  const html = `<div class="message-content">
                <img class="avatar" src="images/avatars/user.gif" alt="User avatar">
                <div class="message-container">
                  <p class="text"></p>
                </div>
              </div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatContainer.appendChild(outgoingMessageDiv);
  
  typingForm.reset(); // Clear input field
  
  inputWrapper.classList.remove("expanded");
  actionButtons.classList.remove("hide");
  
  document.body.classList.add("hide-header");
  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
  setTimeout(showLoadingAnimation, 500); // Show loading animation after a delay
}
const waveContainer = document.querySelector(".theme-wave-container");
const waveElement = document.querySelector(".theme-wave");

toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.contains("light_mode");
  document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "dark_mode" : "light_mode");
  toggleThemeButton.innerText = isLightMode ? "light_mode" : "dark_mode";
});

// Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all the chats?")) {
    localStorage.removeItem("saved-chats");
    localStorage.removeItem("conversation-history");
    localStorage.removeItem("hideFollowUps"); // Reset the hidden state
    conversationHistory = [];
    loadDataFromLocalstorage();
  }
});

// Set userMessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

// Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
  e.preventDefault(); 
  handleOutgoingChat();
});

loadDataFromLocalstorage();

const inputWrapper = document.querySelector(".typing-form .input-wrapper");
const actionButtons = document.querySelector(".action-buttons");
const typingInput = document.querySelector(".typing-input");

typingInput.addEventListener("focus", () => {
  inputWrapper.classList.add("expanded");
  actionButtons.classList.add("hide");
});

typingInput.addEventListener("blur", () => {
  // Only collapse if there's no text
  if (typingInput.value.length === 0 && !isResponseGenerating) {
    inputWrapper.classList.remove("expanded");
    actionButtons.classList.remove("hide");
  }
});

typingInput.addEventListener("input", () => {
  // Keep expanded while typing
  if (typingInput.value.length > 0) {
    inputWrapper.classList.add("expanded");
    actionButtons.classList.add("hide");
  }
});

// Simplified event listeners
let windowHeight = window.innerHeight;
window.addEventListener('resize', () => {
  // Only collapse if the keyboard is actually hiding (height increasing)
  if (window.innerHeight > windowHeight) {
    if (typingInput.value.length === 0) {
      inputWrapper.classList.remove("expanded");
      actionButtons.classList.remove("hide");
    }
  }
  windowHeight = window.innerHeight;
});

// Only handle back button
window.addEventListener('popstate', (e) => {
  e.preventDefault();
  history.pushState(null, null, window.location.href);
});

// For Android back button
if (window.navigator.userAgent.match(/Android/i)) {
  document.addEventListener('backbutton', (e) => {
    e.preventDefault();
  }, false);
}