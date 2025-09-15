import axios from 'axios';
import https from 'https';
import { ApiToken, ApiDataResponse, ApiDataItem } from '../types';

class ApiService {
  private token: string | null = null;
  private tokenUrl: string;
  private dataUrl: string;
  private username: string;
  private password: string;

  private httpsAgent: https.Agent;

  constructor() {
    // Load from environment or use provided URLs
    this.tokenUrl = process.env.API_TOKEN_URL || 'https://efatura.etrsoft.com/fmi/data/v1/databases/testdb/sessions';
    this.dataUrl = process.env.API_DATA_URL || 'https://efatura.etrsoft.com/fmi/data/v1/databases/testdb/layouts/testdb/records';
    this.username = process.env.API_USERNAME || 'apitest';
    this.password = process.env.API_PASSWORD || 'test123';

    // Create HTTPS agent that ignores SSL certificate errors
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });

    console.log('API Service initialized:');
    console.log(`Token URL: ${this.tokenUrl}`);
    console.log(`Data URL: ${this.dataUrl}`);
    console.log(`Username: ${this.username}`);
  }

  private getBasicAuth(): string {
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    return `Basic ${credentials}`;
  }

  async getToken(): Promise<string> {
    try {
      if (!this.tokenUrl) {
        throw new Error('API_TOKEN_URL is not configured');
      }

      console.log('Getting API token...');
      const response = await axios.post<ApiToken>(
        this.tokenUrl,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.getBasicAuth()
          },
          httpsAgent: this.httpsAgent
        }
      );

      if (response.data.response?.token) {
        this.token = response.data.response.token;
        console.log('Token received successfully');
        return this.token;
      } else {
        throw new Error('Token not found in response');
      }
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  }

  async fetchData(): Promise<ApiDataItem[]> {
    try {
      if (!this.dataUrl) {
        throw new Error('API_DATA_URL is not configured');
      }

      if (!this.token) {
        await this.getToken();
      }

      console.log('Fetching data from API...');
      const response = await axios.get<ApiDataResponse>(
        this.dataUrl,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          httpsAgent: this.httpsAgent
        }
      );

      console.log('Full API response structure:', {
        hasScriptResult: !!response.data.response?.scriptResult,
        hasData: !!response.data.response?.data,
        dataLength: response.data.response?.data?.length || 0
      });

      // Check if we have script result (custom script data)
      if (response.data.response?.scriptResult) {
        const rawData = JSON.parse(response.data.response.scriptResult);
        console.log(`Fetched ${rawData.length} records from script result`);
        console.log('Sample script data:', rawData[0]);

        // Transform the data to match our expected format
        const data = rawData.map((item: any) => {
          const accountName = item.hesap_adi || item.firma_adi || item.sirket_adi || item.unvan || item.cari_adi || item.musteri_adi || item.tedarikci_adi || '';

          if (!accountName && item.hesap_kodu) {
            console.warn(`No company name found for account: ${item.hesap_kodu}`);
            console.warn('Available fields:', Object.keys(item));
          }

          return {
            accountCode: item.hesap_kodu,
            accountName: accountName,
            debit: parseFloat(item.borc) || 0,
            credit: parseFloat(item.alacak) || 0
          };
        });

        return data;
      }

      // Check if we have normal FileMaker data format
      else if (response.data.response?.data) {
        const rawData = response.data.response.data;
        console.log(`Fetched ${rawData.length} records from data array`);
        console.log('Sample raw data:', rawData[0]);

        // Check if the data is in the fieldData.data format (JSON string)
        if (rawData.length > 0 && rawData[0].fieldData?.data) {
          const jsonData = JSON.parse(rawData[0].fieldData.data);
          console.log(`Found ${jsonData.length} records in nested JSON data`);
          console.log('Sample nested data:', jsonData[0]);

          // Transform the nested JSON data
          const data = jsonData.map((item: any) => {
            const accountName = item.hesap_adi || item.firma_adi || item.sirket_adi || item.unvan || item.cari_adi || item.musteri_adi || item.tedarikci_adi || '';

            if (!accountName && item.hesap_kodu) {
              console.warn(`No company name found for account: ${item.hesap_kodu}`);
              console.warn('Available fields:', Object.keys(item));
            }

            return {
              accountCode: item.hesap_kodu || '',
              accountName: accountName,
              debit: parseFloat(item.borc) || 0,
              credit: parseFloat(item.alacak) || 0
            };
          });

          return data;
        }

        // Otherwise handle normal fieldData format
        else {
          // Transform the data to match our expected format
          const data = rawData.map((item: any) => {
            const fieldData = item.fieldData;
            const accountCode = fieldData.hesap_kodu || fieldData['hesap_kodu'] || '';
            const accountName = fieldData.hesap_adi || fieldData['hesap_adi'] ||
                               fieldData.firma_adi || fieldData['firma_adi'] ||
                               fieldData.sirket_adi || fieldData['sirket_adi'] ||
                               fieldData.unvan || fieldData['unvan'] ||
                               fieldData.cari_adi || fieldData['cari_adi'] ||
                               fieldData.musteri_adi || fieldData['musteri_adi'] ||
                               fieldData.tedarikci_adi || fieldData['tedarikci_adi'] || '';

            if (!accountName && accountCode) {
              console.warn(`No company name found for account: ${accountCode}`);
              console.warn('Available fieldData fields:', Object.keys(fieldData));
            }

            return {
              accountCode: accountCode,
              accountName: accountName,
              debit: parseFloat(fieldData.borc || fieldData['borc']) || 0,
              credit: parseFloat(fieldData.alacak || fieldData['alacak']) || 0
            };
          });

          return data;
        }
      }

      else {
        console.error('Full response:', JSON.stringify(response.data, null, 2));
        throw new Error('No data found in response');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        this.token = null;
        console.log('Token expired, getting new token...');
        return this.fetchData();
      }
      throw error;
    }
  }
}

export default ApiService;