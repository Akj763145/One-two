const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
let lines = code.split('\n');

// We want to delete from line 113 to 152 (index 112 to 151)
// Let's check text
console.log('Line 113:', lines[112]); // should be empty or return (
console.log('Line 114:', lines[113]); // return (
console.log('Line 153:', lines[152]); // return (

lines.splice(113, 39); // delete 39 lines starting from 114 (index 113)
// Wait, 153 - 114 = 39 lines.
fs.writeFileSync('src/App.tsx', lines.join('\n'));
