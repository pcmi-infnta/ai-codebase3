export async function generateAPIResponse(
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
    showFadeInEffect
) {
    const textElement = incomingMessageDiv.querySelector(".text");

    if (isInappropriateContent(userMessage)) {
        textElement.textContent = ""; 
        isResponseGenerating = false;  
        incomingMessageDiv.classList.remove("loading");

        conversationHistory.push({
            id: "msg-" + conversationHistory.length,
            role: "assistant",
            content: textElement.textContent
        });
        localStorage.setItem("conversation-history", JSON.stringify(conversationHistory));

        return;
    }

    const combinedPrompt = getCombinedTrainingData() + "\n\nUser: " + userMessage;

    const messagesPayload = conversationHistory.map((msg, i) => ({
        id: "msg-" + i,
        role: msg.role,
        content: msg.content
    }));

    messagesPayload.push({
        id: "msg-" + messagesPayload.length,
        role: "user",
        content: combinedPrompt
    });

    const payload = {
        messages: messagesPayload,
        repositories: [{ remote: "github", repository: REPOSITORY_NAME, branch: "main" }]
    };

    console.log(JSON.stringify(payload)); 

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

        console.log("Raw API Response:", data);

        if (!response.ok) throw new Error(data.error.message);

        const apiResponse = data.message;
        conversationHistory.push({
            id: "msg-" + conversationHistory.length,
            role: "assistant",
            content: apiResponse
        });

        localStorage.setItem("conversation-history", JSON.stringify(conversationHistory));

        textElement.textContent = '';
        showFadeInEffect(apiResponse, textElement, incomingMessageDiv);

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
}