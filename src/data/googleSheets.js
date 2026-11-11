
export async function fetchSpreadsheetData(idToken) {
    if (!idToken) {
        throw new Error('Google ID token is missing.');
    }

    // Send the Google ID token to our backend.
    const response = await fetch('/api/records', {
        method: 'POST',

        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        }
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error || 'Failed to retrieve spreadsheet records.'
        );
    }

    if (!Array.isArray(result.records)) {
        throw new Error('Invalid response received from the backend.');
    }

    return result.records;
}
