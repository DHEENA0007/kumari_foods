import jsPDF from 'jspdf';
import type { MealSchedule, AccountDetails } from '@/types';

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
      // Load Noto Sans Tamil TTF from public folder
      const fontUrl = '/Noto_Sans_Tamil/NotoSansTamil-VariableFont_wdth,wght.ttf';
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
      pdf.addFont('NotoSansTamil.ttf', 'NotoSansTamil', 'normal');
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

// Function to render Tamil text to canvas and convert to base64 image
const renderTamilTextToImage = (text: string, fontSize: number = 14, bold: boolean = false): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Failed to get canvas context');
      resolve('');
      return;
    }

    // Check if font is already available from Google Fonts (loaded in index.html)
    // Otherwise load from local files
    const checkFontAvailable = async () => {
      // First check if Google Fonts version is already loaded
      if (document.fonts.check('12px "Noto Sans Tamil"')) {
        console.log('Using Noto Sans Tamil from Google Fonts');
        return true;
      }
      
      // Otherwise load from local files
      const fontUrl = bold 
        ? 'url(/Noto_Sans_Tamil/static/NotoSansTamil-Bold.ttf)'
        : 'url(/Noto_Sans_Tamil/NotoSansTamil-VariableFont_wdth,wght.ttf)';
      
      console.log('Loading Tamil font for canvas from:', fontUrl);
      const font = new FontFace('NotoSansTamilCanvas', fontUrl);
      
      const loadedFont = await font.load();
      console.log('Tamil font loaded successfully for canvas');
      document.fonts.add(loadedFont);
      await document.fonts.ready;
      return false;
    };
    
    checkFontAvailable().then(() => {
      console.log('Fonts ready, rendering Tamil text to canvas');
      
      // Set canvas font with bold weight - prefer Google Fonts, fallback to local
      const fontWeight = bold ? '700' : '400';
      ctx.font = `${fontWeight} ${fontSize}px "Noto Sans Tamil", NotoSansTamilCanvas, sans-serif`;
      
      // Measure text
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const textHeight = fontSize * 1.8; // Add more padding for better quality
      
      console.log(`Text width: ${textWidth}, height: ${textHeight}`);
      
      // Set canvas size with high DPI for better quality
      const scale = 3; // Higher scale for better quality
      canvas.width = (textWidth + 20) * scale;
      canvas.height = textHeight * scale;
      
      // Scale context for high DPI rendering
      ctx.scale(scale, scale);
      
      // Clear canvas and set font again (needed after resize)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontWeight} ${fontSize}px "Noto Sans Tamil", NotoSansTamilCanvas, sans-serif`;
      ctx.fillStyle = '#000000';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      
      // Enable antialiasing for smoother text
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw text with slight shadow for better readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 1;
      ctx.shadowOffsetX = 0.5;
      ctx.shadowOffsetY = 0.5;
      
      // Draw text centered
      ctx.fillText(text, (textWidth + 20) / 2, textHeight / 2);
      
      // Convert to base64 with high quality
      const imageData = canvas.toDataURL('image/png', 1.0);
      console.log('Tamil text rendered to image successfully');
      resolve(imageData);
    }).catch((error) => {
      console.error('Failed to load Tamil font for canvas:', error);
      resolve('');
    });
  });
};

// Format month for display
const formatMonthDisplay = (month: string): string => {
  const match = month.match(/^([a-z]+)(\d{4})$/i);
  if (match) {
    const monthName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    const year = match[2];
    return `${monthName.toUpperCase()} ${year}`;
  }
  return month.toUpperCase();
};

