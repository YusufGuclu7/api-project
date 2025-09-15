import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { ApiDataItem } from '../types';
import { apiService } from '../services/apiService';

const HierarchicalView: React.FC = () => {
  const [flatData, setFlatData] = useState<ApiDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const flat = await apiService.getAllData();
      console.log('Fetched flat data:', flat);
      setFlatData(flat);
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


  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

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

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>
                Hesap Kodu
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>
                Şirket/Hesap Adı
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>
                Borç (₺)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>
                Alacak (₺)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>
                Net Bakiye (₺)
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flatData.map((item) => (
              <TableRow
                key={item.accountCode}
                sx={{
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                  '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                }}
              >
                <TableCell sx={{ fontWeight: 'medium', fontFamily: 'monospace' }}>
                  {item.accountCode}
                </TableCell>
                <TableCell sx={{
                  maxWidth: 400,
                  fontSize: '0.9rem',
                  fontWeight: item.accountName ? 'normal' : 'italic',
                  color: item.accountName ? 'text.primary' : 'text.secondary'
                }}>
                  {item.accountName ? item.accountName : (
                    <span style={{ color: '#d32f2f', fontStyle: 'italic' }}>
                      Şirket adı bulunamadı
                    </span>
                  )}
                </TableCell>
                <TableCell align="right" sx={{
                  color: item.debit > 0 ? 'error.main' : 'text.secondary',
                  fontWeight: item.debit > 0 ? 'medium' : 'normal'
                }}>
                  {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                </TableCell>
                <TableCell align="right" sx={{
                  color: item.credit > 0 ? 'success.main' : 'text.secondary',
                  fontWeight: item.credit > 0 ? 'medium' : 'normal'
                }}>
                  {item.credit > 0 ? formatCurrency(item.credit) : '-'}
                </TableCell>
                <TableCell align="right" sx={{
                  fontWeight: 'bold',
                  color: (item.debit - item.credit) > 0 ? 'error.main' :
                         (item.debit - item.credit) < 0 ? 'success.main' : 'text.primary'
                }}>
                  {formatCurrency(item.debit - item.credit)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default HierarchicalView;