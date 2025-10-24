# Product Requirements Document (PRD)

## 1. Introduction
This document outlines the product requirements for the PMP Exam Preparation Web Page. The goal of this project is to create a static, responsive web page that helps users study for the PMP exam using a provided CSV file of questions. The key feature is an "incorrect answer note" functionality that leverages the user's Google Drive for data storage, **eliminating the need for a dedicated backend server.**

## 2. User Stories
- **As a user,** I want to view PMP exam questions in both English and Korean on any device (mobile or PC).
- **As a user,** I want to select an answer from a list of options and submit it to see if I am correct.
- **As a user,** when I answer incorrectly, I want to see a detailed explanation for the question to help me learn.
- **As a user,** I want to log in with my Google account to save my incorrect answers.
- **As a user,** I want to be able to review all my previously saved incorrect answers.
- **As a user,** I want to retake a quiz consisting only of the questions I have saved in my incorrect answer notes.
- **As a user,** I want to delete specific questions from my incorrect answer notes once I have mastered them.

## 3. Features
### 3.1. Quiz Interface
- Display one question at a time.
- Show the question in both English and Korean.
- Provide multiple-choice options for the answer.
- A "Submit" button to check the answer.

### 3.2. Answering and Feedback
- Upon submission, the interface will indicate whether the chosen answer is correct or incorrect.
- If incorrect, the correct answer and a detailed explanation will be displayed below the question.

### 3.3. Incorrect Answer Notes (via Google Drive)
- **Google Account Integration:** Users can log in using their Google account.
- **Data Storage:** Incorrectly answered questions will be saved to a single JSON file in the user's Google Drive App Data folder.
- **View Notes:** A separate view will be available for users to see all their saved incorrect answers.
- **Retake Incorrect Questions:** A feature will be available to start a new quiz session populated only with questions from the user's notes.
- **Delete Notes:** Each question in the incorrect answer notes view will have an option to be deleted individually.

### 3.4. Responsiveness
- The web page layout will adapt to different screen sizes, ensuring a seamless experience on both mobile and desktop devices.

## 4. Out of Scope
- User management beyond Google Sign-In.
- Support for other cloud storage providers.
- Real-time features or collaboration.
- Offline mode.
