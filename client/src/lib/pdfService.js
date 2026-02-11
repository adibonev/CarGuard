import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('bg-BG');
};

// Helper to format currency
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return `${parseFloat(amount).toFixed(2)} лв.`;
};

export const generateCarReport = async (car, services) => {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Title
  doc.setFontSize(22);
  doc.setTextColor(52, 73, 94);
  doc.text('🚗 СЕРВИЗЕН ДОКЛАД НА АВТОМОБИЛА', 105, 20, { align: 'center' });
  
  // Subtitle with car info
  doc.setFontSize(16);
  doc.setTextColor(44, 62, 80);
  doc.text(`${car.brand} ${car.model}`, 105, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(127, 140, 141);
  doc.text(`Генериран на: ${formatDate(new Date().toISOString())}`, 105, 36, { align: 'center' });
  
  // Divider line
  doc.setDrawColor(52, 152, 219);
  doc.setLineWidth(0.5);
  doc.line(20, 40, 190, 40);
  
  let yPos = 50;
  
  // Section 1: Technical Data
  doc.setFontSize(14);
  doc.setTextColor(41, 128, 185);
  doc.text('📋 ТЕХНИЧЕСКИ ДАННИ', 20, yPos);
  
  yPos += 8;
  
  const techData = [
    ['Марка', car.brand || 'N/A'],
    ['Модел', car.model || 'N/A'],
    ['Година', car.year || 'N/A'],
    ['Рег. номер', car.registrationNumber || 'N/A'],
    ['VIN номер', car.vin || 'N/A'],
    ['Тип гориво', car.fuelType || 'N/A'],
    ['Обем двигател', car.engineSize ? `${car.engineSize} л` : 'N/A'],
    ['Мощност', car.horsePower ? `${car.horsePower} к.с.` : 'N/A'],
    ['Километраж', car.mileage ? `${car.mileage} км` : 'N/A'],
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: techData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3,
      textColor: [44, 62, 80],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 120 },
    },
    margin: { left: 20 },
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Section 2: Active Services
  const activeServices = services.filter(s => {
    const expiryDate = new Date(s.expiryDate);
    return expiryDate >= new Date();
  });
  
  doc.setFontSize(14);
  doc.setTextColor(41, 128, 185);
  doc.text('✅ АКТИВНИ УСЛУГИ', 20, yPos);
  
  yPos += 5;
  
  if (activeServices.length > 0) {
    const activeServicesData = activeServices.map(s => [
      s.serviceType || 'N/A',
      formatDate(s.expiryDate),
      formatCurrency(s.cost),
      s.mileage ? `${s.mileage} км` : 'N/A',
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Услуга', 'Валидна до', 'Цена', 'Километраж']],
      body: activeServicesData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      margin: { left: 20, right: 20 },
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141);
    doc.text('Няма активни услуги', 25, yPos + 5);
    yPos += 20;
  }
  
  // Check if we need a new page
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  // Section 3: Service History
  doc.setFontSize(14);
  doc.setTextColor(41, 128, 185);
  doc.text('🔧 СЕРВИЗНА ИСТОРИЯ', 20, yPos);
  
  yPos += 5;
  
  if (services.length > 0) {
    // Sort services by date (newest first)
    const sortedServices = [...services].sort((a, b) => 
      new Date(b.expiryDate) - new Date(a.expiryDate)
    );
    
    const historyData = sortedServices.map(s => {
      const row = [
        formatDate(s.expiryDate),
        s.serviceType || 'N/A',
        formatCurrency(s.cost),
      ];
      
      // Add fuel data if available
      if (s.fuelType && s.liters) {
        row.push(`${s.liters} л ${s.fuelType}`);
        row.push(formatCurrency(s.pricePerLiter) + '/л');
      } else {
        row.push('N/A');
        row.push('N/A');
      }
      
      // Add mileage if available
      row.push(s.mileage ? `${s.mileage} км` : 'N/A');
      
      return row;
    });
    
    doc.autoTable({
      startY: yPos,
      head: [['Дата', 'Услуга', 'Цена', 'Гориво', 'Цена/литър', 'Километраж']],
      body: historyData,
      theme: 'grid',
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 45 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
      },
      margin: { left: 20, right: 20 },
      didDrawPage: (data) => {
        // Add page number
        doc.setFontSize(8);
        doc.setTextColor(127, 140, 141);
        doc.text(
          `Страница ${doc.internal.getCurrentPageInfo().pageNumber}`,
          105,
          287,
          { align: 'center' }
        );
      },
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141);
    doc.text('Няма записана сервизна история', 25, yPos + 5);
    yPos += 15;
  }
  
  // Summary section at the end
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  yPos += 10;
  doc.setDrawColor(52, 152, 219);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  
  yPos += 8;
  
  // Calculate total costs
  const totalCost = services.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0);
  const totalFuelLiters = services.reduce((sum, s) => sum + (parseFloat(s.liters) || 0), 0);
  const totalFuelCost = services
    .filter(s => s.liters && s.pricePerLiter)
    .reduce((sum, s) => sum + (parseFloat(s.liters) * parseFloat(s.pricePerLiter)), 0);
  
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.text('📊 ОБОБЩЕНИЕ', 20, yPos);
  
  yPos += 8;
  
  const summaryData = [
    ['Общо услуги', services.length.toString()],
    ['Обща стойност на услуги', formatCurrency(totalCost)],
    ['Общо изразходвано гориво', totalFuelLiters > 0 ? `${totalFuelLiters.toFixed(2)} л` : 'N/A'],
    ['Обща стойност на гориво', totalFuelCost > 0 ? formatCurrency(totalFuelCost) : 'N/A'],
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: summaryData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3,
      textColor: [44, 62, 80],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { cellWidth: 90, fontStyle: 'bold', textColor: [41, 128, 185] },
    },
    margin: { left: 20 },
  });
  
  // Footer on last page
  const pageCount = doc.internal.getNumberOfPages();
  doc.setPage(pageCount);
  doc.setFontSize(8);
  doc.setTextColor(127, 140, 141);
  doc.text('Генерирано от CarGuard - Вашият дигитален автомобилен асистент', 105, 287, { align: 'center' });
  
  // Save the PDF
  const fileName = `${car.brand}_${car.model}_${car.registrationNumber || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
