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
  FolderOpen,
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

  const buildTree = (flatData: ApiDataItem[]): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Sort by account code to ensure proper hierarchy
    const sortedData = [...flatData].sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    // Create all nodes first
    sortedData.forEach(item => {
      const node: TreeNode = {
        accountCode: item.accountCode,
        accountName: item.accountName,
        debit: item.debit,
        credit: item.credit,
        children: [],
        level: getAccountLevel(item.accountCode)
      };
      nodeMap.set(item.accountCode, node);
    });

    // Build hierarchy
    sortedData.forEach(item => {
      const node = nodeMap.get(item.accountCode)!;
      const parentCode = getParentAccountCode(item.accountCode);

      if (parentCode && nodeMap.has(parentCode)) {
        const parent = nodeMap.get(parentCode)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const getAccountLevel = (accountCode: string): number => {
    // Count non-zero digits to determine level
    const segments = accountCode.match(/.{1,2}/g) || [];
    let level = 0;
    for (const segment of segments) {
      if (parseInt(segment) !== 0) {
        level++;
      } else {
        break;
      }
    }
    return level;
  };

  const getParentAccountCode = (accountCode: string): string | null => {
    const segments = accountCode.match(/.{1,2}/g) || [];

    // Find the last non-zero segment
    let lastNonZeroIndex = -1;
    for (let i = segments.length - 1; i >= 0; i--) {
      if (parseInt(segments[i]) !== 0) {
        lastNonZeroIndex = i;
        break;
      }
    }

    if (lastNonZeroIndex <= 0) return null;

    // Create parent code by setting the last non-zero segment to 00
    const parentSegments = [...segments];
    parentSegments[lastNonZeroIndex] = '00';

    return parentSegments.join('');
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

  const renderTreeNode = (node: TreeNode): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const netBalance = node.debit - node.credit;

    return (
      <TreeItem
        key={node.accountCode}
        itemId={node.accountCode}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5, pr: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {hasChildren ? (
                <FolderOpen sx={{ mr: 1, color: 'primary.main' }} />
              ) : (
                <AccountBox sx={{ mr: 1, color: 'text.secondary' }} />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: hasChildren ? 'bold' : 'medium',
                    fontFamily: 'monospace',
                    color: hasChildren ? 'primary.main' : 'text.primary'
                  }}
                >
                  {node.accountCode}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: 'block',
                    fontSize: '0.75rem'
                  }}
                >
                  {node.accountName || 'Hesap adı bulunamadı'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, minWidth: 400 }}>
              <Typography
                variant="body2"
                sx={{
                  minWidth: 100,
                  textAlign: 'right',
                  color: node.debit > 0 ? 'error.main' : 'text.secondary',
                  fontWeight: node.debit > 0 ? 'medium' : 'normal'
                }}
              >
                {node.debit > 0 ? formatCurrency(node.debit) : '-'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  minWidth: 100,
                  textAlign: 'right',
                  color: node.credit > 0 ? 'success.main' : 'text.secondary',
                  fontWeight: node.credit > 0 ? 'medium' : 'normal'
                }}
              >
                {node.credit > 0 ? formatCurrency(node.credit) : '-'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  minWidth: 120,
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: netBalance > 0 ? 'error.main' :
                         netBalance < 0 ? 'success.main' : 'text.primary'
                }}
              >
                {formatCurrency(netBalance)}
              </Typography>
            </Box>
          </Box>
        }
      >
        {node.children.map(child => renderTreeNode(child))}
      </TreeItem>
    );
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
    let totalAccounts = flatData.length;

    flatData.forEach(item => {
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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ flex: 1, fontWeight: 'bold' }}>
              Hesap Kodu ve Adı
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, minWidth: 400 }}>
              <Typography variant="body2" sx={{ minWidth: 100, textAlign: 'right', fontWeight: 'bold' }}>
                Borç (₺)
              </Typography>
              <Typography variant="body2" sx={{ minWidth: 100, textAlign: 'right', fontWeight: 'bold' }}>
                Alacak (₺)
              </Typography>
              <Typography variant="body2" sx={{ minWidth: 120, textAlign: 'right', fontWeight: 'bold' }}>
                Net Bakiye (₺)
              </Typography>
            </Box>
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