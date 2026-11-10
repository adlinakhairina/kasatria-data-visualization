
import './style.css';
import { getGoogleAccessToken } from './auth/googleAuth.js';
import { fetchSpreadsheetData } from './data/googleSheets.js';
import { initializeVisualization } from './visualization/layouts.js';

const loginButton = document.getElementById('google-login-btn');
const statusMessage = document.getElementById('status-message');
const visualizationSection = document.getElementById('visualization-section');
const recordCount = document.getElementById('record-count');

loginButton.addEventListener('click', async () => {
    try {
        loginButton.disabled = true;
        statusMessage.textContent = 'Connecting to Google...';

        // Step 1: Authenticate with Google.
        const accessToken = await getGoogleAccessToken();

        // Step 2: Retrieve Google Sheets records.
        statusMessage.textContent = 'Retrieving Google Sheets data...';

        const records = await fetchSpreadsheetData(accessToken);

        console.log('Spreadsheet data retrieved successfully!');
        console.log('Total records:', records.length);
        console.table(records.slice(0, 5));

        // Step 3: Display the visualization section.
        visualizationSection.hidden = false;
        recordCount.textContent = `${records.length} records loaded successfully.`;

        const container = document.getElementById('visualization-container');

        // Step 4: Initialize the visualization after the browser updates the layout.
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

        // Step 5: Update the UI after successful initialization.
        statusMessage.textContent = 'Google Sheets data loaded successfully!';
        loginButton.textContent = 'Connected to Google';

        window.spreadsheetRecords = records;

    } catch (error) {
        console.error('Application error:', error);

        statusMessage.textContent = `Error: ${error.message}`;

        visualizationSection.hidden = true;
        loginButton.disabled = false;
    }
});
