import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

// --- OLD LOGIC HELPERS (for backward compatibility) ---
const containsTamil = (text: string): boolean => /[\u0B80-\u0BFF]/.test(text);

const renderTamilTextToImage = (text: string, fontSize: number = 14, bold: boolean = false): Promise<string> => {
  return new Promise((resolve) => {
    document.fonts.ready.then(() => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(''); return; }
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
      ctx.fillText(text, (textWidth + 20) / 2, textHeight / 2);
      resolve(canvas.toDataURL('image/png', 1.0));
    }).catch(() => resolve(''));
  });
};

const loadImageAsBase64 = (imagePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.drawImage(img, 0, 0); resolve(canvas.toDataURL('image/png')); }
      else reject(new Error('Failed context'));
    };
    img.onerror = () => reject(new Error('Failed load'));
    img.crossOrigin = 'anonymous';
    img.src = imagePath;
  });
};

// --- NEW LOGIC (html2canvas) ---
const generateFromElement = async (element: HTMLElement, fileName: string) => {
  try {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.padding = '20px';
    clone.style.background = 'white';
    clone.style.width = '800px';

    // Clean up clone: remove buttons and replace inputs
    const buttons = clone.querySelectorAll('button');
    buttons.forEach(b => b.remove());

    const inputs = clone.querySelectorAll('input');
    inputs.forEach(input => {
      const span = document.createElement('span');
      span.textContent = (input as HTMLInputElement).value || '-';
      span.style.display = 'block';
      span.style.textAlign = 'center';
      span.className = 'noto-sans-tamil';
      input.parentNode?.replaceChild(span, input);
    });

    const header = document.createElement('div');
    header.style.textAlign = 'center';
    header.style.marginBottom = '10px';
    header.style.padding = '10px';
    header.style.position = 'relative';
    header.innerHTML = `
      <div style="position: absolute; top: 10px; right: 10px; font-weight: bold; font-size: 14px; color: #0064C8;">Phone: 9677012455</div>
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;">
        <img src="/Logo.png" style="height: 60px; width: auto;" />
        <h1 style="font-size: 28px; font-weight: 800; color: #000000; margin: 0;" class="noto-sans-tamil">குமரி புட்ஸ்</h1>
      </div>
    `;
    clone.insertBefore(header, clone.firstChild);

    // Add footer with address
    const footer = document.createElement('div');
    footer.style.textAlign = 'center';
    footer.style.marginTop = '20px';
    footer.style.padding = '10px';
    footer.style.paddingBottom = '30px'; // Extra padding to prevent cutoff
    footer.innerHTML = `
      <div style="font-size: 12px; color: #000000;">No: 28/19, Kalavanar Nagar, Thirupathi Kudai Salai, Ambattur, Chennai-600 058</div>
    `;
    clone.appendChild(footer);

    // Ensure table lines are visible and clean
    const table = clone.querySelector('table');
    if (table) {
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.border = '2px solid #000000';

      const cells = clone.querySelectorAll('th, td');
      cells.forEach(cell => {
        (cell as HTMLElement).style.border = '1px solid #000000';
        (cell as HTMLElement).style.padding = '8px';
        (cell as HTMLElement).style.color = '#000000';
      });

      const headers = clone.querySelectorAll('th');
      headers.forEach(h => {
        (h as HTMLElement).style.backgroundColor = '#f0f0f0';
      });
    }

    // Fix oklch error by overriding CSS variables with hex values in the clone
    const styleOverride = document.createElement('style');
    styleOverride.textContent = `
      * {
        --background: #ffffff !important;
        --foreground: #1e293b !important;
        --card: #ffffff !important;
        --card-foreground: #1e293b !important;
        --popover: #ffffff !important;
        --popover-foreground: #1e293b !important;
        --primary: #ef4444 !important;
        --primary-foreground: #ffffff !important;
        --secondary: #f1f5f9 !important;
        --secondary-foreground: #1e293b !important;
        --muted: #f1f5f9 !important;
        --muted-foreground: #64748b !important;
        --accent: #f1f5f9 !important;
        --accent-foreground: #1e293b !important;
        --destructive: #ef4444 !important;
        --destructive-foreground: #ffffff !important;
        --border: #e2e8f0 !important;
        --input: #e2e8f0 !important;
        --ring: #94a3b8 !important;
      }
      
      /* Force standard colors on common elements */
      .bg-background { background-color: #ffffff !important; }
      .text-foreground { color: #1e293b !important; }
      .border-border { border-color: #e2e8f0 !important; }
      .bg-card { background-color: #ffffff !important; }
      .bg-primary { background-color: #ef4444 !important; }
      .text-primary-foreground { color: #ffffff !important; }
      
      body, html {
        background-color: #ffffff !important;
        color: #1e293b !important;
      }
    `;
    clone.appendChild(styleOverride);
    clone.classList.add('clone-root');

    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    document.body.appendChild(clone);

    const images = Array.from(clone.querySelectorAll('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
    }));

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const allElements = clonedDoc.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i] as HTMLElement;
          const style = window.getComputedStyle(el);

          if (style.backgroundColor.includes('oklch')) el.style.backgroundColor = '#ffffff';
          if (style.color.includes('oklch')) el.style.color = '#1e293b';
          if (style.borderColor.includes('oklch')) el.style.borderColor = '#e2e8f0';
          if (style.outlineColor.includes('oklch')) el.style.outlineColor = 'transparent';
          if (style.boxShadow.includes('oklch')) el.style.boxShadow = 'none';
          if (style.fill.includes('oklch')) el.style.fill = 'currentColor';
          if (style.stroke.includes('oklch')) el.style.stroke = 'currentColor';
        }
      }
    });
    document.body.removeChild(clone);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};

