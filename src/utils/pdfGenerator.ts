import jsPDF from 'jspdf';
import type { WeeklySchedule } from '@/types';
import { DAYS, MEAL_TIMES, formatDayName, formatMealTime, getMealValue } from '@/utils';

// Function to check if text contains Tamil characters
const containsTamil = (text: string): boolean => {
  const tamilRegex = /[\u0B80-\u0BFF]/g;
  return tamilRegex.test(text);
};

// Function to load and cache Tamil TTF font from local file
const loadTamilTTFFont = async (pdf: jsPDF): Promise<boolean> => {
  try {
    // Check if font is already cached in localStorage
    const cachedFont = localStorage.getItem('tamilTTFFont');
    let fontData: string;

    if (cachedFont) {
      fontData = cachedFont;
      console.log('Using cached Tamil font');
    } else {
      // Load Noto Sans Tamil TTF from local public folder
      const fontUrl = '/fonts/NotoSansTamil.ttf';
      console.log('Loading Tamil font from:', fontUrl);

      const response = await fetch(fontUrl);
      if (!response.ok) {
        throw new Error(`Font loading failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      fontData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Extract base64 part
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });

      // Cache the font for future use
      try {
        localStorage.setItem('tamilTTFFont', fontData);
        console.log('Tamil font cached successfully');
      } catch (e) {
        console.warn('Could not cache font (localStorage full)', e);
      }
    }

    // Add font to PDF
    try {
      pdf.addFileToVFS('NotoSansTamil.ttf', fontData);
      pdf.addFont('NotoSansTamil.ttf', 'notoTamil', 'normal');
      console.log('Tamil font loaded successfully');
      return true;
    } catch (error) {
      console.warn('Could not add Tamil font to PDF:', error);
      return false;
    }
  } catch (error) {
    console.error('Failed to load Tamil TTF font:', error);
    return false;
  }
};

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
      format: 'a4',
      compress: true
    });

    // Load Tamil TTF font
    await loadTamilTTFFont(pdf);

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
    pdf.setFont('helvetica', 'bold');
    pdf.text('Kumari Foods', pageWidth / 2, yPosition + 22, { align: 'center' });
    
    yPosition += 45;

  // Company Name Section
  pdf.setFontSize(14);
  const companyNameFont = containsTamil(companyName) ? 'notoTamil' : 'helvetica';
  try {
    pdf.setFont(companyNameFont, 'normal');
  } catch (e) {
    pdf.setFont('helvetica', 'normal');
  }
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
  pdf.setFont('helvetica', 'bold');

  // Header background
  pdf.rect(10, yPosition, tableWidth, headerHeight, 'F');
  
  // Draw header text with proper spacing
  pdf.text('Day', 11, yPosition + 7);

  MEAL_TIMES.forEach((time, index) => {
    const xPos = 10 + columnWidth * (index + 1) + columnWidth / 2;
    const mealTimeText = formatMealTime(time);
    const mealTimeFont = containsTamil(mealTimeText) ? 'notoTamil' : 'helvetica';
    try {
      pdf.setFont(mealTimeFont, 'normal');
    } catch (e) {
      pdf.setFont('helvetica', 'normal');
    }
    pdf.text(mealTimeText, xPos, yPosition + 7, { align: 'center' });
  });

  yPosition += headerHeight;

  // Table Body - Compact format
  pdf.setTextColor(44, 62, 80);
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
    const dayText = formatDayName(day).substring(0, 3);
    const dayFont = containsTamil(dayText) ? 'notoTamil' : 'helvetica';
    try {
      pdf.setFont(dayFont, 'normal');
    } catch (e) {
      pdf.setFont('helvetica', 'normal');
    }
    pdf.text(dayText, 11, yPosition + 6.5);

    // Meal columns
    pdf.setTextColor(44, 62, 80);
    MEAL_TIMES.forEach((time, mealIndex) => {
      const value = getMealValue(schedule, day, time);
      const xPos = 10 + columnWidth * (mealIndex + 1) + columnWidth / 2;
      const cellText = value ? value.substring(0, 8) : '-';

      // Use Tamil font if cell contains Tamil text
      const cellFont = containsTamil(cellText) ? 'notoTamil' : 'helvetica';
      try {
        pdf.setFont(cellFont, 'normal');
      } catch (e) {
        pdf.setFont('helvetica', 'normal');
      }

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
      pdf.setFont('helvetica', 'bold');
      pdf.rect(10, yPosition, tableWidth, headerHeight, 'F');
      pdf.text('Day', 11, yPosition + 7);
      
      MEAL_TIMES.forEach((time, index) => {
        const xPos = 10 + columnWidth * (index + 1) + columnWidth / 2;
        const mealTimeText = formatMealTime(time);
        const mealTimeFont = containsTamil(mealTimeText) ? 'notoTamil' : 'helvetica';
        try {
          pdf.setFont(mealTimeFont, 'normal');
        } catch (e) {
          pdf.setFont('helvetica', 'normal');
        }
        pdf.text(mealTimeText, xPos, yPosition + 7, { align: 'center' });
      });
      
      yPosition += headerHeight;
    }
  });

  // Footer Section
  yPosition += 10;
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 15, pageHeight - 10);
  pdf.text('Kumari Foods - Daily Meal Management System', 15, pageHeight - 5);

  // Download PDF
  pdf.save(`${companyName}_Weekly_Schedule.pdf`);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};