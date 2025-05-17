const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { DoseLog, Medication, User, Category } = require('../models');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');

// Get all dose logs for user with date range
exports.getDoseLogs = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = { userId: req.user.id };

    // Add date range if provided
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const doseLogs = await DoseLog.findAll({
      where: whereClause,
      include: [
        { 
          model: Medication, 
          as: 'medication',
          attributes: ['id', 'name', 'dose'],
          include: [
            { model: Category, as: 'category', attributes: ['id', 'name'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ doseLogs });
  } catch (error) {
    next(error);
  }
};

// Get today's schedule
exports.getTodaySchedule = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    // Get all medications that should be active today
    const medications = await Medication.findAll({
      where: {
        userId: req.user.id,
        startDate: {
          [Op.lte]: today
        },
        [Op.or]: [
          { endDate: null },
          { endDate: { [Op.gte]: today } }
        ]
      },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ]
    });

    // Get logs for today to check what's already been taken
    const todayLogs = await DoseLog.findAll({
      where: {
        userId: req.user.id,
        createdAt: {
          [Op.between]: [today, tomorrow]
        }
      }
    });

    // Current time for calculating missed doses
    const now = new Date();

    // Create a schedule with all doses for today
    const schedule = [];
    medications.forEach(medication => {
      // Double-check that medication is active today using string comparison
      const medStartDate = medication.startDate.toISOString().split('T')[0];
      const medEndDate = medication.endDate ? medication.endDate.toISOString().split('T')[0] : null;
      
      if (medStartDate > todayStr || (medEndDate && medEndDate < todayStr)) {
        return;
      }
      
      medication.times.forEach(time => {
        // Check if this dose was already logged
        const alreadyLogged = todayLogs.some(log => 
          log.medicationId === medication.id && 
          log.scheduledTime === time
        );

        // Calculate if more than 4 hours have passed since scheduled time
        const [scheduledHour, scheduledMinute] = time.split(':').map(Number);
        const scheduledDateTime = new Date();
        scheduledDateTime.setHours(scheduledHour, scheduledMinute, 0, 0);
        
        const timeDiffMinutes = (now - scheduledDateTime) / (1000 * 60);
        const isMissed = timeDiffMinutes > 240; // More than 4 hours

        let status = 'pending';
        
        if (alreadyLogged) {
          // If already logged, keep that status
          const log = todayLogs.find(log => 
            log.medicationId === medication.id && 
            log.scheduledTime === time
          );
          status = log.status;
        } else if (isMissed) {
          // If not logged and more than 4 hours passed, mark as missed
          status = 'missed';
        }

        schedule.push({
          medicationId: medication.id,
          medication: {
            id: medication.id,
            name: medication.name,
            dose: medication.dose,
            category: medication.category
          },
          scheduledTime: time,
          status: status
        });
      });
    });

    // Sort by scheduled time
    schedule.sort((a, b) => {
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });

    res.json({ schedule });
  } catch (error) {
    next(error);
  }
};

