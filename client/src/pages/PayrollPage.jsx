import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  useTheme,
  Button,
  IconButton,
  Paper,
  Container,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  Analytics as AnalyticsIcon,
  Description as ExportIcon
} from '@mui/icons-material';
import PayrollDashboard from '../components/payroll/PayrollDashboard';
import PayrollCalculator from '../components/payroll/PayrollCalculator';
import PayrollList from '../components/payroll/PayrollList';
import PayrollDetails from '../components/payroll/PayrollDetails';
import PayrollAnalytics from '../components/payroll/PayrollAnalytics';
import PayrollExport from '../components/payroll/PayrollExport';
import apiClient from '../lib/api';
import { useNavigate, useLocation } from 'react-router-dom';

const PayrollPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPayrollId, setSelectedPayrollId] = useState(null);
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    // If we're viewing details, go back to list view first
    if (selectedPayrollId) {
      setSelectedPayrollId(null);
      setPayrollData(null);
      navigate('/payroll');
    }
    setActiveTab(newValue);
  };

  // Handle view payroll details
  const handleViewPayroll = async (id) => {
    // Handle special actions
    if (id === 'calculator') {
      setSelectedPayrollId(null);
      setActiveTab(1); // Switch to calculator tab
      navigate('/payroll');
      return;
    }
    
    if (!id || typeof id !== 'string') {
      console.error('Invalid payroll ID:', id);
      setError('Invalid payroll ID');
      return;
    }

    setSelectedPayrollId(id);
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/payroll/${id}`);
      if (response.data) {
        setPayrollData(response.data);
        setError(null);
        // Update URL without showing the ID
        navigate('/payroll', { state: { viewingPayroll: true } });
      } else {
        throw new Error('No data received from server');
      }
    } catch (err) {
      console.error('Error fetching payroll details:', err);
      setError(err.response?.data?.message || 'Failed to fetch payroll details. Please try again.');
      setPayrollData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle back button click
  const handleBackToList = () => {
    setSelectedPayrollId(null);
    setPayrollData(null);
    navigate('/payroll');
  };

  // Handle payroll update
  const handlePayrollUpdate = (updatedPayroll) => {
    setPayrollData(updatedPayroll);
  };

  // Handle payroll delete
  const handlePayrollDelete = () => {
    setSelectedPayrollId(null);
    setPayrollData(null);
    setActiveTab(2); // Go to payroll list tab
    navigate('/payroll');
  };

  // Effect to handle browser back/forward navigation
  useEffect(() => {
    if (!location.state?.viewingPayroll && selectedPayrollId) {
      setSelectedPayrollId(null);
      setPayrollData(null);
    }
  }, [location]);

  const renderContent = () => {
    // If a payroll is selected, show details view
    if (selectedPayrollId) {
      return (
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ mb: 2 }}>
            <Button 
              startIcon={<ArrowBack />} 
              onClick={handleBackToList}
              variant="outlined"
              sx={{
                color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
                borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
              }}
            >
              Back to List
            </Button>
          </Box>
          <PayrollDetails 
            id={selectedPayrollId} 
            payrollData={payrollData}
            loading={loading}
            error={error}
            onUpdate={handlePayrollUpdate}
            onDelete={handlePayrollDelete}
            isEmbedded={true}
          />
        </Box>
      );
    }

    // Otherwise show the selected tab content
    switch (activeTab) {
      case 0:
        return <PayrollDashboard />;
      case 1:
        return <PayrollCalculator onPayrollCreated={(payroll) => {
          // Only navigate to the payroll details when we have a valid ID
          if (payroll && payroll._id) {
            handleViewPayroll(payroll._id);
          }
        }} />;
      case 2:
        return <PayrollList onViewDetails={handleViewPayroll} />;
      case 3:
        return <PayrollAnalytics />;
      case 4:
        return <PayrollExport />;
      default:
        return <PayrollDashboard />;
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[50],
        overflow: 'hidden'
      }}
    >
      <Paper 
        elevation={2} 
        square
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.background.paper,
          zIndex: 1,
        }}
      >
        <Tabs
          value={selectedPayrollId ? 2 : activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          sx={{
            '& .MuiTab-root': {
              minHeight: '56px',
              color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : theme.palette.text.primary,
              '&.Mui-selected': {
                color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
            }
          }}
        >
          <Tab 
            label="Dashboard" 
            disabled={!!selectedPayrollId} 
          />
          <Tab 
            label="Calculate Payroll" 
            disabled={!!selectedPayrollId} 
          />
          <Tab 
            label="Payroll List" 
          />
          <Tab
            icon={<AnalyticsIcon />}
            label="Analytics"
            disabled={!!selectedPayrollId}
          />
          <Tab
            icon={<ExportIcon />}
            label="Export"
            disabled={!!selectedPayrollId}
          />
        </Tabs>
      </Paper>
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          p: { xs: 1, sm: 2 },
        }}
      >
        <Container 
          maxWidth="xl" 
          disableGutters 
          sx={{ 
            height: '100%',
          }}
        >
          {renderContent()}
        </Container>
      </Box>
    </Box>
  );
};

export default PayrollPage; 