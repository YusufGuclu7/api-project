import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  SimpleTreeView,
  TreeItem,
} from '@mui/x-tree-view';
import {
  ExpandMore,
  ChevronRight,
  AccountBalance as AccountBalanceIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBox,
} from '@mui/icons-material';
import { ApiDataItem } from '../types';
import { apiService } from '../services/apiService';

interface TreeNode {
  accountCode: string;
  accountName?: string;
  debit: number;
  credit: number;
  children: TreeNode[];
  level: number;
}

const HierarchicalView: React.FC = () => {
  const [flatData, setFlatData] = useState<ApiDataItem[]>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const flat = await apiService.getAllData();
      console.log('Fetched flat data:', flat);
      setFlatData(flat);

      // Convert flat data to tree structure
      const tree = buildTree(flat);
      setTreeData(tree);
    } catch (err) {
      setError('Backend bağlantısı kurulamadı. Lütfen backend sunucusunun çalıştığından emin olun.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData(false);
  };

  const getMainAccountCode = (accountCode: string): string | null => {
    // 120.01.0001 -> 120.01
    // 100.01.00001001 -> 100.01
    const match = accountCode.match(/^(\d{3}\.\d{2})/);
    return match ? match[1] : null;
  };

  const getMainAccountName = (mainAccountCode: string): string => {
    // Ana hesap ismini bul
    if (mainAccountCode === '120.01') return 'ALICILAR';
    if (mainAccountCode === '100.01') return 'KASA';
    if (mainAccountCode === '100.02') return 'BANKA';
    if (mainAccountCode === '153.01') return 'TİCARİ MALLAR';
    if (mainAccountCode === '191.01') return 'İNDİRİLECEK KDV';
    if (mainAccountCode === '191.02') return 'İNDİRİLECEK KDV TEVKİFATI';
    if (mainAccountCode === '191.03') return 'İNDİRİLECEK İADE KDV';
    if (mainAccountCode === '320.01') return 'SATICILAR';
    if (mainAccountCode === '360.02') return 'ÖDENECEK TİCARİ VERGİLER';
    if (mainAccountCode === '391.01') return 'HESAPLANAN KDV';
    if (mainAccountCode === '391.02') return 'HESAPLANAN KDV TEVKİFATI';
    if (mainAccountCode === '391.03') return 'HESAPLANAN İADE KDV';
    if (mainAccountCode === '600.01') return 'YURTİÇİ SATIŞLAR';
    if (mainAccountCode === '610.01') return 'SATIŞTAN İADELER';

    // Üst seviye hesaplar için
    if (mainAccountCode === '100') return 'KASA VE BANKA';
    if (mainAccountCode === '120') return 'TİCARİ ALACAKLAR';
    if (mainAccountCode === '153') return 'TİCARİ MALLAR';
    if (mainAccountCode === '191') return 'İNDİRİLECEK VERGİLER';
    if (mainAccountCode === '320') return 'TİCARİ BORÇLAR';
    if (mainAccountCode === '360') return 'ÖDENECEK VERGİLER';
    if (mainAccountCode === '391') return 'HESAPLANAN VERGİLER';
    if (mainAccountCode === '600') return 'SATIŞLAR';
    if (mainAccountCode === '610') return 'SATIŞTAN İADELER';

    return 'ANA HESAP';
  };

  const buildTree = (flatData: ApiDataItem[]): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    const allNodes: TreeNode[] = [];

    // Filter out invalid data (empty account codes)
    const validData = flatData.filter(item => item.accountCode && item.accountCode.trim() !== '');

    // Sort by account code
    const sortedData = [...validData].sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    // Create all nodes first
    sortedData.forEach(item => {
      const node: TreeNode = {
        accountCode: item.accountCode,
        accountName: item.accountName,
        debit: item.debit,
        credit: item.credit,
        children: [],
        level: getAccountDepth(item.accountCode)
      };
      nodeMap.set(item.accountCode, node);
      allNodes.push(node);
    });

    // Create missing parent nodes if needed (including grandparents)
    const missingParents = new Set<string>();
    allNodes.forEach(node => {
      let currentCode = node.accountCode;
      let parentCode = getParentCode(currentCode);

      // Keep going up the hierarchy to find all missing parents
      while (parentCode) {
        if (!nodeMap.has(parentCode)) {
          missingParents.add(parentCode);
        }
        currentCode = parentCode;
        parentCode = getParentCode(currentCode);
      }
    });

    // Add missing parent nodes
    missingParents.forEach(parentCode => {
      const parentNode: TreeNode = {
        accountCode: parentCode,
        accountName: getMainAccountName(parentCode),
        debit: 0,
        credit: 0,
        children: [],
        level: getAccountDepth(parentCode)
      };
      nodeMap.set(parentCode, parentNode);
      allNodes.push(parentNode);
    });

    // Build multiple levels of hierarchy
    const roots: TreeNode[] = [];

    allNodes.forEach(node => {
      const parentCode = getParentCode(node.accountCode);

      if (parentCode && nodeMap.has(parentCode)) {
        // Add to parent
        const parent = nodeMap.get(parentCode)!;
        parent.children.push(node);
      } else {
        // This is a root node
        roots.push(node);
      }
    });

    return roots;
  };

  const getAccountDepth = (accountCode: string): number => {
    // 100 = level 1
    // 100.01 = level 2
    // 100.01.00001001 = level 3
    const parts = accountCode.split('.');
    return parts.length;
  };

  const getParentCode = (accountCode: string): string | null => {
    const parts = accountCode.split('.');

    if (parts.length === 1) {
      // 100 -> no parent
      return null;
    } else if (parts.length === 2) {
      // 100.01 -> 100
      return parts[0];
    } else if (parts.length === 3) {
      // 100.01.00001001 -> 100.01
      return parts[0] + '.' + parts[1];
    }

    return null;
  };

  const handleToggle = (event: React.SyntheticEvent | null, itemIds: string[]) => {
    setExpanded(itemIds);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const calculateTotalDebit = (node: TreeNode): number => {
    let total = node.debit;
    node.children.forEach(child => {
      total += calculateTotalDebit(child);
    });
    return total;
  };

  const renderTreeNode = (node: TreeNode): React.ReactNode => {
    const hasChildren = node.children.length > 0;

    if (hasChildren) {
      // Ana hesap - sadece hesap kodu ve toplam borç göster
      const totalDebit = calculateTotalDebit(node);

      return (
        <TreeItem
          key={node.accountCode}
          itemId={node.accountCode}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5, justifyContent: 'space-between' }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  color: 'primary.main'
                }}
              >
                {node.accountCode}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 'bold',
                  color: 'error.main',
                  minWidth: 150,
                  textAlign: 'right'
                }}
              >
                {formatCurrency(totalDebit)}
              </Typography>
            </Box>
          }
        >
          {node.children.map(child => renderTreeNode(child))}
        </TreeItem>
      );
    } else {
      // Alt hesap - detaylı bilgileri göster
      const netBalance = node.debit - node.credit;

      return (
        <TreeItem
          key={node.accountCode}
          itemId={node.accountCode}
          label={
            <Box sx={{ display: 'flex', flexDirection: 'column', py: 1, pl: 2, backgroundColor: 'rgba(0,0,0,0.02)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBox sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'medium',
                    fontFamily: 'monospace',
                    color: 'text.primary'
                  }}
                >
                  {node.accountCode}
                </Typography>
              </Box>

              <Box sx={{ pl: 3, mb: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'medium', color: 'text.primary' }}
                >
                  {node.accountName || 'Şirket adı bulunamadı'}
                </Typography>
              </Box>

              <Box sx={{ pl: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Borç:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: node.debit > 0 ? 'error.main' : 'text.secondary',
                      fontWeight: node.debit > 0 ? 'medium' : 'normal'
                    }}
                  >
                    {node.debit > 0 ? formatCurrency(node.debit) : '-'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Alacak:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: node.credit > 0 ? 'success.main' : 'text.secondary',
                      fontWeight: node.credit > 0 ? 'medium' : 'normal'
                    }}
                  >
                    {node.credit > 0 ? formatCurrency(node.credit) : '-'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Net Bakiye:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 'bold',
                      color: netBalance > 0 ? 'error.main' :
                             netBalance < 0 ? 'success.main' : 'text.primary'
                    }}
                  >
                    {formatCurrency(netBalance)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          }
        />
      );
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Box display="flex" justifyContent="center" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" display="flex" alignItems="center" gap={1}>
            <AccountBalanceIcon />
            Hesap Kodu Raporlama
          </Typography>
          <IconButton onClick={handleRefresh} color="primary" sx={{ ml: 2 }}>
            <RefreshIcon />
          </IconButton>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
            Yeniden Dene
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  if (flatData.length === 0 && !loading) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Veri bulunamadı
      </Alert>
    );
  }

  const getTotalStats = () => {
    let totalDebit = 0;
    let totalCredit = 0;

    // Filter out invalid data (empty account codes) for accurate stats
    const validData = flatData.filter(item => item.accountCode && item.accountCode.trim() !== '');
    const totalAccounts = validData.length;

    validData.forEach(item => {
      totalDebit += item.debit;
      totalCredit += item.credit;
    });

    return { totalDebit, totalCredit, totalAccounts };
  };

  const stats = getTotalStats();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" display="flex" alignItems="center" gap={1}>
          <AccountBalanceIcon />
          Hesap Kodu Raporlama
        </Typography>
        <IconButton onClick={handleRefresh} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Özet Kartları */}
      <Box display="flex" gap={2} sx={{ mb: 4, flexWrap: 'wrap' }}>
        <Card elevation={2} sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" color="textSecondary">
                  Toplam Hesap
                </Typography>
                <Typography variant="h4">{stats.totalAccounts}</Typography>
              </Box>
              <AccountBalanceIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
        <Card elevation={2} sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" color="textSecondary">
                  Toplam Borç
                </Typography>
                <Typography variant="h4" color="error.main">
                  {formatCurrency(stats.totalDebit)}
                </Typography>
              </Box>
              <TrendingUpIcon color="error" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
        <Card elevation={2} sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" color="textSecondary">
                  Toplam Alacak
                </Typography>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(stats.totalCredit)}
                </Typography>
              </Box>
              <TrendingDownIcon color="success" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
        <Card elevation={2} sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" color="textSecondary">
                  Net Bakiye
                </Typography>
                <Typography
                  variant="h4"
                  color={stats.totalDebit - stats.totalCredit > 0 ? 'error.main' : 'success.main'}
                >
                  {formatCurrency(stats.totalDebit - stats.totalCredit)}
                </Typography>
              </Box>
              <TrendingUpIcon
                color={stats.totalDebit - stats.totalCredit > 0 ? 'error' : 'success'}
                sx={{ fontSize: 40 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Tree View Header */}
      <Paper elevation={2} sx={{ mb: 2 }}>
        <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Hesap Kodu
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', minWidth: 150, textAlign: 'right' }}>
              Toplam Borç (₺)
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Tree View */}
      <Paper elevation={2}>
        <SimpleTreeView
          aria-label="hesap hierarchy"
          slots={{
            collapseIcon: ExpandMore,
            expandIcon: ChevronRight,
          }}
          expandedItems={expanded}
          onExpandedItemsChange={handleToggle}
          sx={{ p: 2 }}
        >
          {treeData.map(node => renderTreeNode(node))}
        </SimpleTreeView>
      </Paper>
    </Box>
  );
};

export default HierarchicalView;