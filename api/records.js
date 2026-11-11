
import { OAuth2Client, GoogleAuth } from 'google-auth-library';

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

function processSpreadsheetRows(rows) {
    if (!rows || rows.length < 2) {
        throw new Error('No spreadsheet records were found.');
    }

    const headers = rows[0].map(header =>
        String(header).trim().toLowerCase()
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
            throw new Error(`Missing required column: ${header}`);
        }
    }

    const records = rows.slice(1)
        .map((row, index) => {
            const record = {};

            headers.forEach((header, columnIndex) => {
                record[header] = row[columnIndex] || '';
            });

            if (!String(record.name).trim()) {
                return null;
            }

            const ageText = String(record.age).trim();
            const age = Number(ageText);

            if (!ageText || !Number.isInteger(age) || age <= 0) {
                throw new Error(
                    `Invalid age for "${record.name}" at row ${index + 2}.`
                );
            }

            const netWorthText = String(record['net worth']).trim();
            const netWorth = Number(
                netWorthText.replace(/[^0-9.-]/g, '')
            );

            if (
                !netWorthText ||
                !Number.isFinite(netWorth) ||
                netWorth < 0
            ) {
                throw new Error(
                    `Invalid Net Worth for "${record.name}" at row ${index + 2}.`
                );
            }

            return {
                name: String(record.name).trim(),
                photo: String(record.photo).trim(),
                age,
                country: String(record.country).trim(),
                interest: String(record.interest).trim(),
                netWorth
            };
        })
        .filter(record => record !== null);

    return records;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed.'
        });
    }

    try {
        // Step 1: Check required environment variables.
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const encodedCredentials =
            process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;

        if (!clientId || !spreadsheetId || !encodedCredentials) {
            throw new Error('Backend environment configuration is incomplete.');
        }

        // Step 2: Extract the Google ID token.
        const authorization = req.headers.authorization;

        if (!authorization?.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Google sign-in is required.'
            });
        }

        const idToken = authorization.slice(7);

        // Step 3: Verify the Google ID token.
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: clientId
        });

        const payload = ticket.getPayload();

        if (!payload?.email || payload.email_verified !== true) {
            return res.status(403).json({
                error: 'A verified Google email address is required.'
            });
        }

        // Step 4: Check the permitted email domains.
        const email = payload.email.toLowerCase();

        const allowedDomains = [
            'kasatria.com',
            'gmail.com'
        ];

        const emailDomain = email.split('@')[1];

        if (!allowedDomains.includes(emailDomain)) {
            return res.status(403).json({
                error: 'Your email address is not authorised.'
            });
        }

        // Step 5: Authenticate the service account.
        const credentials = JSON.parse(
            Buffer.from(encodedCredentials, 'base64').toString('utf8')
        );

        const googleAuth = new GoogleAuth({
            credentials,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets.readonly'
            ]
        });

        const authClient = await googleAuth.getClient();
        const accessToken = await authClient.getAccessToken();

        if (!accessToken.token) {
            throw new Error('Unable to authenticate the service account.');
        }

        // Step 6: Retrieve Google Sheets data.
        const range = 'A:F';

        const sheetUrl =
            `https://sheets.googleapis.com/v4/spreadsheets/` +
            `${spreadsheetId}/values/${encodeURIComponent(range)}`;

        const sheetResponse = await fetch(sheetUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken.token}`
            }
        });

        if (!sheetResponse.ok) {
            console.error(
                'Google Sheets API error:',
                sheetResponse.status
            );

            throw new Error('Unable to retrieve Google Sheets data.');
        }

        const sheetData = await sheetResponse.json();

        // Step 7: Process the spreadsheet records.
        const records = processSpreadsheetRows(sheetData.values);

        console.log(
            `Successfully retrieved ${records.length} records.`
        );

        return res.status(200).json({ records });

    } catch (error) {
        console.error('Records API error:', error);

        return res.status(500).json({
            error: 'Unable to retrieve records. Please try again.'
        });
    }
}