export interface ApiDataItem {
  accountCode: string;
  accountName?: string;
  debit: number;
  credit: number;
}

export interface GroupedData {
  level1: {
    [key: string]: {
      code: string;
      debit: number;
      credit: number;
      level2: {
        [key: string]: {
          code: string;
          debit: number;
          credit: number;
          level3: {
            [key: string]: {
              code: string;
              accountName?: string;
              debit: number;
              credit: number;
            };
          };
        };
      };
    };
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}