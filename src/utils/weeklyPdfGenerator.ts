import jsPDF from 'jspdf';
import type { WeeklySchedule, AccountDetails, DayOfWeek } from '@/types';

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

// Function to render Tamil text to canvas image
const renderTamilTextToImage = (text: string, fontSize: number = 14, bold: boolean = false): Promise<string> => {
  return new Promise((resolve) => {
    document.fonts.ready.then(() => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve('');
        return;
      }

      const fontWeight = bold ? '700' : '400';
      ctx.font = `${fontWeight} ${fontSize}px "Noto Sans Tamil", sans-serif`;
      
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const textHeight = fontSize * 1.8;
      
      const scale = 3;
      canvas.width = (textWidth + 20) * scale;
      canvas.height = textHeight * scale;
      
      ctx.scale(scale, scale);
      ctx.font = `${fontWeight} ${fontSize}px "Noto Sans Tamil", sans-serif`;
      ctx.fillStyle = '#000000';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.fillText(text, (textWidth + 20) / 2, textHeight / 2);
      
      const imageData = canvas.toDataURL('image/png', 1.0);
      resolve(imageData);
    }).catch(() => {
      resolve('');
    });
  });
};

// Check if text contains Tamil characters
const containsTamil = (text: string): boolean => {
  return /[\u0B80-\u0BFF]/.test(text);
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

export const generateWeeklySchedulePDF = async (
  companyName: string,
  _companyDetails: AccountDetails | undefined,
  weekSchedule: WeeklySchedule
) => {
  try {
    const logoBase64 = await loadImageAsBase64('/Logo.png');
    const tamilTextImage = await renderTamilTextToImage('குமரி புட்ஸ்', 48, true);
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPos = 15;

    const startX = 10;
    const tableWidth = pageWidth - 20;
    const dayColumnWidth = 35;
    const mealColumnWidth = (tableWidth - dayColumnWidth) / 3;

    // Add logo
    try {
      const logoSize = 15;
      pdf.addImage(logoBase64, 'PNG', (pageWidth - logoSize) / 2, yPos, logoSize, logoSize);
      yPos += logoSize + 2;
    } catch (error) {
      console.log('Logo could not be added');
    }

    // Add shop name as image
    if (tamilTextImage && tamilTextImage.length > 100) {
      try {
        const textImgWidth = 70;
        const textImgHeight = 12;
        pdf.addImage(tamilTextImage, 'PNG', (pageWidth - textImgWidth) / 2, yPos - 1, textImgWidth, textImgHeight);
        yPos += textImgHeight + 5;
      } catch (error) {
        console.error('Failed to add Tamil image');
        yPos += 10;
      }
    } else {
      yPos += 10;
    }

    // Draw table header
    pdf.setFillColor(200, 200, 200);
    pdf.rect(startX, yPos, tableWidth, 8, 'F');
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    
    // Header borders
    pdf.rect(startX, yPos, dayColumnWidth, 8);
    pdf.rect(startX + dayColumnWidth, yPos, mealColumnWidth, 8);
    pdf.rect(startX + dayColumnWidth + mealColumnWidth, yPos, mealColumnWidth, 8);
    pdf.rect(startX + dayColumnWidth + mealColumnWidth * 2, yPos, mealColumnWidth, 8);
    
    // Header text
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DAY', startX + dayColumnWidth / 2, yPos + 5, { align: 'center' });
    pdf.text('TIFFEN', startX + dayColumnWidth + mealColumnWidth / 2, yPos + 5, { align: 'center' });
    pdf.text('LUNCH', startX + dayColumnWidth + mealColumnWidth + mealColumnWidth / 2, yPos + 5, { align: 'center' });
    pdf.text('DINNER', startX + dayColumnWidth + mealColumnWidth * 2 + mealColumnWidth / 2, yPos + 5, { align: 'center' });
    
    yPos += 8;

    // Draw table rows
    const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const rowHeight = 15;
    
    for (let index = 0; index < days.length; index++) {
      const day = days[index];
      const entry = weekSchedule.entries.find(e => e.day === day);
      
      // Zebra striping
      if (index % 2 === 0) {
        pdf.setFillColor(248, 248, 248);
        pdf.rect(startX, yPos, tableWidth, rowHeight, 'F');
      }
      
      // Cell borders
      pdf.rect(startX, yPos, dayColumnWidth, rowHeight);
      pdf.rect(startX + dayColumnWidth, yPos, mealColumnWidth, rowHeight);
      pdf.rect(startX + dayColumnWidth + mealColumnWidth, yPos, mealColumnWidth, rowHeight);
      pdf.rect(startX + dayColumnWidth + mealColumnWidth * 2, yPos, mealColumnWidth, rowHeight);
      
      // Day name
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(DAY_LABELS[day].toUpperCase(), startX + dayColumnWidth / 2, yPos + rowHeight / 2 + 1, { align: 'center' });
      
      // Meal entries
      const tiffenText = entry?.tiffen?.toString() || '-';
      const lunchText = entry?.lunch?.toString() || '-';
      const dinnerText = entry?.dinner?.toString() || '-';
      
      pdf.setFont('helvetica', 'normal');
      
      // Tiffen cell
      if (containsTamil(tiffenText) && tiffenText !== '-') {
        const img = await renderTamilTextToImage(tiffenText, 12);
        if (img) {
          try {
            const imgHeight = 8;
            const imgWidth = imgHeight * 3;
            pdf.addImage(img, 'PNG', 
              startX + dayColumnWidth + mealColumnWidth / 2 - imgWidth / 2, 
              yPos + rowHeight / 2 - imgHeight / 2, 
              imgWidth, imgHeight);
          } catch (e) {
            pdf.text(tiffenText, startX + dayColumnWidth + mealColumnWidth / 2, yPos + rowHeight / 2 + 1, { align: 'center' });
          }
        }
      } else {
        pdf.text(tiffenText, startX + dayColumnWidth + mealColumnWidth / 2, yPos + rowHeight / 2 + 1, { align: 'center', maxWidth: mealColumnWidth - 2 });
      }
      
      // Lunch cell
      if (containsTamil(lunchText) && lunchText !== '-') {
        const img = await renderTamilTextToImage(lunchText, 12);
        if (img) {
          try {
            const imgHeight = 8;
            const imgWidth = imgHeight * 3;
            pdf.addImage(img, 'PNG', 
              startX + dayColumnWidth + mealColumnWidth + mealColumnWidth / 2 - imgWidth / 2, 
              yPos + rowHeight / 2 - imgHeight / 2, 
              imgWidth, imgHeight);
          } catch (e) {
            pdf.text(lunchText, startX + dayColumnWidth + mealColumnWidth + mealColumnWidth / 2, yPos + rowHeight / 2 + 1, { align: 'center' });
          }
        }
      } else {
        pdf.text(lunchText, startX + dayColumnWidth + mealColumnWidth + mealColumnWidth / 2, yPos + rowHeight / 2 + 1, { align: 'center', maxWidth: mealColumnWidth - 2 });
      }
      
      // Dinner cell
      if (containsTamil(dinnerText) && dinnerText !== '-') {
        const img = await renderTamilTextToImage(dinnerText, 12);
        if (img) {
          try {
            const imgHeight = 8;
            const imgWidth = imgHeight * 3;
            pdf.addImage(img, 'PNG', 
              startX + dayColumnWidth + mealColumnWidth * 2 + mealColumnWidth / 2 - imgWidth / 2, 
              yPos + rowHeight / 2 - imgHeight / 2, 
              imgWidth, imgHeight);
          } catch (e) {
            pdf.text(dinnerText, startX + dayColumnWidth + mealColumnWidth * 2 + mealColumnWidth / 2, yPos + rowHeight / 2 + 1, { align: 'center' });
          }
        }
      } else {
        pdf.text(dinnerText, startX + dayColumnWidth + mealColumnWidth * 2 + mealColumnWidth / 2, yPos + rowHeight / 2 + 1, { align: 'center', maxWidth: mealColumnWidth - 2 });
      }
      
      yPos += rowHeight;
    }

    // Save PDF
    pdf.save(`${companyName}_Weekly_${weekSchedule.weekStartDate}_to_${weekSchedule.weekEndDate}.pdf`);
  } catch (error) {
    console.error('Failed to generate weekly PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};
