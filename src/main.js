import { generateAPIResponse } from './scripts/generateAPIResponse.js';
import { getCombinedTrainingData } from './scripts/training-data.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

let conversationHistory = [];
let userIsScrolling = false;
let areFollowUpsHidden = false; 
let userMessage = null;
let isResponseGenerating = false; 

const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const toggleThemeButton = document.querySelector("#theme-toggle-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

const GREPTILE_API_KEY = "thg/M1gExyn/ELnHs8qLqFW5F19g2isDZ1bnOGNT2bnANr8i";
const GITHUB_TOKEN = "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";
const API_URL = "https://api.greptile.com/query";
const REPOSITORY_NAME = "Ejjay/ai-interview2";
// const REPOSITORY_NAME = "pcmi-infnta/ai-codebase3";

// Helper function to sanitize markdown
function sanitizeMarkdown(content) {
    return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

// Helper functions to display messages
const displayUserMessage = (content) => {
    const html = `
        <div class="message-content">
            <img class="avatar" src="images/avatars/user.gif" alt="User avatar">
            <div class="message-container">
                <p class="text">${content}</p>
            </div>
        </div>
    `;
    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    chatContainer.appendChild(outgoingMessageDiv);
}

const displayAIMessage = (content) => {
    try {
        const sanitizedContent = sanitizeMarkdown(content);
        // Add specific handling for code blocks
        const processedContent = sanitizedContent.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            const lang = language || '';
            return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
        });

        const parsedContent = marked(processedContent);

        const html = `
            <div class="message-content">
                <div class="header-row">
                    <div class="avatar-container">
                        <img class="avatar default-avatar" src="images/avatars/pcmi-bot.png" alt="Bot avatar">
                    </div>
                </div>
                <div class="message-container">
                    <div class="text">
                        ${parsedContent}
                    </div>
                </div>
            </div>
        `;
        const incomingMessageDiv = createMessageElement(html, "incoming");
        chatContainer.appendChild(incomingMessageDiv);

        // Initialize highlighting on the new content
        incomingMessageDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
            
            // Add click-to-copy functionality
            block.style.cursor = 'pointer'; // Make it look clickable
            block.addEventListener('click', function() {
                const codeText = this.textContent;
                navigator.clipboard.writeText(codeText).then(() => {
                    // Optional: Add visual feedback
                    const originalBackground = this.style.background;
                    this.style.background = '#4CAF50';
                    setTimeout(() => {
                        this.style.background = originalBackground;
                    }, 200);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                });
            });
        });

    } catch (error) {
        console.error('Markdown parsing error:', error);
        return displayAIMessage(content.toString());
    }
}

const loadDataFromLocalstorage = () => {
    const savedHistory = localStorage.getItem("conversation-history");

    // Reset conversationHistory
    conversationHistory = savedHistory ? JSON.parse(savedHistory) : [];

    // Clear the chat container
    chatContainer.innerHTML = '';

    // Rebuild the chat from conversationHistory
    if (conversationHistory.length > 0) {
        conversationHistory.forEach((message) => {
            if (message.role === "user") {
                displayUserMessage(message.content);
            } else if (message.role === "assistant") {
                displayAIMessage(message.content);
            }
        });
    }

    document.body.classList.toggle("hide-header", conversationHistory.length > 0);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
}

function convertCodeSnippets(text) {
    return text.replace(/```([\s\S]*?)```/g, function(match, p1) {
        // Return proper markdown code block format
        return `\`\`\`\n${p1.trim()}\n\`\`\``;
    });
}

const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

function processAIResponse(responseText) {
    const marker = "```";
    if (responseText.startsWith(marker) && responseText.endsWith(marker)) {
        let innerText = responseText.substring(marker.length, responseText.length - marker.length).trim();
        responseText = `<div class="ai-code-snippet"><code>${innerText}</code></div>`;
    }
    return responseText;
}

