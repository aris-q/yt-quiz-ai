# YT Quiz AI

YT Quiz AI is a learning tool built for students and lifelong learners who want to actively test their understanding of YouTube videos. It automatically extracts a video's transcript and uses AI to generate a multiple-choice quiz, so you can verify what you learned immediately after watching. Every attempt is saved with your score and timestamp, letting you track improvement over time. A browser extension puts the quiz button directly inside YouTube's player, making it one click to go from watching to testing.

## Features

- **Automatic Quiz Generation**: Pulls the transcript from any YouTube video and generates multiple-choice questions that test understanding of the actual content.

- **AI-Powered Questions**: Uses a generative AI model to produce contextually accurate questions at configurable difficulty levels, with a correct-answer explanation for each.

- **YouTube Player Integration**: Injects a quiz button directly into YouTube's native video player so you can launch a quiz without leaving the page.

- **Attempt History and Scoring**: Records every quiz attempt per video, tracking your score, pass/fail status, and the time of each attempt.

- **Quiz Caching**: Stores generated quizzes so that returning to the same video reuses existing questions instantly instead of regenerating them.

- **Configurable Quiz Parameters**: Lets you set the number of questions and the difficulty level before a quiz is generated.

## Browser Extension

- Detects YouTube video pages and automatically injects a quiz button into the player controls.
- Extracts the video ID from the current page on click and routes you to the quiz application.
- Provides a popup accessible from the extension icon as an alternative way to start a quiz.
- Handles the handoff between YouTube and the quiz interface without requiring manual URL entry.

## Quiz Interface

- Presents questions one at a time to keep focus on a single prompt before moving forward.
- Shows a progress bar so you always know where you are within the quiz.
- Highlights your selection in green or red immediately after submission and shows the explanation for the correct answer.
- Tracks your running score throughout and displays a final summary with motivational feedback when you finish.
- Lets you retake a quiz from the summary screen without restarting the application.

## Attempt History

- Lists every previous attempt for the current video, including score and timestamp.
- Shows at a glance whether each attempt was a passing result.
- Persists across sessions so you can return days later and see your full history.
- Tied to your account so each user's history is tracked independently.