// Generate Monthly Bill PDF
export const generateMonthlyBillPDF = async (
  companyName: string,
  companyDetails: AccountDetails | undefined,
  monthSchedule: MealSchedule
) => {
  try {
    const logoBase64 = await loadImageAsBase64('/Logo.png');
    const tamilTextImage = await renderTamilTextToImage('குமரி புட்ஸ்', 48, true);
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    await loadTamilTTFFont(pdf);

    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPos = 15;

    const startX = 10;
    const tableWidth = pageWidth - 20;
    const labelWidth = 35; // Width for label column (NAME, BANK, etc.)
    const valueWidth = tableWidth - labelWidth; // Width for value column

    // Draw outer border for entire table
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);

    // 1. Add centered logo at top
    try {
      const logoSize = 15;
      pdf.addImage(logoBase64, 'PNG', (pageWidth - logoSize) / 2, yPos, logoSize, logoSize);
      yPos += logoSize + 2;
    } catch (error) {
      console.log('Logo could not be added');
    }

    // 2. Add centered shop name in Tamil as image
    if (tamilTextImage && tamilTextImage.length > 100) {
      console.log('Using rendered Tamil text image');
      const textImgWidth = 70; // Larger width for better visibility
      const textImgHeight = 12; // Larger height for better quality
      try {
        pdf.addImage(tamilTextImage, 'PNG', (pageWidth - textImgWidth) / 2, yPos - 1, textImgWidth, textImgHeight);
        yPos += textImgHeight + 1;
      } catch (error) {
        console.error('Failed to add Tamil image to PDF:', error);
        // Fallback to text
        pdf.setFontSize(14);
        pdf.setFont('NotoSansTamil', 'normal');
        pdf.text('குமரி ஃபுட்ஸ்', pageWidth / 2, yPos, { align: 'center' });
        yPos += 6;
      }
    } else {
      // Fallback if image rendering fails
      console.log('Using fallback text rendering for shop name');
      pdf.setFontSize(14);
      pdf.setFont('NotoSansTamil', 'normal');
      pdf.text('குமரி ஃபுட்ஸ்', pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
    }

    // 3. Add month at top left
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatMonthDisplay(monthSchedule.month), startX, yPos);
    yPos += 5;

    // Helper to draw a row
    const drawInfoRow = (label: string, value: string, currentY: number) => {
      const rowHeight = 5;

      // Draw cell borders
      pdf.rect(startX, currentY, labelWidth, rowHeight);
      pdf.rect(startX + labelWidth, currentY, valueWidth, rowHeight);

      // Draw text
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, startX + 2, currentY + 3.5);

      pdf.setFont('helvetica', 'normal');
      const textFont = containsTamil(value) ? 'NotoSansTamil' : 'helvetica';
      try {
        pdf.setFont(textFont, 'normal');
      } catch (e) {
        pdf.setFont('helvetica', 'normal');
      }
      pdf.text(value, startX + labelWidth + 2, currentY + 3.5);

      return currentY + rowHeight;
    };

    // 4. Draw account info rows (part of unified table)
    yPos = drawInfoRow('NAME:', companyName.toUpperCase(), yPos);
    yPos = drawInfoRow('BANK:', companyDetails?.bankName || '', yPos);
    yPos = drawInfoRow('ACCOUNT NO:', companyDetails?.accountNumber || '', yPos);
    yPos = drawInfoRow('IFSC CODE:', companyDetails?.ifscCode || '', yPos);

    // 5. Continue unified table - meal entries header (no gap)
    const col1Width = labelWidth; // Date - same width as label column for alignment
    const col2Width = (tableWidth - col1Width) / 3; // Tiffen, Lunch, Dinner

    pdf.setFillColor(200, 200, 200);
    pdf.rect(startX, yPos, tableWidth, 5, 'F');
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');

    // Draw header borders
    pdf.rect(startX, yPos, col1Width, 5);
    pdf.rect(startX + col1Width, yPos, col2Width, 5);
    pdf.rect(startX + col1Width + col2Width, yPos, col2Width, 5);
    pdf.rect(startX + col1Width + col2Width * 2, yPos, col2Width, 5);

    pdf.text('DATE', startX + col1Width / 2, yPos + 3, { align: 'center' });
    pdf.text('TIFFEN', startX + col1Width + col2Width / 2, yPos + 3, { align: 'center' });
    pdf.text('LUNCH', startX + col1Width + col2Width + col2Width / 2, yPos + 3, { align: 'center' });
    pdf.text('DINNER', startX + col1Width + col2Width * 2 + col2Width / 2, yPos + 3, { align: 'center' });

    yPos += 5;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    let tiffenTotal = 0;
    let lunchTotal = 0;
    let dinnerTotal = 0;

    // Filter entries to only include those for the selected month
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthIndex = monthNames.findIndex(name => monthSchedule.month.toLowerCase().replace(/\s/g, '').startsWith(name));

    let selectedMonthEntries = monthSchedule.entries;
    if (monthIndex >= 0) {
      const targetMonth = (monthIndex + 1).toString().padStart(2, '0');
      const targetYear = monthSchedule.month.match(/(\d{4})$/)?.[1];

      if (targetYear) {
        selectedMonthEntries = monthSchedule.entries.filter(entry => {
          const [, month, year] = entry.date.split('-');
          return month === targetMonth && year === targetYear;
        });
      }
    }

    selectedMonthEntries.forEach((entry, index) => {
      const tiffen = entry.tiffen ? parseInt(entry.tiffen.toString()) || 0 : 0;
      const lunch = entry.lunch ? parseInt(entry.lunch.toString()) || 0 : 0;
      const dinner = entry.dinner ? parseInt(entry.dinner.toString()) || 0 : 0;

      tiffenTotal += tiffen;
      lunchTotal += lunch;
      dinnerTotal += dinner;

      // Zebra striping
      if (index % 2 === 0) {
        pdf.setFillColor(248, 248, 248);
        pdf.rect(startX, yPos, tableWidth, 6, 'F');
      }

      // Draw cell borders
      pdf.rect(startX, yPos, col1Width, 6);
      pdf.rect(startX + col1Width, yPos, col2Width, 6);
      pdf.rect(startX + col1Width + col2Width, yPos, col2Width, 6);
      pdf.rect(startX + col1Width + col2Width * 2, yPos, col2Width, 6);

      // Date
      pdf.text(entry.date, startX + col1Width / 2, yPos + 4, { align: 'center' });
      
      // Tiffen
      pdf.text(entry.tiffen?.toString() || '-', startX + col1Width + col2Width / 2, yPos + 4, { align: 'center' });
      
      // Lunch
      pdf.text(entry.lunch?.toString() || '-', startX + col1Width + col2Width + col2Width / 2, yPos + 4, { align: 'center' });
      
      // Dinner
      pdf.text(entry.dinner?.toString() || '-', startX + col1Width + col2Width * 2 + col2Width / 2, yPos + 4, { align: 'center' });

      yPos += 6;

      // Check for page break - removed to ensure single page
    });

    // RATE row
    pdf.setFillColor(210, 210, 210);
    pdf.rect(startX, yPos, tableWidth, 4, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);

    pdf.rect(startX, yPos, col1Width, 4);
    pdf.rect(startX + col1Width, yPos, col2Width, 4);
    pdf.rect(startX + col1Width + col2Width, yPos, col2Width, 4);
    pdf.rect(startX + col1Width + col2Width * 2, yPos, col2Width, 4);

    pdf.text('RATE', startX + col1Width / 2, yPos + 2.5, { align: 'center' });
    pdf.text((monthSchedule.rates?.tiffen || 0).toString(), startX + col1Width + col2Width / 2, yPos + 2.5, { align: 'center' });
    pdf.text((monthSchedule.rates?.lunch || 0).toString(), startX + col1Width + col2Width + col2Width / 2, yPos + 2.5, { align: 'center' });
    pdf.text((monthSchedule.rates?.dinner || 0).toString(), startX + col1Width + col2Width * 2 + col2Width / 2, yPos + 2.5, { align: 'center' });

    yPos += 4;

    // TOTAL row (count x rate format)
    pdf.setFillColor(220, 220, 220);
    pdf.rect(startX, yPos, tableWidth, 4, 'F');

    pdf.rect(startX, yPos, col1Width, 4);
    pdf.rect(startX + col1Width, yPos, col2Width, 4);
    pdf.rect(startX + col1Width + col2Width, yPos, col2Width, 4);
    pdf.rect(startX + col1Width + col2Width * 2, yPos, col2Width, 4);

    pdf.text('TOTAL', startX + col1Width / 2, yPos + 2.5, { align: 'center' });
    pdf.text(`${tiffenTotal}x${monthSchedule.rates?.tiffen || 0}`, startX + col1Width + col2Width / 2, yPos + 2.5, { align: 'center' });
    pdf.text(`${lunchTotal}x${monthSchedule.rates?.lunch || 0}`, startX + col1Width + col2Width + col2Width / 2, yPos + 2.5, { align: 'center' });
    pdf.text(`${dinnerTotal}x${monthSchedule.rates?.dinner || 0}`, startX + col1Width + col2Width * 2 + col2Width / 2, yPos + 2.5, { align: 'center' });

    yPos += 4;

    // AMOUNT row
    pdf.setFillColor(230, 230, 230);
    pdf.rect(startX, yPos, tableWidth, 4, 'F');

    pdf.rect(startX, yPos, col1Width, 4);
    pdf.rect(startX + col1Width, yPos, col2Width, 4);
    pdf.rect(startX + col1Width + col2Width, yPos, col2Width, 4);
    pdf.rect(startX + col1Width + col2Width * 2, yPos, col2Width, 4);

    const tiffenAmount = tiffenTotal * (monthSchedule.rates?.tiffen || 0);
    const lunchAmount = lunchTotal * (monthSchedule.rates?.lunch || 0);
    const dinnerAmount = dinnerTotal * (monthSchedule.rates?.dinner || 0);

    pdf.text('AMOUNT', startX + col1Width / 2, yPos + 2.5, { align: 'center' });
    pdf.text(tiffenAmount.toString(), startX + col1Width + col2Width / 2, yPos + 2.5, { align: 'center' });
    pdf.text(lunchAmount.toString(), startX + col1Width + col2Width + col2Width / 2, yPos + 2.5, { align: 'center' });
    pdf.text(dinnerAmount.toString(), startX + col1Width + col2Width * 2 + col2Width / 2, yPos + 2.5, { align: 'center' });

    yPos += 4;

    // GRAND TOTAL row - label at left, amount at right
    pdf.setFillColor(255, 220, 150);
    pdf.rect(startX, yPos, tableWidth, 5, 'F');
    pdf.setFontSize(8);

    pdf.rect(startX, yPos, tableWidth, 5);

    const grandTotal = tiffenAmount + lunchAmount + dinnerAmount;
    pdf.text('GRAND TOTAL', startX + 5, yPos + 3.5);
    pdf.text(grandTotal.toFixed(2), startX + tableWidth - 5, yPos + 3.5, { align: 'right' });

    // Save PDF
    pdf.save(`${companyName}_${formatMonthDisplay(monthSchedule.month)}_Bill.pdf`);
  } catch (error) {
    console.error('Failed to generate bill PDF:', error);
    alert('Failed to generate bill. Please try again.');
  }
};