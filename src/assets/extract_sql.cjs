const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\Prem\\Downloads\\Adgate-main\\Adgate-main\\src\\assets\\tables.txt', 'utf8');
const regex = /```sql\r?\n([\s\S]*?)```/g;
const blocks = [];
let match;
while ((match = regex.exec(content)) !== null) {
  blocks.push(match[1]);
}
fs.writeFileSync('c:\\Users\\Prem\\Downloads\\Adgate-main\\Adgate-main\\src\\assets\\schema.sql', blocks.join('\n\n'));
console.log('Extracted ' + blocks.length + ' blocks to schema.sql');
