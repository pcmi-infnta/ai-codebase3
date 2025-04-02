import { generateAPIResponse } from './generateAPIResponse.js';
import { getCombinedTrainingData } from './training-data.js';

let conversationHistory = [];
let userIsScrolling = false;
let areFollowUpsHidden = false; 
let userMessage = null;
let isResponseGenerating = false; 

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

const GREPTILE_API_KEY = "A1+sUJ/IzDKoKvl8L7/40JEmcTccnjSMlpwV31BqfvOv2M/8";
const GITHUB_TOKEN = "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";
const API_URL = "https://api.greptile.com/query";
const REPOSITORY_NAME = "pcmi-infnta/ai-codebase3";

const loadDataFromLocalstorage = () => {
    const savedChats = localStorage.getItem("saved-chats");
    const savedHistory = localStorage.getItem("conversation-history");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    if (savedHistory) {
        conversationHistory = JSON.parse(savedHistory);
    }

    chatContainer.innerHTML = savedChats || '';
    document.body.classList.toggle("hide-header", savedChats);

    chatContainer.scrollTo(0, chatContainer.scrollHeight); 
}

const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

function processAIResponse(responseText) {
    const marker = "***";
    if (responseText.startsWith(marker) && responseText.endsWith(marker)) {
        let innerText = responseText.substring(marker.length, responseText.length - marker.length).trim();
        responseText = `<div class="ai-code-snippet"><code>${innerText}</code></div>`;
    }
    return responseText;
}

const displaySuggestions = async (messageDiv, aiResponse) => {
    // Implementation to display suggestions
}

const showFadeInEffect = (text, textElement, incomingMessageDiv) => {
    const existingSuggestions = incomingMessageDiv.querySelector(".suggestions-container");
    if (existingSuggestions) {
        existingSuggestions.remove();
    }

    textElement.innerHTML = text;

    incomingMessageDiv.classList.add("fade-in");

    setTimeout(() => {
        incomingMessageDiv.classList.remove("fade-in");
    }, 700);  

    isResponseGenerating = false;
    incomingMessageDiv.querySelector(".icon").classList.remove("hide");
    localStorage.setItem("saved-chats", chatContainer.innerHTML);

    if (text.trim() !== "I'm sorry, I can't answer that.") {
        // Additional handling if necessary
    }

    if (!userIsScrolling) {
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
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
                      <div class="message-actions">
                        <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>
                        <span onClick="toggleFollowUps(this)" class="menu-icon icon material-symbols-rounded" style="display: none;">more_horiz</span>
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

const copyMessage = (copyButton) => {
    const messageContainer = copyButton.closest('.message-container');
    const messageText = messageContainer.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText).then(() => {
        copyButton.innerText = "done"; 
        setTimeout(() => copyButton.innerText = "content_copy", 1000); 
    }).catch(err => {
        console.error('Failed to copy text: ', err);
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

    conversationHistory.push({
        id: "msg-" + conversationHistory.length,
        role: "user",
        content: userMessage
    });

    const html = `<div class="message-content">
                <img class="avatar" src="images/avatars/user.gif" alt="User avatar">
                <div class="message-container">
                  <p class="text"></p>
                </div>
              </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
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