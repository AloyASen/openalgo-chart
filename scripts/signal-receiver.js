import mqtt from 'mqtt';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import config from '../signal-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure log directory exists
const logDir = path.resolve(__dirname, '..', config.logPath);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// --- MQTT Client ---
console.log(`Connecting to MQTT Broker at ${config.mqttBroker}...`);
const client = mqtt.connect(config.mqttBroker);

client.on('connect', () => {
    console.log('Connected to MQTT Broker');
    client.subscribe(config.topics, (err) => {
        if (!err) {
            console.log(`Subscribed to topics: ${config.topics.join(', ')}`);
        } else {
            console.error('Subscription error:', err);
        }
    });
});

client.on('message', (topic, message) => {
    try {
        const msgStr = message.toString();
        // console.log(`Received: ${topic} -> ${msgStr}`);

        let payload;
        try {
            payload = JSON.parse(msgStr);
        } catch (e) {
            // If not JSON, wrapped it in a simple object
            payload = { raw: msgStr };
        }

        // Enriched payload
        const signalData = {
            topic,
            receivedAt: new Date().toISOString(),
            ...payload
        };

        // Date-based filename: YYYY-MM-DD.jsonl
        const dateStr = new Date().toISOString().split('T')[0];
        const logFile = path.join(logDir, `${dateStr}.jsonl`);

        // Append line
        fs.appendFile(logFile, JSON.stringify(signalData) + '\n', (err) => {
            if (err) console.error('Error logging signal:', err);
        });

    } catch (err) {
        console.error('Error processing message:', err);
    }
});

client.on('error', (err) => {
    console.error('MQTT Error:', err);
});


// --- Express API Server ---
const app = express();
app.use(cors());

// API to get signals
// Query params: ?symbol=XYZ&date=YYYY-MM-DD
app.get('/api/signals', (req, res) => {
    const symbol = req.query.symbol;
    const dateQuery = req.query.date || new Date().toISOString().split('T')[0]; // Default to today

    if (!symbol) {
        return res.status(400).json({ error: 'Symbol query parameter is required' });
    }

    const logFile = path.join(logDir, `${dateQuery}.jsonl`);

    if (!fs.existsSync(logFile)) {
        return res.json([]); // No logs for this date
    }

    const signals = [];
    const fileStream = fs.createReadStream(logFile);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    rl.on('line', (line) => {
        if (!line.trim()) return;
        try {
            const data = JSON.parse(line);
            // Check if symbol matches (in topic or in payload)
            // Flexible matching: check 'symbol' field, or if topic contains symbol
            const matched = (data.symbol && data.symbol === symbol) ||
                (data.topic && data.topic.includes(symbol));

            if (matched) {
                // Determine signal type (BUY/SELL)
                // Adjust this logic based on actual payload structure
                let type = 'UNKNOWN';
                if (data.signal) type = data.signal.toUpperCase();
                else if (data.type) type = data.type.toUpperCase();
                else if (JSON.stringify(data).toUpperCase().includes('BUY')) type = 'BUY';
                else if (JSON.stringify(data).toUpperCase().includes('SELL')) type = 'SELL';

                signals.push({
                    time: data.receivedAt, // or data.timestamp
                    type: type,
                    price: data.price,
                    original: data
                });
            }
        } catch (e) {
            // Ignore bad lines
        }
    });

    rl.on('close', () => {
        res.json(signals);
    });
});

app.listen(config.serverPort, () => {
    console.log(`Signal API Server running on port ${config.serverPort}`);
    console.log(`Log path: ${logDir}`);
});
