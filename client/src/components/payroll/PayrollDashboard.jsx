import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, Box, useTheme } from '@mui/material';
import { MonetizationOn, People, AccessTime, Payment } from '@mui/icons-material';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PayrollDashboard = () => {
  const theme = useTheme();
  const [summaryData, setSummaryData] = useState({
    totalPayroll: 0,
    totalEmployees: 0,
    pendingPayrolls: 0,
    processedPayrolls: 0
  });
  const [recentPayrolls, setRecentPayrolls] = useState([]);
  const [monthlyPayroll, setMonthlyPayroll] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [payrollsRes, employeesRes] = await Promise.all([
        axios.get('/api/payroll'),
        axios.get('/api/employees')
      ]);

      const payrolls = payrollsRes.data;
      const employees = employeesRes.data;

      // Calculate summary data
      const totalPayroll = payrolls.reduce((sum, p) => sum + p.totalEarnings, 0);
      const pendingPayrolls = payrolls.filter(p => p.paymentStatus === 'Pending').length;
      const processedPayrolls = payrolls.filter(p => p.paymentStatus === 'Processed').length;

      setSummaryData({
        totalPayroll,
        totalEmployees: employees.length,
        pendingPayrolls,
        processedPayrolls
      });

      // Set recent payrolls
      setRecentPayrolls(payrolls.slice(0, 5));

      // Process monthly data for chart
      const monthlyData = processMonthlyPayrollData(payrolls);
      setMonthlyPayroll(monthlyData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const processMonthlyPayrollData = (payrolls) => {
    const monthlyData = {};
    payrolls.forEach(payroll => {
      const month = new Date(payroll.payPeriodStart).toLocaleString('default', { month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = 0;
      }
      monthlyData[month] += payroll.totalEarnings;
    });

    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount
    }));
  };

  const summaryCards = [
    {
      title: 'Total Payroll',
      value: `₹${summaryData.totalPayroll.toLocaleString()}`,
      icon: <MonetizationOn sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      color: theme.palette.primary.main
    },
    {
      title: 'Total Employees',
      value: summaryData.totalEmployees,
      icon: <People sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      color: theme.palette.secondary.main
    },
    {
      title: 'Pending Payrolls',
      value: summaryData.pendingPayrolls,
      icon: <AccessTime sx={{ fontSize: 40, color: theme.palette.warning.main }} />,
      color: theme.palette.warning.main
    },
    {
      title: 'Processed Payrolls',
      value: summaryData.processedPayrolls,
      icon: <Payment sx={{ fontSize: 40, color: theme.palette.success.main }} />,
      color: theme.palette.success.main
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Payroll Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? theme.palette.background.paper 
                  : '#fff',
                boxShadow: theme.shadows[2]
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  {card.icon}
                  <Typography variant="h5" sx={{ color: card.color }}>
                    {card.value}
                  </Typography>
                </Box>
                <Typography variant="subtitle1" color="textSecondary">
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Monthly Payroll Chart */}
      <Card sx={{ mb: 4, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Monthly Payroll Distribution</Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyPayroll}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" name="Payroll Amount" fill={theme.palette.primary.main} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Card>

      {/* Recent Payrolls */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Recent Payrolls</Typography>
          <Grid container spacing={2}>
            {recentPayrolls.map((payroll, index) => (
              <Grid item xs={12} key={index}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 1,
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? theme.palette.background.default 
                      : theme.palette.grey[100]
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle1">
                        {payroll.employeeId?.name || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        ID: {payroll.employeeId?.employeeID || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Period: {new Date(payroll.payPeriodStart).toLocaleDateString()} - 
                        {new Date(payroll.payPeriodEnd).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body1">
                        ₹{payroll.netSalary?.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography 
                        variant="body2"
                        sx={{
                          color: 
                            payroll.paymentStatus === 'Paid' 
                              ? theme.palette.success.main 
                              : payroll.paymentStatus === 'Pending'
                                ? theme.palette.warning.main
                                : theme.palette.info.main
                        }}
                      >
                        {payroll.paymentStatus}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PayrollDashboard; 