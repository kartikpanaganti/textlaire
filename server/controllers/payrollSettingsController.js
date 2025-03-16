import PayrollSettings from "../models/PayrollSettings.js";

// Get active payroll settings
export const getPayrollSettings = async (req, res) => {
  try {
    const settings = await PayrollSettings.getActive();
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update payroll settings
export const updatePayrollSettings = async (req, res) => {
  try {
    const {
      allowances,
      deductions,
      overtimeRateMultiplier,
      workingDaysPerMonth,
      workingHoursPerDay
    } = req.body;

    // Get active settings
    let settings = await PayrollSettings.getActive();

    // Update settings
    if (allowances) settings.allowances = allowances;
    if (deductions) settings.deductions = deductions;
    if (overtimeRateMultiplier) settings.overtimeRateMultiplier = overtimeRateMultiplier;
    if (workingDaysPerMonth) settings.workingDaysPerMonth = workingDaysPerMonth;
    if (workingHoursPerDay) settings.workingHoursPerDay = workingHoursPerDay;

    // Save updated settings
    await settings.save();

    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset payroll settings to defaults
export const resetPayrollSettings = async (req, res) => {
  try {
    // Find active settings
    const settings = await PayrollSettings.findOne({ isActive: true });
    
    if (settings) {
      // Delete existing settings
      await PayrollSettings.deleteOne({ _id: settings._id });
    }
    
    // Create new settings with defaults
    const newSettings = await PayrollSettings.create({ isActive: true });
    
    res.status(200).json(newSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 