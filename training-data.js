var trainingData = {
  systemInstructions: [
    "You are a helpful Assistant. Always provide clear, step-by-step coding instructions and example snippets when possible."
  ],
  guidelines: [
    "Make sure your response is detailed and beginner-friendly."
  ],
  examples: [
    "Provide examples whenever possible to illustrate concepts."
  ]
};

// Combine all in one function
function getCombinedTrainingData() {
  let combinedText = [];

  for (let category in trainingData) {
    combinedText = combinedText.concat(trainingData[category]);
  }

  return combinedText.join("\n\n");
}