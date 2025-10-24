# Technical Requirements Document (TRD)

## 1. System Architecture
The application will be a **client-side only, single-page application (SPA)**. There will be **no backend server**, and all logic, including data processing and interaction with the Google Drive API, will be executed in the user's browser.

- **Frontend:** Static HTML, CSS, and JavaScript files.
- **Data Source:** The quiz questions will be loaded from the `pmp_engko_final_0.2.csv` file included in the project repository.
- **Data Storage:** User-specific data (incorrect answer notes) will be stored in the user's Google Drive App Data folder. The application will treat Google Drive as a simple file storage, not a database. All data manipulation will occur client-side.
- **Hosting:** The static files will be hosted on GitHub Pages.

## 2. Technology Stack
- **HTML5:** For the structure of the web page.
- **CSS3:** For styling, using Flexbox and Grid for responsive layouts. No external CSS framework will be used to keep the project lightweight.
- **JavaScript (ES6+):** Vanilla JavaScript will be used for all client-side logic.
  - **CSV Parsing:** A lightweight library like Papaparse will be used to parse the CSV data file directly in the browser.
  - **Google API Integration:**
    - **Google Identity Services (GIS) Library:** For handling "Sign in with Google" and obtaining OAuth 2.0 access tokens.
    - **Google APIs Client Library for JavaScript (gapi):** To make file I/O requests to the Google Drive API.

## 3. Feature Implementation Details

### 3.1. CSV Data Loading
- On page load, the application will use the Fetch API to retrieve `pmp_engko_final_0.2.csv`.
- The CSV data will be parsed into a JavaScript array of objects using Papaparse.

### 3.2. Quiz Engine
- A state management object in JavaScript will track the current quiz state (e.g., question index, score).
- The UI will be dynamically updated using DOM manipulation.

### 3.3. Google Drive Integration for Incorrect Answer Notes
The core principle is to perform all data manipulation in the browser. Google Drive is only used for persistence of a single JSON file (`incorrect_notes.json`).

- **Authentication:**
  - Request the `https://www.googleapis.com/auth/drive.appdata` scope to limit access to the app's hidden data folder.
- **File Management:**
  - The application will manage a single JSON file named `incorrect_notes.json`.
- **Saving a note:**
  1. Fetch the entire `incorrect_notes.json` file from Google Drive.
  2. Parse the JSON into a JavaScript array.
  3. Add the new incorrect answer object to the array.
  4. Serialize the array back to a JSON string.
  5. Upload the entire updated JSON string, overwriting the existing file in Google Drive.
- **Viewing notes:**
  1. Fetch and parse `incorrect_notes.json`.
  2. Render the data as a list in the UI.
- **Deleting a note:**
  1. This is a client-side array manipulation. The UI will trigger a function with the unique ID of the question to be deleted.
  2. The application will fetch the `incorrect_notes.json` file, parse it, and filter out the object with the matching ID from the array.
  3. The resulting smaller array will be serialized and uploaded, overwriting the file in Google Drive.
- **Retaking incorrect questions:**
  1. This will also be managed client-side. When the user starts a retake quiz:
  2. The application will fetch the `incorrect_notes.json` file.
  3. The parsed array of question objects will be used as the data source for the quiz engine, instead of the main CSV data.

## 4. Deployment
- The project will be hosted on GitHub Pages, serving files from the `main` branch.

## 5. Security Considerations
- The Google Client ID will be public. The "Authorized JavaScript origins" in the Google Cloud Console must be restricted to the GitHub Pages URL to prevent misuse.
