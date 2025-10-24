# Decision Log

This document records the key decisions made during the development of the PMP Exam Preparation web page.

## Context
The goal is to build a static, responsive web page for PMP exam practice. The key requirement is a serverless "incorrect answer note" feature using the user's Google Drive for storage. The application will be deployed on GitHub Pages.

## Decisions Made

| # | Decision | Rationale |
|---|---|---|
| 1 | **Technology Stack** | **Vanilla HTML, CSS, and JavaScript (ES6+).** No frameworks (React, Vue, etc.). |
| | | - **Simplicity:** Eliminates the need for a build step (like webpack or npm), which is ideal for a simple static site. <br> - **Deployment:** Directly compatible with GitHub Pages without any complex configuration. <br> - **Performance:** Lightweight and fast-loading. |
| 2 | **Data Handling (Questions)** | **Use Papaparse.js library** to fetch and parse the `pmp_engko_final_0.2.csv` file directly in the browser. |
| | | - Avoids manual CSV parsing, which can be error-prone. <br> - Efficiently converts the CSV data into a usable JavaScript array of objects. |
| 3 | **Data Handling (User Notes)** | **Use Google Identity Services (GIS) and Google Drive API (gapi).** Store notes in a single `incorrect_notes.json` file within the user's private **App Data folder**. |
| | | - Fulfills the serverless requirement. <br> - **Privacy:** The App Data folder is sandboxed and only accessible by this application, protecting user privacy. <br> - **Simplicity:** Managing a single JSON file is simpler than dealing with multiple files or a more complex data structure. |

## Next Steps

1.  **Create Basic Structure:** Set up the initial `index.html`, `style.css`, and `script.js` files.
2.  **Implement UI:** Build the basic layout for the quiz display, including areas for the question, options, and feedback.
3.  **Load and Display Questions:** Implement the JavaScript logic to load the CSV data using Papaparse and display the first question on the page.
