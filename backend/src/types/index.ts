export interface ApiToken {
  response: {
    token: string;
  };
  messages: Array<{
    code: string;
    message: string;
  }>;
}

export interface ApiDataResponse {
  response: {
    data?: Array<{
      fieldData: any;
      portalData: any;
      recordId: string;
      modId: string;
    }>;
    scriptResult?: string;
    scriptError?: string;
    modId?: string;
  };
  messages: Array<{
    code: string;
    message: string;
  }>;
}

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