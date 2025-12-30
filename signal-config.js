export default {
    // MQTT broker URL. Prefer setting `MQTT_BROKER` in the environment for remote hosts.
    // Examples: tcp://host:1883  or ws://host:9001 (for MQTT over WebSockets)
    mqttBroker: process.env.MQTT_BROKER || 'tcp://localhost:1883',
    serverPort: 3001,
    topics: ['signals/#', 'trading/#'], // Subscribe to signal related topics. Use '#' for everything.
    logPath: './mqtt_signals', // Directory to store signal logs
    // webSocketPort: 8080 // Optional: If we want to forward signals to frontend via WS later
    // Chart specific configuration used by the frontend dev server/proxy
    chart: {
        // host/ip address for the chart backend (used by vite proxy targets).
        // Prefer setting `OPENALGO_SERVER_HOST` and `OPENALGO_SERVER_PORT` in env.
        serverHost: process.env.OPENALGO_SERVER_HOST || 'upright-dog-rapidly.ngrok-free.app',
        // backend API port the chart frontend should proxy API requests to
        serverPort: process.env.OPENALGO_SERVER_PORT || 8080,
        // optional websocket port the chart frontend should proxy to
        webSocketPort: process.env.OPENALGO_WS_PORT || 8765,
        // API key used by the chart/backend API requests. Always prefer environment
        // variables (`OPENALGO_API_KEY` or `API_KEY`). Do NOT commit real keys.
        apiKey: process.env.OPENALGO_API_KEY || process.env.API_KEY || 'REPLACE_WITH_API_KEY',
    }
};
