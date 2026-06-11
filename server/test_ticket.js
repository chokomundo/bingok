import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ticketsFilePath = path.join(__dirname, '../public/bingo_tickets.json');
const downloadsFilePath = path.join(__dirname, '../public/bingo_downloads_log.json');
const authorizedFilePath = path.join(__dirname, '../public/bingo_authorized_ids.json');
const sellerRowsFilePath = path.join(__dirname, '../public/bingo_seller_rows.json');

const userPhoneNumber = '179663448105001';
const lowerText = '1773';

function extractTicketNumbers(text) {
  const matches = text.match(/\b\d{1,5}\b/g);
  if (matches && matches.length > 0) {
    const unique = [...new Set(matches.map(m => {
      const num = parseInt(m, 10);
      return String(num).padStart(5, '0');
    }))];
    return unique;
  }
  return [];
}

function isMatchSellerId(seller, userPhoneNumber) {
  const sId = (typeof seller === 'object' && seller !== null) ? seller.id : seller;
  if (!sId) return false;
  const ids = String(sId).split(/[\n,\s;]+/).map(x => x.trim()).filter(Boolean);
  return ids.includes(String(userPhoneNumber).trim());
}

function isRowMatchingSeller(row, registeredName, userPhoneNumber, sellerObj) {
  if (!row.name) return false;
  const rowNameClean = row.name.toLowerCase().trim();
  if (registeredName && rowNameClean === registeredName.toLowerCase().trim()) return true;
  if (rowNameClean === String(userPhoneNumber).trim()) return true;
  if (sellerObj) {
    const sId = (typeof sellerObj === 'object' && sellerObj !== null) ? sellerObj.id : sellerObj;
    if (sId) {
      const ids = String(sId).split(/[\n,\s;]+/).map(x => x.trim()).filter(Boolean);
      if (ids.some(id => rowNameClean === id.toLowerCase())) return true;
    }
  }
  return false;
}

const ticketNumbers = extractTicketNumbers(lowerText);
console.log('ticketNumbers:', ticketNumbers);

let authorized = JSON.parse(fs.readFileSync(authorizedFilePath, 'utf-8'));
const isAuthorized = authorized.some(seller => isMatchSellerId(seller, userPhoneNumber));
console.log('isAuthorized:', isAuthorized);

const matchedSellerObj = authorized.find(seller => isMatchSellerId(seller, userPhoneNumber));
const registeredName = (matchedSellerObj && typeof matchedSellerObj === 'object') ? (matchedSellerObj.name || '') : '';
console.log('registeredName:', registeredName);

let sellerRows = JSON.parse(fs.readFileSync(sellerRowsFilePath, 'utf-8'));
const matchedSellerRows = sellerRows.filter(row => isRowMatchingSeller(row, registeredName, userPhoneNumber, matchedSellerObj));
console.log('matchedSellerRows count:', matchedSellerRows.length);
console.log('matchedSellerRows names:', matchedSellerRows.map(r => r.name));

const allAssignedNumbers = matchedSellerRows.flatMap(row => row.numbers);
const allAssignedNumbersSet = new Set(allAssignedNumbers.map(num => String(parseInt(num, 10))));
console.log('allAssignedNumbersSet has 1773:', allAssignedNumbersSet.has('1773'));
console.log('allAssignedNumbers count:', allAssignedNumbers.length);

let ticketsData = JSON.parse(fs.readFileSync(ticketsFilePath, 'utf-8'));
const ticket = ticketsData.find(t => t.ticket_number === '01773');
console.log('ticket 01773 found in ticketsData:', !!ticket);
