
const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;

// Retrieve spreadsheet data from Google Sheets API.
export async function fetchSpreadsheetData(accessToken) {
    if (!SPREADSHEET_ID) {
        throw new Error('Google Spreadsheet ID is missing. Please check your .env file.');
    }

    const range = 'A:F';

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to retrieve Google Sheets data.');
    }

    const result = await response.json();
    const rows = result.values;

    if (!rows || rows.length < 2) {
        throw new Error('No spreadsheet records were found.');
    }

    // Read and normalize the column headers.
    const headers = rows[0].map(header =>
        header.trim().toLowerCase()
    );

    const requiredHeaders = [
        'name',
        'photo',
        'age',
        'country',
        'interest',
        'net worth'
    ];

    for (const header of requiredHeaders) {
        if (!headers.includes(header)) {
            throw new Error(`Missing required spreadsheet column: ${header}`);
        }
    }

    // Convert spreadsheet rows into JavaScript objects.
    const records = rows.slice(1)
        .map((row, index) => {
            const record = {};

            headers.forEach((header, columnIndex) => {
                record[header] = row[columnIndex] || '';
            });

            // Skip rows without a name.
            if (!String(record.name).trim()) {
                return null;
            }

            // Convert Age into a number.
            const ageText = String(record.age).trim();
            const age = Number(ageText);

            if (!ageText || !Number.isInteger(age) || age <= 0) {
                throw new Error(
                    `Invalid age for "${record.name}" at spreadsheet row ${index + 2}.`
                );
            }

            // Convert Net Worth into a number.
            const netWorthText = String(record['net worth']).trim();
            const netWorth = Number(
                netWorthText.replace(/[^0-9.-]/g, '')
            );

            if (!netWorthText || !Number.isFinite(netWorth) || netWorth < 0) {
                throw new Error(
                    `Invalid Net Worth for "${record.name}" at spreadsheet row ${index + 2}.`
                );
            }

            return {
                name: String(record.name).trim(),
                photo: String(record.photo).trim(),
                age: age,
                country: String(record.country).trim(),
                interest: String(record.interest).trim(),
                netWorth: netWorth
            };
        })
        .filter(record => record !== null);

    return records;
}
