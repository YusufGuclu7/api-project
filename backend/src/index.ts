import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import cron from 'node-cron';
import ApiService from './services/apiService';
import databaseService from './services/databaseService';
import dataController from './controllers/dataController';

// Configure environment variables
const envPath = path.join(__dirname, '../.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('Environment variables loaded successfully');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://api-project-frontend.vercel.app',  // Vercel frontend URL'ini buraya yazacaksın
    /\.vercel\.app$/  // Tüm Vercel app'lerini kabul et
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/api/data', dataController);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Scheduled data sync - runs every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('Starting scheduled data sync...');
    const apiService = new ApiService();
    const apiData = await apiService.fetchData();
    await databaseService.syncData(apiData);
    console.log('Scheduled data sync completed');
  } catch (error) {
    console.error('Error during scheduled sync:', error);
  }
});

// Manual data sync on startup
async function initialSync() {
  try {
    console.log('Performing initial data sync...');
    const apiService = new ApiService();
    const apiData = await apiService.fetchData();
    await databaseService.syncData(apiData);
    console.log('Initial data sync completed');
  } catch (error) {
    console.error('Error during initial sync:', error);
    console.log('Continuing without initial sync - manual sync can be triggered via API');
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Perform initial sync
  await initialSync();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await databaseService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await databaseService.disconnect();
  process.exit(0);
});