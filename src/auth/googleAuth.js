function waitForGoogleIdentityServices() {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        const timer = setInterval(() => {
            if (window.google?.accounts?.oauth2) {
                clearInterval(timer);
                resolve();
                return;
            }

            attempts++;

            if (attempts >= 100) {
                clearInterval(timer);
                reject(new Error('Google Identity Services failed to load. Please refresh the page.'));
            }
        }, 50);
    });
}

export async function getGoogleAccessToken() {
    await waitForGoogleIdentityServices();

    return new Promise((resolve, reject) => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!clientId) {
            reject(new Error('Google Client ID is missing. Please check your .env file.'));
            return;
        }

        const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,

            scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',

            callback: (response) => {
                if (response.error) {
                    reject(new Error(response.error_description || response.error));
                    return;
                }

                if (!response.access_token) {
                    reject(new Error('Google did not return an access token.'));
                    return;
                }

                resolve(response.access_token);
            },

            error_callback: (error) => {
                reject(new Error(error.message || 'Google authentication was cancelled.'));
            }
        });

        tokenClient.requestAccessToken();
    });
}