import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  useTheme,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  GetApp as GetAppIcon,
  DateRange as DateRangeIcon,
  Group as GroupIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import apiClient from '../../lib/api';

const PayrollAnalytics = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [analyticsData, setAnalyticsData] = useState({
    payrollTrends: [],
    departmentDistribution: [],
    salaryRanges: [],
    monthlyTotals: [],
    topEarners: [],
    payrollStats: {
      totalEmployees: 0,
      averageSalary: 0,
      totalPayroll: 0,
      growthRate: 0
    }
  });

  // Colors for charts
  const CHART_COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // In a real application, these would be actual API calls
      // For demo purposes, using mock data
      const mockData = generateMockData();
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    // Generate realistic mock data for demonstration
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    return {
      payrollTrends: months.map(month => ({
        month,
        totalPayroll: Math.floor(Math.random() * 1000000) + 500000,
        employeeCount: Math.floor(Math.random() * 50) + 100
      })),
      departmentDistribution: [
        { department: 'Engineering', count: 45, totalPayroll: 2250000 },
        { department: 'Sales', count: 30, totalPayroll: 1500000 },
        { department: 'Marketing', count: 20, totalPayroll: 1000000 },
        { department: 'HR', count: 10, totalPayroll: 500000 },
        { department: 'Finance', count: 15, totalPayroll: 750000 }
      ],
      salaryRanges: [
        { range: '0-30K', count: 20 },
        { range: '30K-50K', count: 35 },
        { range: '50K-80K', count: 25 },
        { range: '80K-100K', count: 15 },
        { range: '100K+', count: 5 }
      ],
      monthlyTotals: months.map(month => ({
        month,
        salary: Math.floor(Math.random() * 500000) + 250000,
        bonus: Math.floor(Math.random() * 100000),
        deductions: Math.floor(Math.random() * 150000)
      })),
      topEarners: [
        { name: 'John Doe', salary: 120000, department: 'Engineering' },
        { name: 'Jane Smith', salary: 115000, department: 'Sales' },
        { name: 'Mike Johnson', salary: 110000, department: 'Marketing' },
        { name: 'Sarah Williams', salary: 105000, department: 'Finance' },
        { name: 'Tom Brown', salary: 100000, department: 'Engineering' }
      ],
      payrollStats: {
        totalEmployees: 120,
        averageSalary: 75000,
        totalPayroll: 9000000,
        growthRate: 12.5
      }
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderPayrollTrends = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={analyticsData.payrollTrends}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <ChartTooltip />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="totalPayroll"
          stroke={theme.palette.primary.main}
          name="Total Payroll"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="employeeCount"
          stroke={theme.palette.secondary.main}
          name="Employee Count"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderDepartmentDistribution = () => (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={analyticsData.departmentDistribution}
          dataKey="totalPayroll"
          nameKey="department"
          cx="50%"
          cy="50%"
          outerRadius={150}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {analyticsData.departmentDistribution.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <ChartTooltip formatter={(value) => formatCurrency(value)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderSalaryDistribution = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={analyticsData.salaryRanges}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="range" />
        <YAxis />
        <ChartTooltip />
        <Legend />
        <Bar dataKey="count" fill={theme.palette.primary.main} name="Employee Count" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderStatCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Stack spacing={2} alignItems="center">
              <GroupIcon color="primary" sx={{ fontSize: 40 }} />
              <Typography variant="h6" align="center">
                Total Employees
              </Typography>
              <Typography variant="h4" color="primary">
                {analyticsData.payrollStats.totalEmployees}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Stack spacing={2} alignItems="center">
              <AccountBalanceIcon color="secondary" sx={{ fontSize: 40 }} />
              <Typography variant="h6" align="center">
                Average Salary
              </Typography>
              <Typography variant="h4" color="secondary">
                {formatCurrency(analyticsData.payrollStats.averageSalary)}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Stack spacing={2} alignItems="center">
              <TimelineIcon color="success" sx={{ fontSize: 40 }} />
              <Typography variant="h6" align="center">
                Total Payroll
              </Typography>
              <Typography variant="h4" color="success">
                {formatCurrency(analyticsData.payrollStats.totalPayroll)}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Stack spacing={2} alignItems="center">
              <TrendingUpIcon color="info" sx={{ fontSize: 40 }} />
              <Typography variant="h6" align="center">
                Growth Rate
              </Typography>
              <Typography variant="h4" color="info">
                {analyticsData.payrollStats.growthRate}%
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PieChartIcon color="primary" />
          Payroll Analytics
        </Typography>
        <Button
          variant="contained"
          startIcon={<GetAppIcon />}
          onClick={() => {/* Add export functionality */}}
        >
          Export Report
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {renderStatCards()}

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payroll Trends
              </Typography>
              {renderPayrollTrends()}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Department Distribution
              </Typography>
              {renderDepartmentDistribution()}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Salary Distribution
              </Typography>
              {renderSalaryDistribution()}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Earners
              </Typography>
              <Grid container spacing={2}>
                {analyticsData.topEarners.map((earner, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper sx={{ p: 2 }}>
                      <Stack spacing={1}>
                        <Typography variant="subtitle1">{earner.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {earner.department}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(earner.salary)}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PayrollAnalytics; 