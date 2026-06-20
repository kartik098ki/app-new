import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  configure,
  checkPNRStatus,
  getTrainInfo,
  trackTrain,
  searchTrainBetweenStations,
  liveAtStation
} from 'railkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Initialize RailKit with API key
configure('irctc_9e427ab26f99aec8c0ade68a833c3101bfdb43dde123ff9b');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from parent directory where assets and frontend files reside
app.use(express.static(path.join(__dirname, '..')));

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────

// GET /api/pnr/:pnrNumber — Check PNR status
app.get('/api/pnr/:pnrNumber', async (req, res) => {
  try {
    const { pnrNumber } = req.params;
    const data = await checkPNRStatus(pnrNumber);
    res.json({ success: true, data });
  } catch (error) {
    console.error('PNR Status Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch PNR status',
    });
  }
});

// GET /api/train-info/:trainNumber — Get train information
app.get('/api/train-info/:trainNumber', async (req, res) => {
  try {
    const { trainNumber } = req.params;
    const data = await getTrainInfo(trainNumber);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Train Info Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch train information',
    });
  }
});

// GET /api/track-train/:trainNumber/:date — Track a running train
app.get('/api/track-train/:trainNumber/:date', async (req, res) => {
  try {
    const { trainNumber, date } = req.params;
    const data = await trackTrain(trainNumber, date);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Track Train Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to track train',
    });
  }
});

// GET /api/search-trains/:from/:to — Search trains between stations
app.get('/api/search-trains/:from/:to', async (req, res) => {
  try {
    const { from, to } = req.params;
    const data = await searchTrainBetweenStations(from, to);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Search Trains Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search trains between stations',
    });
  }
});

// GET /api/live-station/:stnCode — Get live station data
app.get('/api/live-station/:stnCode', async (req, res) => {
  try {
    const { stnCode } = req.params;
    const data = await liveAtStation(stnCode);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Live Station Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch live station data',
    });
  }
});

// ──────────────────────────────────────────────
// Fallback — serve index.html for SPA routing
// ──────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ──────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚆 RailQuick server running at http://localhost:${PORT}`);
});
