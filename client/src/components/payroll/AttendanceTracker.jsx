import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Tooltip,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import apiClient from '../../api/axiosConfig';

const AttendanceTracker = ({ employeeId, startDate, endDate, onAttendanceUpdate }) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newEntry, setNewEntry] = useState({
    date: new Date(),
    checkIn: new Date(),
    checkOut: new Date(),
    overtime: 0,
    status: 'Present',
    notes: ''
  });

  useEffect(() => {
    if (employeeId && startDate && endDate) {
      fetchAttendance();
    }
  }, [employeeId, startDate, endDate]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/attendance', {
        params: {
          employeeId,
          startDate,
          endDate
        }
      });
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const calculateOvertime = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    
    const standardHours = 8; // Standard working hours
    const actualHours = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60);
    return Math.max(0, actualHours - standardHours);
  };

  const handleSaveEntry = async () => {
    try {
      setLoading(true);
      const overtime = calculateOvertime(newEntry.checkIn, newEntry.checkOut);
      
      const payload = {
        ...newEntry,
        employeeId,
        overtime
      };

      if (editingId) {
        await apiClient.put(`/api/attendance/${editingId}`, payload);
      } else {
        await apiClient.post('/api/attendance', payload);
      }

      await fetchAttendance();
      setShowAddDialog(false);
      setEditingId(null);
      setNewEntry({
        date: new Date(),
        checkIn: new Date(),
        checkOut: new Date(),
        overtime: 0,
        status: 'Present',
        notes: ''
      });

      // Notify parent component about the update
      if (onAttendanceUpdate) {
        onAttendanceUpdate();
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      setError('Failed to save attendance entry');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry._id);
    setNewEntry({
      date: new Date(entry.date),
      checkIn: new Date(entry.checkIn),
      checkOut: new Date(entry.checkOut),
      overtime: entry.overtime,
      status: entry.status,
      notes: entry.notes
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await apiClient.delete(`/api/attendance/${id}`);
      await fetchAttendance();
      
      // Notify parent component about the update
      if (onAttendanceUpdate) {
        onAttendanceUpdate();
      }
    } catch (error) {
      console.error('Error deleting attendance:', error);
      setError('Failed to delete attendance entry');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Attendance Records</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingId(null);
            setShowAddDialog(true);
          }}
        >
          Add Entry
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Check In</TableCell>
              <TableCell>Check Out</TableCell>
              <TableCell>Overtime (hrs)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : attendance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No attendance records found
                </TableCell>
              </TableRow>
            ) : (
              attendance.map((entry) => (
                <TableRow key={entry._id}>
                  <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                  <TableCell>{formatTime(entry.checkIn)}</TableCell>
                  <TableCell>{formatTime(entry.checkOut)}</TableCell>
                  <TableCell>{entry.overtime.toFixed(2)}</TableCell>
                  <TableCell>{entry.status}</TableCell>
                  <TableCell>{entry.notes}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(entry)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(entry._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingId ? 'Edit Attendance Entry' : 'Add Attendance Entry'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <DatePicker
                  label="Date"
                  value={newEntry.date}
                  onChange={(date) => setNewEntry(prev => ({ ...prev, date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TimePicker
                  label="Check In"
                  value={newEntry.checkIn}
                  onChange={(time) => setNewEntry(prev => ({ ...prev, checkIn: time }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TimePicker
                  label="Check Out"
                  value={newEntry.checkOut}
                  onChange={(time) => setNewEntry(prev => ({ ...prev, checkOut: time }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={newEntry.status}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="Present">Present</MenuItem>
                  <MenuItem value="Absent">Absent</MenuItem>
                  <MenuItem value="Half Day">Half Day</MenuItem>
                  <MenuItem value="Leave">Leave</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveEntry}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {editingId ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceTracker; 