// Get weekly schedule
exports.getWeeklySchedule = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get all medications that should be active during the date range
    const medications = await Medication.findAll({
      where: {
        userId: req.user.id,
        startDate: {
          [Op.lte]: end
        },
        [Op.or]: [
          { endDate: null },
          { endDate: { [Op.gte]: start } }
        ]
      },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ]
    });

    // Get logs for the date range
    const existingLogs = await DoseLog.findAll({
      where: {
        userId: req.user.id,
        createdAt: {
          [Op.between]: [start, end]
        }
      }
    });

    // Current time for calculating missed doses
    const now = new Date();

    // Create a schedule with all doses for each day in the range
    const schedule = [];
    
    // Loop through each day in the date range
    const dayCount = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    for (let i = 0; i < dayCount; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Check each medication for this day
      medications.forEach(medication => {
        // Skip if medication wasn't active on this day
        // Important: Compare dates as strings in YYYY-MM-DD format to avoid time issues
        const medStartDate = medication.startDate.toISOString().split('T')[0];
        const medEndDate = medication.endDate ? medication.endDate.toISOString().split('T')[0] : null;
        
        if (medStartDate > dateStr || (medEndDate && medEndDate < dateStr)) {
          return;
        }
        
        // Add each scheduled time for this medication
        medication.times.forEach(time => {
          // Check if this dose was already logged
          const alreadyLogged = existingLogs.some(log => {
            const logDate = new Date(log.createdAt).toISOString().split('T')[0];
            return log.medicationId === medication.id && 
                   log.scheduledTime === time &&
                   logDate === dateStr;
          });
          
          // Skip if already logged
          if (alreadyLogged) {
            return;
          }
          
          // Calculate if more than 4 hours have passed since scheduled time (only for past dates)
          let status = 'pending';
          
          const isToday = new Date().toISOString().split('T')[0] === dateStr;
          const isPastDay = currentDate < new Date().setHours(0, 0, 0, 0);
          
          if (isPastDay) {
            // Past days - all missed if not taken
            status = 'missed';
          } else if (isToday) {
            // Today - check if more than 4 hours have passed since scheduled time
            const [scheduledHour, scheduledMinute] = time.split(':').map(Number);
            const scheduledDateTime = new Date();
            scheduledDateTime.setHours(scheduledHour, scheduledMinute, 0, 0);
            
            const timeDiffMinutes = (now - scheduledDateTime) / (1000 * 60);
            if (timeDiffMinutes > 240) { // More than 4 hours
              status = 'missed';
            }
          }
          
          schedule.push({
            medicationId: medication.id,
            medication: {
              id: medication.id,
              name: medication.name,
              dose: medication.dose,
              category: medication.category
            },
            scheduledTime: time,
            status: status,
            date: dateStr
          });
        });
      });
    }

    res.json({ schedule });
  } catch (error) {
    next(error);
  }
};

// Log a dose
exports.logDose = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { medicationId, scheduledTime, status = 'taken' } = req.body;

    // Check if medication exists and belongs to user
    const medication = await Medication.findOne({
      where: {
        id: medicationId,
        userId: req.user.id
      }
    });

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    // Calculate if the dose is late (more than 30 min after scheduled time)
    const now = new Date();
    const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
    const scheduledDateTime = new Date();
    scheduledDateTime.setHours(scheduledHour, scheduledMinute, 0, 0);
    
    // Determine if dose is late (more than 30 min but less than 4 hours)
    const timeDiffMinutes = (now - scheduledDateTime) / (1000 * 60);
    const isLate = timeDiffMinutes > 30 && timeDiffMinutes < 240;
    
    // If trying to log as taken more than 4 hours late, automatically mark as missed
    let finalStatus = status;
    let responseMessage = 'Dose logged successfully';
    
    if (timeDiffMinutes > 240 && status === 'taken') {
      finalStatus = 'missed';
      responseMessage = 'Dose marked as missed because it was more than 4 hours after scheduled time';
    }

    // Create dose log
    const doseLog = await DoseLog.create({
      medicationId,
      userId: req.user.id,
      scheduledTime,
      status: finalStatus,
      wasLate: isLate
    });

    // Update user streak if dose was taken
    if (finalStatus === 'taken') {
      const user = req.user;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // If last streak update was not today, increment streak
      if (!user.lastStreakUpdate || new Date(user.lastStreakUpdate).getTime() < today.getTime()) {
        user.streak += 1;
        user.lastStreakUpdate = new Date();
        await user.save();
      }
    }

    // Fetch full log with medication details
    const logWithDetails = await DoseLog.findByPk(doseLog.id, {
      include: [
        { 
          model: Medication, 
          as: 'medication',
          include: [
            { model: Category, as: 'category' }
          ]
        }
      ]
    });

    res.status(201).json({
      message: responseMessage,
      doseLog: logWithDetails,
      userStreak: req.user.streak
    });
  } catch (error) {
    next(error);
  }
};

