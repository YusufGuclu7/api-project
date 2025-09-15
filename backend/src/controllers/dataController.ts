import { Router, Request, Response } from 'express';
import databaseService from '../services/databaseService';
import ApiService from '../services/apiService';

const router = Router();

// Get all data
router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await databaseService.getAllData();
    res.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get grouped data (hierarchical)
router.get('/grouped', async (req: Request, res: Response) => {
  try {
    const groupedData = await databaseService.getGroupedData();
    res.json({
      success: true,
      data: groupedData
    });
  } catch (error) {
    console.error('Error fetching grouped data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grouped data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manual sync from API
router.post('/sync', async (req: Request, res: Response) => {
  try {
    console.log('Manual sync requested - fetching data from external API');

    // Fetch data from external API
    const apiService = new ApiService();
    const apiData = await apiService.fetchData();

    // Sync to database
    await databaseService.syncData(apiData);

    res.json({
      success: true,
      message: 'Data synchronized successfully from external API',
      recordsProcessed: apiData.length
    });
  } catch (error) {
    console.error('Error during manual sync:', error);

    // If API fails, provide helpful error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({
      success: false,
      message: 'Error synchronizing data from external API',
      error: errorMessage,
      note: 'Check if API URLs are configured correctly in .env file'
    });
  }
});

// Test database connection
router.get('/test-db', async (req: Request, res: Response) => {
  try {
    // Add some test data first
    const testData = [
      { accountCode: '100.01.00001001', accountName: 'Test Kasa', debit: 1000, credit: 0 },
      { accountCode: '100.02.00002001', accountName: 'Test Banka', debit: 2000, credit: 500 }
    ];

    await databaseService.syncData(testData);
    const data = await databaseService.getAllData();

    res.json({
      success: true,
      message: 'Database connection working',
      recordCount: data.length,
      data: data
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug totals
router.get('/debug-totals', async (req: Request, res: Response) => {
  try {
    const data = await databaseService.getAllData();

    let totalDebit = 0;
    let totalCredit = 0;
    let recordsWithDebit = 0;
    let recordsWithCredit = 0;

    data.forEach(item => {
      if (item.debit > 0) {
        totalDebit += item.debit;
        recordsWithDebit++;
      }
      if (item.credit > 0) {
        totalCredit += item.credit;
        recordsWithCredit++;
      }
    });

    res.json({
      success: true,
      totalRecords: data.length,
      totalDebit: totalDebit,
      totalCredit: totalCredit,
      netBalance: totalDebit - totalCredit,
      recordsWithDebit: recordsWithDebit,
      recordsWithCredit: recordsWithCredit,
      sampleRecords: data.slice(0, 5).map(item => ({
        accountCode: item.accountCode,
        accountName: item.accountName,
        debit: item.debit,
        credit: item.credit
      }))
    });
  } catch (error) {
    console.error('Debug totals failed:', error);
    res.status(500).json({
      success: false,
      message: 'Debug totals failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;