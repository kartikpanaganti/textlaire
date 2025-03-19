import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Divider
} from '@mui/material';
import {
  GetApp as GetAppIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Email as EmailIcon,
  Print as PrintIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const PayrollExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [selectedFields, setSelectedFields] = useState([
    'employeeDetails',
    'basicSalary',
    'allowances',
    'deductions',
    'netSalary'
  ]);
  const [exportSettings, setExportSettings] = useState({
    includeHeader: true,
    includeSummary: true,
    includeFooter: true,
    companyLogo: true,
    pageNumbers: true,
    detailedBreakdown: true
  });

  const availableFields = [
    { id: 'employeeDetails', label: 'Employee Details', required: true },
    { id: 'basicSalary', label: 'Basic Salary', required: true },
    { id: 'allowances', label: 'Allowances', required: false },
    { id: 'deductions', label: 'Deductions', required: false },
    { id: 'overtime', label: 'Overtime', required: false },
    { id: 'bonus', label: 'Bonus', required: false },
    { id: 'leaves', label: 'Leave Details', required: false },
    { id: 'taxDetails', label: 'Tax Information', required: false },
    { id: 'bankDetails', label: 'Bank Details', required: false },
    { id: 'netSalary', label: 'Net Salary', required: true }
  ];

  const handleExport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Show success message
      setSuccess(`Payroll report exported successfully in ${exportFormat.toUpperCase()} format`);

      // Simulate file download
      const fileName = `payroll_report_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      console.log(`Downloading ${fileName}`);

    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export payroll report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldToggle = (fieldId) => {
    const field = availableFields.find(f => f.id === fieldId);
    if (field?.required) return; // Can't toggle required fields

    setSelectedFields(prev => {
      if (prev.includes(fieldId)) {
        return prev.filter(id => id !== fieldId);
      } else {
        return [...prev, fieldId];
      }
    });
  };

  const renderExportOptions = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Export Options
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                label="Export Format"
              >
                <MenuItem value="pdf">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PdfIcon color="error" />
                    <Typography>PDF Document</Typography>
                  </Stack>
                </MenuItem>
                <MenuItem value="excel">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ExcelIcon color="success" />
                    <Typography>Excel Spreadsheet</Typography>
                  </Stack>
                </MenuItem>
                <MenuItem value="csv">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DescriptionIcon color="primary" />
                    <Typography>CSV File</Typography>
                  </Stack>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Stack spacing={2}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
                <DatePicker
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Stack>
            </LocalizationProvider>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderSelectedFields = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Selected Fields</Typography>
          <Button
            startIcon={<SettingsIcon />}
            onClick={() => setShowSettings(true)}
          >
            Customize
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {selectedFields.map(fieldId => {
            const field = availableFields.find(f => f.id === fieldId);
            return (
              <Chip
                key={fieldId}
                label={field?.label}
                color={field?.required ? 'primary' : 'default'}
                onDelete={field?.required ? undefined : () => handleFieldToggle(fieldId)}
              />
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );

  const renderActions = () => (
    <Card>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<GetAppIcon />}
              onClick={handleExport}
              disabled={loading}
            >
              {loading ? 'Exporting...' : 'Export Report'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={() => {/* Add email functionality */}}
            >
              Email Report
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => {/* Add print functionality */}}
            >
              Print Report
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setShowSettings(true)}
            >
              Settings
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <DescriptionIcon color="primary" />
        Export Payroll Report
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {renderExportOptions()}
      {renderSelectedFields()}
      {renderActions()}

      {/* Settings Dialog */}
      <Dialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Settings</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2 }}>
            Select fields to include in the report
          </Typography>
          <List>
            {availableFields.map((field) => (
              <React.Fragment key={field.id}>
                <ListItem>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedFields.includes(field.id)}
                      onChange={() => handleFieldToggle(field.id)}
                      disabled={field.required}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={field.label}
                    secondary={field.required ? 'Required' : 'Optional'}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Loading Overlay */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
          }}
        >
          <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography>Generating Report...</Typography>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default PayrollExport; 