// Get adherence stats
exports.getAdherenceStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 30); // Default to last 30 days
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get all logs in date range
    const logs = await DoseLog.findAll({
      where: {
        userId: req.user.id,
        createdAt: {
          [Op.between]: [start, end]
        }
      },
      include: [
        { model: Medication, as: 'medication', attributes: ['id', 'name'] }
      ]
    });

    // Get all medications that should be active during the date range
    const medications = await Medication.findAll({
      where: {
        userId: req.user.id,
        startDate: {
          [Op.lte]: end
        },
        [Op.or]: [
          { endDate: null },
          { endDate: { [Op.gte]: start } }
        ]
      },
      attributes: ['id', 'name', 'times', 'startDate', 'endDate']
    });

    // Current time for calculating missed doses
    const now = new Date();

    // All scheduled doses and their status
    const allDoses = [];
    
    // Add all logged doses
    logs.forEach(log => {
      allDoses.push({
        medicationId: log.medicationId,
        medicationName: log.medication.name,
        date: new Date(log.createdAt).toISOString().split('T')[0],
        status: log.status
      });
    });
    
    // Check each day in the date range for scheduled but not logged doses
    const dayCount = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    for (let i = 0; i < dayCount; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Skip future dates
      if (currentDate > now) {
        continue;
      }
      
      // Check each medication for this day
      medications.forEach(medication => {
        // Skip if medication wasn't active on this day
        // Important: Compare dates as strings in YYYY-MM-DD format to avoid time issues
        const medStartDate = medication.startDate.toISOString().split('T')[0];
        const medEndDate = medication.endDate ? medication.endDate.toISOString().split('T')[0] : null;
        
        if (medStartDate > dateStr || (medEndDate && medEndDate < dateStr)) {
          return;
        }
        
        // Check each scheduled time for this medication
        medication.times.forEach(time => {
          // Skip if already logged
          const alreadyLogged = logs.some(log => {
            const logDate = new Date(log.createdAt).toISOString().split('T')[0];
            return log.medicationId === medication.id && 
                   log.scheduledTime === time &&
                   logDate === dateStr;
          });
          
          if (alreadyLogged) {
            return;
          }
          
          // For past times, count as missed
          const [scheduledHour, scheduledMinute] = time.split(':').map(Number);
          const scheduledDateTime = new Date(currentDate);
          scheduledDateTime.setHours(scheduledHour, scheduledMinute, 0, 0);
          
          // If this is in the past and not logged, it's missed
          if (scheduledDateTime < now) {
            allDoses.push({
              medicationId: medication.id,
              medicationName: medication.name,
              date: dateStr,
              status: 'missed'
            });
          }
        });
      });
    }

    // Calculate totals
    const total = allDoses.length;
    const taken = allDoses.filter(dose => dose.status === 'taken').length;
    const missed = allDoses.filter(dose => dose.status === 'missed').length;
    const skipped = allDoses.filter(dose => dose.status === 'skipped').length;

    // Calculate adherence percentage
    const adherencePercentage = total > 0 ? Math.round((taken / total) * 100) : 0;

    // Group by medication
    const medicationStats = {};
    allDoses.forEach(dose => {
      const medId = dose.medicationId;
      const medName = dose.medicationName;
      
      if (!medicationStats[medId]) {
        medicationStats[medId] = {
          id: medId,
          name: medName,
          total: 0,
          taken: 0,
          missed: 0,
          skipped: 0
        };
      }
      
      medicationStats[medId].total += 1;
      if (dose.status === 'taken') medicationStats[medId].taken += 1;
      if (dose.status === 'missed') medicationStats[medId].missed += 1;
      if (dose.status === 'skipped') medicationStats[medId].skipped += 1;
    });

    // Convert to array and calculate percentages
    const medicationsArray = Object.values(medicationStats).map(med => ({
      medicationId: med.id,
      medicationName: med.name,
      adherenceRate: med.total > 0 ? med.taken / med.total : 0,
      adherencePercentage: med.total > 0 ? Math.round((med.taken / med.total) * 100) : 0,
      missed: med.missed,
      taken: med.taken,
      total: med.total
    }));

    // Group by day
    const dayStats = {};
    allDoses.forEach(dose => {
      const date = dose.date;
      
      if (!dayStats[date]) {
        dayStats[date] = {
          date,
          total: 0,
          taken: 0,
          missed: 0,
          skipped: 0
        };
      }
      
      dayStats[date].total += 1;
      if (dose.status === 'taken') dayStats[date].taken += 1;
      if (dose.status === 'missed') dayStats[date].missed += 1;
      if (dose.status === 'skipped') dayStats[date].skipped += 1;
    });

    // Convert days to array and calculate percentages
    const daysArray = Object.values(dayStats).map(day => ({
      date: day.date,
      adherenceRate: day.total > 0 ? day.taken / day.total : 0,
      adherencePercentage: day.total > 0 ? Math.round((day.taken / day.total) * 100) : 0,
      missed: day.missed,
      taken: day.taken,
      total: day.total
    }));

    // Sort days chronologically
    daysArray.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      overall: adherencePercentage / 100,
      byMedication: medicationsArray,
      byDay: daysArray
    });
  } catch (error) {
    next(error);
  }
};