// --- MAIN EXPORT (Backward Compatible) ---
export const generateWeeklySchedulePDF = async (
  arg1: string | any,
  arg2?: string | AccountDetails,
  arg3?: WeeklySchedule
) => {
  // Check if it's the old signature (3 arguments, last one is a schedule object)
  if (arg3 && typeof arg3 === 'object' && 'entries' in arg3) {
    const companyName = arg1 as string;
    const weekSchedule = arg3 as WeeklySchedule;

    // Try to find the dialog element to use html2canvas even for the old caller
    const dialogElement = document.querySelector('[role="dialog"]') as HTMLElement;
    if (dialogElement) {
      // Find the card or table inside the dialog
      const tableContainer = dialogElement.querySelector('.space-y-4') as HTMLElement;
      if (tableContainer) {
        return await generateFromElement(tableContainer, `${companyName}_Weekly_${weekSchedule.weekStartDate}`);
      }
    }

    // Fallback to old jsPDF logic if element not found
    try {
      const logoBase64 = await loadImageAsBase64('/Logo.png');
      const tamilTextImage = await renderTamilTextToImage('குமரி புட்ஸ்', 48, true);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 15;
      const startX = 10;
      const tableWidth = pageWidth - 20;
      const dayColumnWidth = 35;
      const mealColumnWidth = (tableWidth - dayColumnWidth) / 3;

      try {
        const logoSize = 15;
        pdf.addImage(logoBase64, 'PNG', (pageWidth - logoSize) / 2, yPos, logoSize, logoSize);
        yPos += logoSize + 2;
      } catch (e) { }

      if (tamilTextImage) {
        pdf.addImage(tamilTextImage, 'PNG', (pageWidth - 70) / 2, yPos - 1, 70, 12);
        yPos += 17;
      } else yPos += 10;

      pdf.setFillColor(200, 200, 200);
      pdf.rect(startX, yPos, tableWidth, 8, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DAY', startX + dayColumnWidth / 2, yPos + 5, { align: 'center' });
      pdf.text('TIFFEN', startX + dayColumnWidth + mealColumnWidth / 2, yPos + 5, { align: 'center' });
      pdf.text('LUNCH', startX + dayColumnWidth + mealColumnWidth + mealColumnWidth / 2, yPos + 5, { align: 'center' });
      pdf.text('DINNER', startX + dayColumnWidth + mealColumnWidth * 2 + mealColumnWidth / 2, yPos + 5, { align: 'center' });
      yPos += 8;

      const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of days) {
        const entry = weekSchedule.entries.find(e => e.day === day);
        pdf.rect(startX, yPos, dayColumnWidth, 15);
        pdf.rect(startX + dayColumnWidth, yPos, mealColumnWidth, 15);
        pdf.rect(startX + dayColumnWidth + mealColumnWidth, yPos, mealColumnWidth, 15);
        pdf.rect(startX + dayColumnWidth + mealColumnWidth * 2, yPos, mealColumnWidth, 15);
        pdf.text(DAY_LABELS[day].toUpperCase(), startX + dayColumnWidth / 2, yPos + 8, { align: 'center' });

        const meals = [entry?.tiffen, entry?.lunch, entry?.dinner];
        for (let i = 0; i < 3; i++) {
          const text = meals[i]?.toString() || '-';
          const x = startX + dayColumnWidth + (i * mealColumnWidth) + mealColumnWidth / 2;
          if (containsTamil(text) && text !== '-') {
            const img = await renderTamilTextToImage(text, 12);
            if (img) pdf.addImage(img, 'PNG', x - 12, yPos + 3.5, 24, 8);
          } else {
            pdf.setFont('helvetica', 'normal');
            pdf.text(text, x, yPos + 8, { align: 'center' });
          }
        }
        yPos += 15;
      }
      pdf.save(`${companyName}_Weekly_${weekSchedule.weekStartDate}.pdf`);
    } catch (error) {
      console.error('Old logic failed:', error);
    }
  } else {
    // New signature: (elementId, fileName)
    const element = document.getElementById(arg1 as string);
    if (element) {
      await generateFromElement(element, arg2 as string);
    } else {
      console.error('Element not found:', arg1);
    }
  }
};
