// pdfGenerator.js
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Design Constants
const COLORS = {
  primary: '#2c3e50',
  secondary: '#7f8c8d',
  border: '#e0e0e0',
  text: '#2c3e50',
  lightText: '#7f8c8d',
  accent: '#3498db',
  success: '#27ae60',
  background: '#f9f9f9'
};

const FONTS = {
  xl: 28,
  large: 20,
  medium: 14,
  small: 10,
  xsmall: 8
};

const MARGIN = 50;
const PAGE_WIDTH = 612; // Standard US Letter width in points
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

function generateHeader(doc, data = {}) {
  const logoPath = data.logo || path.join(__dirname, '../../public/logo.png');
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Set default styles
  doc.fillColor(COLORS.primary);
  
  // Add logo if it exists
  try {
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, MARGIN, MARGIN, { width: 120 });
    } else {
      doc.fontSize(FONTS.xl)
         .font('Helvetica-Bold')
         .text('INVOICE', MARGIN, MARGIN + 10);
    }
  } catch (error) {
    doc.fontSize(FONTS.xl)
       .font('Helvetica-Bold')
       .text('INVOICE', MARGIN, MARGIN + 10);
  }
  
  // Invoice info
  doc
    .fontSize(FONTS.medium)
    .fillColor(COLORS.lightText)
    .text('INVOICE', MARGIN, MARGIN + 60)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text(`#${data.orderId}`, MARGIN, MARGIN + 80)
    .font('Helvetica')
    .fillColor(COLORS.lightText)
    .text('Date Issued', MARGIN, MARGIN + 105)
    .font('Helvetica')
    .fillColor(COLORS.text)
    .text(currentDate, MARGIN, MARGIN + 120)
    .moveDown();
    
  // Divider
  doc
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(MARGIN, MARGIN + 150)
    .lineTo(PAGE_WIDTH - MARGIN, MARGIN + 150)
    .stroke();
}

function generateCustomerInformation(doc, data) {
  const customer = data.customer || {};
  const address = customer.address || {};
  
  // Billing Address
  doc
    .font('Helvetica-Bold')
    .fontSize(FONTS.small)
    .fillColor(COLORS.primary)
    .text('BILL TO', MARGIN, MARGIN + 180)
    .moveDown(0.5);
    
  doc
    .font('Helvetica')
    .fontSize(FONTS.small)
    .fillColor(COLORS.text)
    .text(customer.name || 'Guest Customer', MARGIN, MARGIN + 200)
    .text(customer.email || 'No email provided', MARGIN, MARGIN + 215);
    
  const addressLines = [
    address.street,
    [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
    address.country
  ].filter(Boolean);
  
  addressLines.forEach((line, index) => {
    doc.text(line, MARGIN, MARGIN + 230 + (index * 15));
  });
}

function generateInvoiceTable(doc, data) {
  const tableTop = MARGIN + 300;
  const itemWidth = 350;
  const quantityWidth = 70;
  const priceWidth = 100;
  const lineItemHeight = 30;
  
  // Table header
  doc
    .font('Helvetica-Bold')
    .fontSize(FONTS.small)
    .fillColor(COLORS.primary)
    .text('ITEM', MARGIN, tableTop + 10)
    .text('QTY', MARGIN + itemWidth, tableTop + 10)
    .text('PRICE', MARGIN + itemWidth + quantityWidth, tableTop + 10, { width: priceWidth, align: 'right' });
    
  // Divider
  doc
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(MARGIN, tableTop + 35)
    .lineTo(PAGE_WIDTH - MARGIN, tableTop + 35)
    .stroke();
    
  // Table rows
  doc.font('Helvetica').fontSize(FONTS.small).fillColor(COLORS.text);
  
  data.items.forEach((item, index) => {
    const position = tableTop + 50 + (index * lineItemHeight);
    const itemName = item.variant ? `${item.name} (${item.variant})` : item.name;
    
    doc.text(itemName, MARGIN, position, { width: itemWidth - 20, align: 'left' });
    doc.text(item.quantity.toString(), MARGIN + itemWidth, position);
    doc.text(
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(item.price), 
      MARGIN + itemWidth + quantityWidth, 
      position, 
      { width: priceWidth, align: 'right' }
    );
    
    // Light divider between items
    if (index < data.items.length - 1) {
      doc
        .strokeColor(COLORS.border)
        .lineWidth(0.5)
        .moveTo(MARGIN, position + 20)
        .lineTo(PAGE_WIDTH - MARGIN, position + 20)
        .stroke();
    }
  });
  
  // Totals
  const totalsTop = tableTop + 60 + (data.items.length * lineItemHeight);
  generateTotalRow(doc, 'Subtotal', data.subtotal, totalsTop);
  
  if (data.tax > 0) {
    generateTotalRow(doc, 'Tax', data.tax, totalsTop + 25);
  }
  
  doc.font('Helvetica-Bold');
  generateTotalRow(doc, 'TOTAL', data.total, totalsTop + (data.tax > 0 ? 55 : 30), true);
  
  // Payment terms
  doc
    .font('Helvetica')
    .fontSize(FONTS.xsmall)
    .fillColor(COLORS.lightText)
    .text('Payment is due within 15 days. Thank you for your business!', MARGIN, totalsTop + 80);
}

function generateTotalRow(doc, label, value, y, isTotal = false) {
  doc
    .fontSize(isTotal ? FONTS.medium : FONTS.small)
    .fillColor(isTotal ? COLORS.primary : COLORS.text)
    .text(
      label, 
      PAGE_WIDTH - MARGIN - 200, 
      y, 
      { width: 100, align: 'right' }
    )
    .text(
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value),
      PAGE_WIDTH - MARGIN - 100,
      y,
      { width: 100, align: 'right' }
    );
}

function generateFooter(doc) {
  const footerY = 700;
  
  doc
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(MARGIN, footerY)
    .lineTo(PAGE_WIDTH - MARGIN, footerY)
    .stroke();
    
  doc
    .fontSize(FONTS.xsmall)
    .fillColor(COLORS.lightText)
    .text('Thank you for your business!', MARGIN, footerY + 15)
    .text('Questions? Email us at support@yourstore.com', MARGIN, footerY + 35);
    
  // Company info
  doc
    .text('Your Company Name', PAGE_WIDTH - MARGIN - 150, footerY + 15, { align: 'right' })
    .text('123 Business Street', PAGE_WIDTH - MARGIN - 150, footerY + 30, { align: 'right' })
    .text('New York, NY 10001', PAGE_WIDTH - MARGIN - 150, footerY + 45, { align: 'right' });
}

export const generateInvoicePDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: MARGIN,
        bufferPages: true
      });
      
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      try {
        doc.font('Helvetica');
        generateHeader(doc, data);
        generateCustomerInformation(doc, data);
        generateInvoiceTable(doc, data);
        generateFooter(doc);
        
        // Add page numbers
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          
          doc
            .fontSize(FONTS.xsmall)
            .fillColor(COLORS.lightText)
            .text(
              `Page ${i + 1} of ${pages.count}`,
              MARGIN,
              doc.page.height - MARGIN / 2,
              { align: 'right' }
            );
        }
      } catch (error) {
        console.error('Error generating PDF content:', error);
        doc
          .fontSize(FONTS.medium)
          .fillColor(COLORS.primary)
          .text(
            'Error generating invoice. Please try again or contact support.',
            MARGIN,
            100
          );
      }

      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
};

export default {
  generateInvoicePDF
};