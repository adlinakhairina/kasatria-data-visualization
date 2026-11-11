
import './style.css';
import { initializeGoogleSignIn } from './auth/googleAuth.js';
import { fetchSpreadsheetData } from './data/googleSheets.js';
import { initializeVisualization } from './visualization/layouts.js';

const statusMessage = document.getElementById('status-message');
const visualizationSection = document.getElementById('visualization-section');
const recordCount = document.getElementById('record-count');

async function handleGoogleSignIn(idToken) {
    try {
        statusMessage.textContent = 'Verifying access and retrieving data...';

        // Step 1: Send the ID token to our backend.
        const records = await fetchSpreadsheetData(idToken);

        console.log('Spreadsheet data retrieved successfully!');
        console.log('Total records:', records.length);
        console.table(records.slice(0, 5));

        // Step 2: Display the visualization section.
        visualizationSection.hidden = false;
        recordCount.textContent = `${records.length} records loaded successfully.`;

        const container = document.getElementById('visualization-container');

        // Step 3: Initialize the visualization after the browser updates the layout.
        await new Promise((resolve, reject) => {
            requestAnimationFrame(() => {
                try {
                    console.log('Container dimensions:', {
                        width: container.clientWidth,
                        height: container.clientHeight
                    });

                    initializeVisualization(records, container);

                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });

        // Step 4: Update the UI after successful initialization.
        statusMessage.textContent = 'Google Sheets data loaded successfully!';

        window.spreadsheetRecords = records;

    } catch (error) {
        console.error('Application error:', error);

        statusMessage.textContent = `Error: ${error.message}`;

        visualizationSection.hidden = true;
    }
}

function handleGoogleSignInError(error) {
    console.error('Google sign-in error:', error);

    statusMessage.textContent = `Sign-in error: ${error.message}`;
}

// Initialize Google's official sign-in button.
initializeGoogleSignIn(
    handleGoogleSignIn,
    handleGoogleSignInError
).catch(error => {
    console.error('Google initialization error:', error);

    statusMessage.textContent = `Error: ${error.message}`;
});
