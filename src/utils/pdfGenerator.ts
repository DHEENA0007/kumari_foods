import jsPDF from 'jspdf';
import type { WeeklySchedule } from '@/types';
import { DAYS, MEAL_TIMES, formatDayName, formatMealTime, getMealValue } from '@/utils';

const loadImageAsBase64 = (imagePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.crossOrigin = 'anonymous';
    img.src = imagePath;
  });
};

export const generatePDF = async (companyName: string, schedule: WeeklySchedule | undefined) => {
  try {
    const logoBase64 = await loadImageAsBase64('/Logo.png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 15;

    // Header with Logo - White background
    pdf.setFillColor(255, 255, 255); // White background
    pdf.rect(10, yPosition - 5, pageWidth - 20, 40, 'F');
    
    // Add logo above the text
    try {
      pdf.addImage(logoBase64, 'PNG', pageWidth / 2 - 10, yPosition - 2, 20, 20);
    } catch (error) {
      console.log('Logo could not be added');
    }
    
    pdf.setTextColor(44, 62, 80);
    pdf.setFontSize(24);
    pdf.setFont('Helvetica', 'bold');
    pdf.text('Kumari Foods', pageWidth / 2, yPosition + 22, { align: 'center' });
    
    yPosition += 45;

  // Company Name Section
  pdf.setFontSize(14);
  pdf.setFont('Helvetica', 'bold');
  pdf.setTextColor(44, 62, 80);
  pdf.text(companyName, 12, yPosition);
  
  yPosition += 8;

  // Table Section - Optimized for mobile
  const tableWidth = pageWidth - 20;
  const numColumns = MEAL_TIMES.length + 1;
  const columnWidth = tableWidth / numColumns;
  const rowHeight = 9;
  const headerHeight = 10;

  // Table Header
  pdf.setFillColor(255, 107, 53);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('Helvetica', 'bold');

  // Header background
  pdf.rect(10, yPosition, tableWidth, headerHeight, 'F');
  
  // Draw header text with proper spacing
  pdf.text('Day', 11, yPosition + 7);

  MEAL_TIMES.forEach((time, index) => {
    const xPos = 10 + columnWidth * (index + 1) + columnWidth / 2;
    pdf.text(formatMealTime(time), xPos, yPosition + 7, { align: 'center' });
  });

  yPosition += headerHeight;

  // Table Body - Compact format
  pdf.setTextColor(44, 62, 80);
  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.2);

  DAYS.forEach((day, dayIndex) => {
    // Alternate row colors
    if (dayIndex % 2 === 0) {
      pdf.setFillColor(248, 248, 248);
      pdf.rect(10, yPosition, tableWidth, rowHeight, 'F');
    }

    // Draw row border
    pdf.rect(10, yPosition, tableWidth, rowHeight);

    // Draw column separators
    for (let i = 0; i <= numColumns; i++) {
      const xPos = 10 + i * columnWidth;
      pdf.line(xPos, yPosition, xPos, yPosition + rowHeight);
    }

    // Day column
    pdf.setTextColor(255, 107, 53);
    pdf.setFont('Helvetica', 'bold');
    pdf.text(formatDayName(day).substring(0, 3), 11, yPosition + 6.5);

    // Meal columns
    pdf.setTextColor(44, 62, 80);
    pdf.setFont('Helvetica', 'normal');
    MEAL_TIMES.forEach((time, mealIndex) => {
      const value = getMealValue(schedule, day, time);
      const xPos = 10 + columnWidth * (mealIndex + 1) + columnWidth / 2;
      const cellText = value ? value.substring(0, 8) : '-';
      pdf.text(cellText, xPos, yPosition + 6.5, { align: 'center' });
    });

    yPosition += rowHeight;

    // Check if we need a new page
    if (yPosition > pageHeight - 25) {
      pdf.addPage();
      yPosition = 15;
      
      // Repeat header on new page
      pdf.setFillColor(255, 107, 53);
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('Helvetica', 'bold');
      pdf.rect(10, yPosition, tableWidth, headerHeight, 'F');
      pdf.text('Day', 11, yPosition + 7);
      
      MEAL_TIMES.forEach((time, index) => {
        const xPos = 10 + columnWidth * (index + 1) + columnWidth / 2;
        pdf.text(formatMealTime(time), xPos, yPosition + 7, { align: 'center' });
      });
      
      yPosition += headerHeight;
    }
  });

  // Footer Section
  yPosition += 10;
  
  pdf.setFontSize(8);
  pdf.text(`Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 15, pageHeight - 10);
  pdf.text('Kumari Foods - Daily Meal Management System', 15, pageHeight - 5);

  // Download PDF
  pdf.save(`${companyName}_Weekly_Schedule.pdf`);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};