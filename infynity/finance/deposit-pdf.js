import { jsPDF } from 'jspdf';
import { depositAmount, depositCopy, depositDate } from './deposit-order.mjs';

const ink = '#0F3D47';
const ice = '#F4F8FA';
const peach = '#F59E7B';
const muted = '#4D626B';
const line = '#CDD7DC';
const margin = 48;

export function createDepositPdf(order, language) {
  const copy = depositCopy(language);
  const pdf = new jsPDF({ unit: 'pt', format: 'letter', compress: true });
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  pdf.setProperties({ title: copy.title + ' ' + order.folio, author: 'UNIVERSHZRW', subject: 'INFYNITY · SPEI' });
  pdf.setLanguage(copy.locale);

  function text(value, x, y, size, color = ink, font = 'normal') {
    pdf.setFont('helvetica', font).setFontSize(size).setTextColor(color);
    pdf.text(String(value).normalize('NFC').replace(/[\x00-\x1f\x7f]/g, ' '), x, y);
  }

  function rule(y) {
    pdf.setDrawColor(line).setLineWidth(0.6).line(margin, y, margin + width, y);
  }

  function field(label, value, y, size = 13) {
    text(label, margin, y, 10, muted);
    pdf.setFont('helvetica', 'bold').setFontSize(size);
    const lines = pdf.splitTextToSize(value, width);
    lines.forEach((part, index) => text(part, margin, y + 19 + index * 16, size, ink, 'bold'));
    return y + 36 + lines.length * 16;
  }

  pdf.setFillColor(peach).rect(margin, 45, 30, 3, 'F');
  text('INFYNITY / UNIVERSHZRW', margin, 68, 11, ink, 'bold');
  text(copy.title, margin, 110, 30, ink, 'bold');

  pdf.setFillColor(ice).roundedRect(margin, 135, width, 79, 8, 8, 'F');
  text(copy.amount, margin + 16, 159, 10, muted);
  text(depositAmount(order.amount, copy.locale), margin + 16, 187, 24, ink, 'bold');
  text(copy.date, margin + 323, 159, 10, muted);
  text(depositDate(order.createdAt, copy.locale), margin + 323, 185, 12, ink, 'bold');

  let y = field(copy.bank, order.receiver.name, 244);
  y = field(copy.holder, order.receiver.holder, y);
  y = field(copy.clabe, order.receiver.clabe, y, 19);
  y = field(copy.reference, order.folio, y);
  rule(y - 12);
  text(copy.stepsTitle, margin, y + 10, 13, ink, 'bold');
  y += 29;
  copy.steps.forEach((step, index) => {
    text(String(index + 1) + '.', margin, y, 10, ink, 'bold');
    pdf.setFont('helvetica', 'normal').setFontSize(10);
    const lines = pdf.splitTextToSize(step, width - 19);
    lines.forEach((part, lineIndex) => text(part, margin + 19, y + lineIndex * 14, 10));
    y += lines.length * 14 + 8;
  });
  rule(y + 4);
  text(copy.footer, margin, y + 24, 9, muted);
  text('univershzrw.com/criptomoneda/panel', margin, y + 41, 9);
  return pdf;
}

export function downloadDepositPdf(order, language) {
  createDepositPdf(order, language).save('INFYNITY-SPEI-' + order.folio + '.pdf');
}
