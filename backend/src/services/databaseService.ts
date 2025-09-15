import { PrismaClient } from '@prisma/client';
import { ApiDataItem, GroupedData } from '../types';

const prisma = new PrismaClient();

class DatabaseService {
  async syncData(apiData: ApiDataItem[]): Promise<void> {
    try {
      console.log(`Syncing ${apiData.length} records to database...`);

      for (const item of apiData) {
        await prisma.apiData.upsert({
          where: {
            accountCode: item.accountCode
          },
          update: {
            accountName: item.accountName,
            debit: item.debit,
            credit: item.credit,
            updatedAt: new Date()
          },
          create: {
            accountCode: item.accountCode,
            accountName: item.accountName,
            debit: item.debit,
            credit: item.credit
          }
        });
      }

      console.log('Database sync completed successfully');
    } catch (error) {
      console.error('Error syncing data:', error);
      throw error;
    }
  }

  async getAllData(): Promise<ApiDataItem[]> {
    try {
      const data = await prisma.apiData.findMany({
        orderBy: {
          accountCode: 'asc'
        }
      });

      return data.map(item => ({
        accountCode: item.accountCode,
        accountName: item.accountName || undefined,
        debit: item.debit,
        credit: item.credit
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }

  async getGroupedData(): Promise<GroupedData> {
    try {
      const data = await this.getAllData();
      const grouped: GroupedData = { level1: {} };

      for (const item of data) {
        const code = item.accountCode;
        const level1Key = code.substring(0, 3);
        const level2Key = code.substring(0, 5);
        const level3Key = code;

        if (!grouped.level1[level1Key]) {
          grouped.level1[level1Key] = {
            code: level1Key,
            debit: 0,
            credit: 0,
            level2: {}
          };
        }

        if (!grouped.level1[level1Key].level2[level2Key]) {
          grouped.level1[level1Key].level2[level2Key] = {
            code: level2Key,
            debit: 0,
            credit: 0,
            level3: {}
          };
        }

        grouped.level1[level1Key].level2[level2Key].level3[level3Key] = {
          code: level3Key,
          accountName: item.accountName,
          debit: item.debit,
          credit: item.credit
        };

        grouped.level1[level1Key].debit += item.debit;
        grouped.level1[level1Key].credit += item.credit;
        grouped.level1[level1Key].level2[level2Key].debit += item.debit;
        grouped.level1[level1Key].level2[level2Key].credit += item.credit;
      }

      return grouped;
    } catch (error) {
      console.error('Error getting grouped data:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

export default new DatabaseService();