const showFadeInEffect = (text, textElement, incomingMessageDiv) => {
    if (!textElement || !incomingMessageDiv) {
        console.error('textElement or incomingMessageDiv is null');
        return;
    }

    // Find or create the prose container
    let proseContainer = textElement.querySelector('.prose') || textElement;
    
    try {
        // Convert code blocks to proper format
        const processedText = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            const lang = language || '';
            return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
        }); 

        // Parse markdown and set content
        proseContainer.innerHTML = marked(processedText);

        // Initialize highlight.js and click-to-copy on all code blocks
        proseContainer.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
            
            // Add click-to-copy functionality
            block.style.cursor = 'pointer';
            block.addEventListener('click', function() {
                const codeText = this.textContent;
                navigator.clipboard.writeText(codeText).then(() => {
                    // Visual feedback
                    const originalBackground = this.style.background;
                    this.style.background = '#4CAF50';
                    setTimeout(() => {
                        this.style.background = originalBackground;
                    }, 200);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                });
            });
        });

        // Rest of the function remains the same...
        incomingMessageDiv.classList.add("fade-in");
        setTimeout(() => {
            incomingMessageDiv.classList.remove("fade-in");
        }, 700);

        isResponseGenerating = false;
        const icon = incomingMessageDiv.querySelector(".icon");
        if (icon) {
            icon.classList.remove("hide");
        }

        if (!userIsScrolling) {
            chatContainer.scrollTo(0, chatContainer.scrollHeight);
        }

        // Handle conversation history
        const aiMessage = {
            id: "msg-" + conversationHistory.length,
            role: "assistant",
            content: text
        };

        if (!conversationHistory.find(msg => msg.content === aiMessage.content && msg.role === "assistant")) {
            conversationHistory.push(aiMessage);
            localStorage.setItem("conversation-history", JSON.stringify(conversationHistory));
        }

    } catch (error) {
        console.error('Error in showFadeInEffect:', error);
        proseContainer.innerHTML = text;
    }
}

chatContainer.addEventListener('scroll', () => {
    userIsScrolling = true;

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
                    </div>
                  </div>`;
    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatContainer.appendChild(incomingMessageDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    
    generateAPIResponse(
        incomingMessageDiv,
        userMessage,
        isInappropriateContent,
        conversationHistory,
        getCombinedTrainingData,
        REPOSITORY_NAME,
        isResponseGenerating,
        getCustomErrorMessage,
        API_URL,
        GREPTILE_API_KEY,
        GITHUB_TOKEN,
        (aiResponse) => {
            const processedResponse = processAIResponse(aiResponse);
            showFadeInEffect(processedResponse, incomingMessageDiv.querySelector(".text"), incomingMessageDiv);
        }
    );
}

function copyMessage(button) {
    const messageDiv = button.closest('.message-content');
    const textElement = messageDiv.querySelector('.text');
    const text = textElement.textContent;

    navigator.clipboard.writeText(text).then(() => {
        button.classList.add('copied');
        setTimeout(() => {
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

window.copyMessage = copyMessage;

const toggleFollowUps = (menuButton) => {
    const messageDiv = menuButton.closest('.message');

    if (areFollowUpsHidden) {
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

    setTimeout(() => {
        suggestionsContainer.style.display = 'none';
        localStorage.setItem('hideFollowUps', 'true');
        areFollowUpsHidden = true;

        if (menuButton) {
            menuButton.style.display = 'inline-flex';
        }
    }, 400);
};

const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if (!userMessage || isResponseGenerating) return;

    isResponseGenerating = true;

    const userMsg = {
        id: "msg-" + conversationHistory.length,
        role: "user",
        content: userMessage
    };
    conversationHistory.push(userMsg);

    const html = `
        <div class="message-content">
            <img class="avatar" src="images/avatars/user.gif" alt="User avatar">
            <div class="message-container">
                <p class="text">${userMessage}</p>
            </div>
        </div>
    `;
    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    chatContainer.appendChild(outgoingMessageDiv);

    typingForm.reset();
    inputWrapper.classList.remove("expanded");
    actionButtons.classList.remove("hide");

    document.body.classList.add("hide-header");
    chatContainer.scrollTo(0, chatContainer.scrollHeight);

    setTimeout(showLoadingAnimation, 500);
}

const waveContainer = document.querySelector(".theme-wave-container");
const waveElement = document.querySelector(".theme-wave");

toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.contains("light_mode");
    document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "dark_mode" : "light_mode");
    toggleThemeButton.innerText = isLightMode ? "light_mode" : "dark_mode";
});

deleteChatButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all the chats?")) {
        localStorage.removeItem("saved-chats");
        localStorage.removeItem("conversation-history");
        localStorage.removeItem("hideFollowUps"); 
        conversationHistory = [];
        loadDataFromLocalstorage();
    }
});

suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});

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
    if (typingInput.value.length === 0 && !isResponseGenerating) {
        inputWrapper.classList.remove("expanded");
        actionButtons.classList.remove("hide");
    }
});

typingInput.addEventListener("input", () => {
    if (typingInput.value.length > 0) {
        inputWrapper.classList.add("expanded");
        actionButtons.classList.add("hide");
    }
});

let windowHeight = window.innerHeight;
window.addEventListener('resize', () => {
    if (window.innerHeight > windowHeight) {
        if (typingInput.value.length === 0) {
            inputWrapper.classList.remove("expanded");
            actionButtons.classList.remove("hide");
        }
    }
    windowHeight = window.innerHeight;
});

window.addEventListener('popstate', (e) => {
    e.preventDefault();
    history.pushState(null, null, window.location.href);
});

if (window.navigator.userAgent.match(/Android/i)) {
    document.addEventListener('backbutton', (e) => {
        e.preventDefault();
    }, false);
}
