
function waitForGoogleIdentityServices() {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        const timer = setInterval(() => {
            if (window.google?.accounts?.id) {
                clearInterval(timer);
                resolve();
                return;
            }

            attempts++;

            if (attempts >= 100) {
                clearInterval(timer);
                reject(
                    new Error(
                        'Google Identity Services failed to load. Please refresh the page.'
                    )
                );
            }
        }, 50);
    });
}

export async function initializeGoogleSignIn(onSuccess, onError) {
    await waitForGoogleIdentityServices();

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
        throw new Error(
            'Google Client ID is missing. Please check your .env file.'
        );
    }

    const buttonContainer = document.getElementById('google-login-btn');

    if (!buttonContainer) {
        throw new Error('Google sign-in button container was not found.');
    }

    window.google.accounts.id.initialize({
        client_id: clientId,

        callback: (response) => {
            if (!response.credential) {
                onError(new Error('Google did not return an ID token.'));
                return;
            }

            onSuccess(response.credential);
        },

        auto_select: false,
        cancel_on_tap_outside: true
    });

    // Calculate the Google button width based on the available screen space.
    function renderGoogleButton() {
        const isMobile = window.matchMedia(
            '(max-width: 760px)'
        ).matches;

        const cardWidth = buttonContainer.parentElement.clientWidth;
        const horizontalSpacing = isMobile ? 48 : 112;

        const buttonWidth = Math.max(
            200,
            Math.min(300, cardWidth - horizontalSpacing)
        );

        // Clear the previous button before rendering a new one.
        buttonContainer.innerHTML = '';

        window.google.accounts.id.renderButton(buttonContainer, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            width: buttonWidth
        });
    }

    // Initial button rendering.
    renderGoogleButton();

    // Recalculate button width when the screen is resized or rotated.
    let resizeTimer;

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(() => {
            renderGoogleButton();
        }, 200);
    });
}