// Generate and download PDF report
exports.generatePdfReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 30); // Default to last 30 days
    
    const end = endDate ? new Date(endDate) : new Date();

    // Get all logs in date range
    const logs = await DoseLog.findAll({
      where: {
        userId: req.user.id,
        createdAt: {
          [Op.between]: [start, end]
        }
      },
      include: [
        { model: Medication, as: 'medication' }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Create a temporary file path
    const tmpDir = path.resolve(__dirname, '../../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
    
    const filePath = path.join(tmpDir, `adherence_report_${req.user.id}_${Date.now()}.pdf`);
    
    // Create PDF document
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    // Add content to PDF
    doc.fontSize(20).text('Medication Adherence Report', {
      align: 'center'
    });
    
    doc.moveDown();
    doc.fontSize(12).text(`Report for: ${req.user.name || req.user.email}`);
    doc.text(`Period: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`);
    
    doc.moveDown();
    doc.fontSize(16).text('Summary');
    doc.moveDown();
    
    // Calculate summary statistics
    const total = logs.length;
    const taken = logs.filter(log => log.status === 'taken').length;
    const missed = logs.filter(log => log.status === 'missed').length;
    const skipped = logs.filter(log => log.status === 'skipped').length;
    const adherencePercentage = total > 0 ? Math.round((taken / total) * 100) : 0;
    
    doc.fontSize(12).text(`Total scheduled doses: ${total}`);
    doc.text(`Doses taken: ${taken}`);
    doc.text(`Doses missed: ${missed}`);
    doc.text(`Doses skipped: ${skipped}`);
    doc.text(`Overall adherence rate: ${adherencePercentage}%`);
    
    // Add medication breakdown
    doc.moveDown();
    doc.fontSize(16).text('Medication Breakdown');
    doc.moveDown();
    
    // Group logs by medication
    const medGroups = {};
    logs.forEach(log => {
      const medId = log.medication.id;
      if (!medGroups[medId]) {
        medGroups[medId] = {
          name: log.medication.name,
          dose: log.medication.dose,
          logs: []
        };
      }
      medGroups[medId].logs.push(log);
    });
    
    // Add each medication's stats
    Object.values(medGroups).forEach(med => {
      const medTotal = med.logs.length;
      const medTaken = med.logs.filter(log => log.status === 'taken').length;
      const medMissed = med.logs.filter(log => log.status === 'missed').length;
      const medSkipped = med.logs.filter(log => log.status === 'skipped').length;
      const medAdherence = medTotal > 0 ? Math.round((medTaken / medTotal) * 100) : 0;
      
      doc.fontSize(14).text(`${med.name} (${med.dose})`);
      doc.fontSize(12).text(`Total doses: ${medTotal}`);
      doc.text(`Doses taken: ${medTaken}`);
      doc.text(`Doses missed: ${medMissed}`);
      doc.text(`Doses skipped: ${medSkipped}`);
      doc.text(`Adherence rate: ${medAdherence}%`);
      doc.moveDown();
    });
    
    // Add detailed log
    doc.addPage();
    doc.fontSize(16).text('Detailed Log', {
      align: 'center'
    });
    doc.moveDown();
    
    // Create a table-like structure
    const logEntries = logs.map(log => ({
      date: new Date(log.createdAt).toLocaleDateString(),
      time: new Date(log.createdAt).toLocaleTimeString(),
      scheduled: log.scheduledTime,
      medication: log.medication.name,
      dose: log.medication.dose,
      status: log.status,
      late: log.wasLate ? 'Yes' : 'No'
    }));
    
    // Headers
    const headers = ['Date', 'Time', 'Scheduled', 'Medication', 'Dose', 'Status', 'Late'];
    const colWidths = [80, 80, 80, 100, 80, 60, 40];
    
    let y = doc.y;
    let currentPage = 1;
    
    // Draw headers
    headers.forEach((header, i) => {
      let x = 50;
      for (let j = 0; j < i; j++) {
        x += colWidths[j];
      }
      doc.fontSize(10).text(header, x, y, { width: colWidths[i], align: 'left' });
    });
    
    doc.moveDown();
    y = doc.y;
    
    // Draw horizontal line
    doc.moveTo(50, y - 5).lineTo(550, y - 5).stroke();
    
    // Draw rows
    logEntries.forEach((entry, rowIndex) => {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
        doc.fontSize(16).text('Detailed Log (continued)', {
          align: 'center'
        });
        doc.moveDown();
        y = doc.y;
        
        // Redraw headers on new page
        headers.forEach((header, i) => {
          let x = 50;
          for (let j = 0; j < i; j++) {
            x += colWidths[j];
          }
          doc.fontSize(10).text(header, x, y, { width: colWidths[i], align: 'left' });
        });
        
        doc.moveDown();
        y = doc.y;
        
        // Draw horizontal line
        doc.moveTo(50, y - 5).lineTo(550, y - 5).stroke();
      }
      
      y = doc.y;
      
      // Draw row
      let x = 50;
      Object.values(entry).forEach((value, i) => {
        doc.fontSize(9).text(value, x, y, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });
      
      doc.moveDown(0.5);
    });
    
    // Finalize PDF
    doc.end();
    
    // Wait for stream to finish
    stream.on('finish', () => {
      // Send file
      res.download(filePath, 'adherence_report.pdf', (err) => {
        // Delete file after sending
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        if (err) {
          next(err);
        }
      });
    });
  } catch (error) {
    next(error);
  }
};

// Generate and download CSV export
exports.generateCsvExport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 30); // Default to last 30 days
    
    const end = endDate ? new Date(endDate) : new Date();

    // Get all logs in date range
    const logs = await DoseLog.findAll({
      where: {
        userId: req.user.id,
        createdAt: {
          [Op.between]: [start, end]
        }
      },
      include: [
        { 
          model: Medication, 
          as: 'medication',
          include: [
            { model: Category, as: 'category' }
          ]
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Create a temporary file path
    const tmpDir = path.resolve(__dirname, '../../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
    
    const filePath = path.join(tmpDir, `medication_logs_${req.user.id}_${Date.now()}.csv`);
    
    // Transform logs to CSV format
    const csvData = logs.map(log => ({
      log_id: log.id,
      date: new Date(log.createdAt).toISOString().split('T')[0],
      time_taken: new Date(log.takenAt).toISOString().split('T')[1].substring(0, 8),
      scheduled_time: log.scheduledTime,
      medication_id: log.medicationId,
      medication_name: log.medication.name,
      dose: log.medication.dose,
      category: log.medication.category ? log.medication.category.name : 'None',
      status: log.status,
      was_late: log.wasLate ? 'Yes' : 'No'
    }));
    
    // Create CSV file
    const csvStream = csv.format({ headers: true });
    const writeStream = fs.createWriteStream(filePath);
    
    csvStream.pipe(writeStream);
    csvData.forEach(row => csvStream.write(row));
    csvStream.end();
    
    // Wait for stream to finish
    writeStream.on('finish', () => {
      // Send file
      res.download(filePath, 'medication_logs.csv', (err) => {
        // Delete file after sending
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        if (err) {
          next(err);
        }
      });
    });
  } catch (error) {
    next(error);
  }
}; 