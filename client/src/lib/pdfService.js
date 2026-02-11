import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB');
};

// Helper to format currency
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return `${parseFloat(amount).toFixed(2)} BGN`;
};

// Service type translations
const serviceTypeMap = {
  'застраховка': 'Insurance',
  'винетка': 'Vignette',
  'преглед': 'Technical Inspection',
  'каско': 'Casco Insurance',
  'данък': 'Tax',
  'пожарогасител': 'Fire Extinguisher',
  'ремонт': 'Repair',
  'обслужване': 'Maintenance',
  'гуми': 'Tires',
  'зареждане': 'Refuel',
  'друго': 'Other',
  'гражданска': 'Civil Liability'
};

const translateServiceType = (type) => {
  return serviceTypeMap[type?.toLowerCase()] || type || 'N/A';
};

export const generateCarReport = async (car, services) => {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Header with dark background (site colors: #1a1a1a)
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Logo/Icon
  doc.setFontSize(32);
  doc.setTextColor(255, 255, 255);
  doc.text('🚗', 15, 22);
  
  // Brand name
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('CarGuard', 30, 20);
  
  // Tagline
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Your Digital Car Assistant', 30, 28);
  
  // Report Title with red accent (#dc3545)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 53, 69);
  const title = 'VEHICLE SERVICE REPORT';
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (210 - titleWidth) / 2, 36);
  
  // Reset colors to dark gray (#2d2d2d)
  doc.setTextColor(45, 45, 45);
  
  // Add date
  let yPos = 50;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${formatDate(new Date())}`, 20, yPos);
  
  // Car Title
  yPos = 62;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);
  doc.text(`${car.brand} ${car.model}`, 20, yPos);
  
  // Divider line with red color (#dc3545)
  yPos = 68;
  doc.setDrawColor(220, 53, 69);
  doc.setLineWidth(0.8);
  doc.line(20, yPos, 190, yPos);
  
  // Section 1: Technical Data
  yPos = 76;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);
  doc.text('Technical Specifications', 20, yPos);
  
  yPos += 5;
  const techData = [
    ['Brand', car.brand || 'N/A'],
    ['Model', car.model || 'N/A'],
    ['Year', car.year || 'N/A'],
    ['Registration Number', car.registrationNumber || 'N/A'],
    ['VIN', car.vin || 'N/A'],
    ['Fuel Type', car.fuelType || 'N/A'],
    ['Engine Size', car.engineSize ? `${car.engineSize} L` : 'N/A'],
    ['Horse Power', car.horsePower ? `${car.horsePower} HP` : 'N/A'],
    ['Mileage', car.mileage ? `${car.mileage} km` : 'N/A'],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: techData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3,
      textColor: [45, 45, 45],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60, textColor: [26, 26, 26] },
      1: { cellWidth: 110 },
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
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);
  doc.text('Active Services', 20, yPos);
  
  yPos += 5;
  
  if (activeServices.length > 0) {
    const activeServicesData = activeServices.map(s => [
      translateServiceType(s.serviceType),
      formatDate(s.expiryDate),
      formatCurrency(s.cost),
      s.mileage ? `${s.mileage} km` : 'N/A',
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Service', 'Valid Until', 'Cost', 'Mileage']],
      body: activeServicesData,
      theme: 'striped',
      headStyles: {
        fillColor: [220, 53, 69], // #dc3545
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: [45, 45, 45],
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250], // Light gray
      },
      margin: { left: 20, right: 20 },
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141);
    doc.text('No active services', 25, yPos + 5);
    yPos += 20;
  }
  
  // Check if we need a new page
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  // Section 3: Service History
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);
  doc.text('Service History', 20, yPos);
  
  yPos += 5;
  
  if (services.length > 0) {
    // Sort by date descending
    const sortedServices = [...services].sort((a, b) => 
      new Date(b.expiryDate) - new Date(a.expiryDate)
    );
    
    const historyData = sortedServices.map(s => {
      const row = [
        formatDate(s.expiryDate),
        translateServiceType(s.serviceType),
        formatCurrency(s.cost),
      ];
      
      // Add fuel info if it's a refuel
      if (s.serviceType?.toLowerCase() === 'зареждане' && s.liters) {
        row.push(`${s.liters} L`);
        row.push(s.pricePerLiter ? formatCurrency(s.pricePerLiter) : 'N/A');
      } else {
        row.push('N/A');
        row.push('N/A');
      }
      
      // Add mileage if available
      row.push(s.mileage ? `${s.mileage} km` : 'N/A');
      
      return row;
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Service', 'Cost', 'Fuel', 'Price/L', 'Mileage']],
      body: historyData,
      theme: 'grid',
      headStyles: {
        fillColor: [45, 45, 45], // #2d2d2d
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [45, 45, 45],
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
          `Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
          105,
          285,
          { align: 'center' }
        );
      },
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141);
    doc.text('No service history recorded', 25, yPos + 5);
    yPos += 15;
  }
  
  // Check if we need a new page for summary
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  // Section 4: Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);
  doc.text('Financial Summary', 20, yPos);
  
  yPos += 5;
  
  // Calculate totals
  const totalServices = services.length;
  const totalCost = services.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0);
  const fuelServices = services.filter(s => s.serviceType?.toLowerCase() === 'зареждане');
  const totalFuelLiters = fuelServices.reduce((sum, s) => sum + (parseFloat(s.liters) || 0), 0);
  const totalFuelCost = fuelServices.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0);
  
  const summaryData = [
    ['Total Services', `${totalServices}`],
    ['Total Cost', formatCurrency(totalCost)],
    ['Total Fuel Consumed', totalFuelLiters > 0 ? `${totalFuelLiters.toFixed(2)} L` : 'N/A'],
    ['Total Fuel Cost', totalFuelCost > 0 ? formatCurrency(totalFuelCost) : 'N/A'],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: summaryData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3,
      textColor: [45, 45, 45],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80, textColor: [26, 26, 26] },
      1: { cellWidth: 90, fontStyle: 'bold', textColor: [220, 53, 69] }, // Red accent
    },
    margin: { left: 20 },
  });
  
  // Footer on last page
  const pageCount = doc.internal.getNumberOfPages();
  doc.setPage(pageCount);
  doc.setFontSize(8);
  doc.setTextColor(127, 140, 141);
  doc.text('Generated by CarGuard - Your Digital Car Assistant', 105, 287, { align: 'center' });
  
  // Save the PDF
  const fileName = `${car.brand}_${car.model}_${car.registrationNumber || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
