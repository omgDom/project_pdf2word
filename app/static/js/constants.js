const APP_CONFIG = {
    DROPBOX_APP_KEY: 'your_dropbox_key',
    GOOGLE_CLIENT_ID: 'your_google_client_id',
    ALLOWED_FORMATS: ['pdf', 'docx', 'txt', 'html', 'rtf', 'odt'],
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    API_ENDPOINTS: {
        CONVERT: '/convert',
        FETCH_CLOUD: '/fetch-cloud-file',
        DETECT_LANGUAGE: '/detect-pdf-language'
    }
}; 