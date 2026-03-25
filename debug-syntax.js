var fs = require('fs');
var c = fs.readFileSync('js/api.js', 'utf8');

// Find the systemPrompt/userPrompt area
var idx = c.indexOf('var systemPrompt');
var endIdx = c.indexOf('\n    try {', idx);
var block = c.slice(idx, endIdx);

console.log('=== systemPrompt/userPrompt block ===');
console.log('From char', idx, 'to', endIdx, '(', block.length, 'chars)');
console.log('');

// Look for curly/fancy quotes that break JS
var fancyQuotes = block.match(/[\u2018\u2019\u201C\u201D\u2013\u2014]/g);
if (fancyQuotes) {
  console.log('FANCY QUOTES FOUND:', fancyQuotes.length, 'instances');
  var lines = block.split('\n');
  for (var i = 0; i < lines.length; i++) {
    if (/[\u2018\u2019\u201C\u201D]/.test(lines[i])) {
      console.log('  Line', i + 1, ':', lines[i].substring(0, 150));
    }
  }
}

// Check if there's an unescaped apostrophe inside single-quoted string
// Simple check: find lines with odd number of single quotes  
var lines = block.split('\n');
for (var i = 0; i < lines.length; i++) {
  var line = lines[i];
  // Count single quotes
  var count = 0;
  for (var j = 0; j < line.length; j++) {
    if (line[j] === "'" && (j === 0 || line[j-1] !== '\\')) count++;
  }
  if (count % 2 !== 0) {
    console.log('ODD single quotes at line', i + 1, ':', line.substring(0, 200));
  }
}

// Also try to eval just this block in a function context
try {
  var testCode = '(function(profil, dureeMin, lieuLabel, lesteText, skillsText, nbExercices, seanceStructure, lesteObligation, objectifScheme, testContext, skillObligations, historiqueText, exList) {\n' +
    block + '\nreturn {systemPrompt: systemPrompt, userPrompt: userPrompt};\n})';
  new Function('return ' + testCode);
  console.log('\nBlock SYNTAX: OK');
} catch(e) {
  console.log('\nBlock SYNTAX ERROR:', e.message);
  
  // Try to narrow down
  for (var i = 0; i < lines.length; i++) {
    var partial = lines.slice(0, i + 1).join('\n');
    var testP = '(function(profil, dureeMin, lieuLabel, lesteText, skillsText, nbExercices, seanceStructure, lesteObligation, objectifScheme, testContext, skillObligations, historiqueText, exList) {\n' +
      partial + '\nreturn {};\n})';
    try {
      new Function('return ' + testP);
    } catch(e2) {
      // Only print when it first fails
      if (i > 0) {
        var prevP = '(function(profil, dureeMin, lieuLabel, lesteText, skillsText, nbExercices, seanceStructure, lesteObligation, objectifScheme, testContext, skillObligations, historiqueText, exList) {\n' +
          lines.slice(0, i).join('\n') + '\nreturn {};\n})';
        try {
          new Function('return ' + prevP);
          console.log('FIRST FAILING LINE:', i + 1, ':', lines[i].substring(0, 200));
          console.log('CONTEXT:');
          for (var k = Math.max(0, i - 2); k <= Math.min(lines.length - 1, i + 2); k++) {
            console.log('  ', k + 1, (k === i ? '>>>' : '   '), lines[k].substring(0, 200));
          }
          break;
        } catch(e3) { /* previous also fails, continue */ }
      }
    }
  }
}
