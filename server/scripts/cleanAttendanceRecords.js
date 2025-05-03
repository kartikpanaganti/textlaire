/**
 * Script to delete attendance records that exist before an employee's joining date
 * Run with: node scripts/cleanAttendanceRecords.js
 */

import mongoose from 'mongoose';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';

// MongoDB connection string (replace with your actual connection string)
const mongoURI = 'mongodb://localhost:27017/textlaire';

// Connect to MongoDB
mongoose.connect(mongoURI)
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

const cleanAttendanceRecords = async () => {
  try {
    console.log('Starting cleanup of invalid attendance records...');
    
    // Get current date for future records check
    const currentDate = new Date('2025-05-01'); // Hard-coded to May 1, 2025
    currentDate.setHours(23, 59, 59, 999); // End of day
    
    console.log(`Current date set to: ${currentDate.toISOString().split('T')[0]}`);
    
    // Delete future records (after today) for all employees
    const futureRecordsResult = await Attendance.deleteMany({
      date: { $gt: currentDate }
    });
    
    console.log(`Deleted ${futureRecordsResult.deletedCount} future attendance records (after ${currentDate.toISOString().split('T')[0]})`);
    
    let totalInvalidDeleted = futureRecordsResult.deletedCount;
    
    // Get all employees
    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees`);
    
    // Process each employee for records before joining
    for (const employee of employees) {
      // Get employee joining date
      const joiningDate = new Date(employee.joiningDate);
      joiningDate.setHours(0, 0, 0, 0); // Reset time to start of day
      
      console.log(`Processing employee: ${employee.name} (ID: ${employee._id}), joined on ${joiningDate.toISOString().split('T')[0]}`);
      
      // Find attendance records before joining date
      const invalidRecords = await Attendance.find({
        employeeId: employee._id,
        date: { $lt: joiningDate }
      });
      
      if (invalidRecords.length > 0) {
        console.log(`Found ${invalidRecords.length} pre-joining attendance records for ${employee.name}`);
        
        // Delete invalid records
        const deleteResult = await Attendance.deleteMany({
          employeeId: employee._id,
          date: { $lt: joiningDate }
        });
        
        console.log(`Deleted ${deleteResult.deletedCount} pre-joining records for ${employee.name}`);
        totalInvalidDeleted += deleteResult.deletedCount;
      } else {
        console.log(`No pre-joining records found for ${employee.name}`);
      }
    }
    
    console.log(`Cleanup completed. Total deleted records: ${totalInvalidDeleted}`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the cleanup function
cleanAttendanceRecords();
