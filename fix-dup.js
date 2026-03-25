var fs = require('fs');
var c = fs.readFileSync('js/api.js', 'utf8');
var lines = c.split('\n');

// Find the two generateProgramme definitions
var first = -1, second = -1;
for (var i = 0; i < lines.length; i++) {
  if (/async function generateProgramme/.test(lines[i])) {
    if (first === -1) first = i;
    else if (second === -1) second = i;
  }
}

console.log('First generateProgramme at line', first + 1);
console.log('Second generateProgramme at line', second + 1);

if (first === -1 || second === -1) {
  console.error('Could not find both functions');
  process.exit(1);
}

// Find the line JUST before the second generateProgramme — the closing brace of fetchExercises + the comment
// We need to find the "/* ── Generate programme via OpenAI ── */" line, which is 1 line before the second function
var commentLine = second - 1;
while (commentLine > 0 && lines[commentLine].trim() === '') commentLine--;
console.log('Comment line:', commentLine + 1, ':', lines[commentLine]);

// Find line just before the first generateProgramme that marks its header comment
var firstComment = first - 1;
while (firstComment > 0 && lines[firstComment].trim() === '') firstComment--;
console.log('First comment line:', firstComment + 1, ':', lines[firstComment]);

// Remove from firstComment to second-1 (inclusive)
// The second function starts with its own comment, so we delete from the first comment through the closing } of fetchExercises
// We want to keep: everything before the first generateProgramme's comment, 
// and everything from the second generateProgramme's comment onward

// Actually, let me find what's just before the first "async function generateProgramme"
// It should be the end of fetchExercises: "  }" and then the comment
console.log('');
console.log('Lines before first GP:');
for (var k = Math.max(0, first - 5); k <= first; k++) {
  console.log('  ', k + 1, ':', lines[k]);
}

// And what's between the two functions
console.log('');
console.log('Lines between (end of first GP to start of second GP):');
// Find where the first function's try/catch ends - look for the closing } of the first GP
// Actually, since it's messy, let's just remove lines from first to second-1,
// but keep the "/* ── Generate programme via OpenAI ── */" comment

// Strategy: Remove the FIRST generateProgramme + everything until the SECOND one
// The FIRST one starts with "  /* ── Generate programme via OpenAI ── */"
// before line `first`
// The SECOND one also starts with "  /* ── Generate programme via OpenAI ── */"
// before line `second`

// Remove lines from (firstComment) to (commentLine) inclusive
// That removes the first generateProgramme and the duplicate fetchExercises body
var removeStart = firstComment;
var removeEnd = commentLine;

console.log('Will remove lines', removeStart + 1, 'to', removeEnd + 1, '(', removeEnd - removeStart + 1, 'lines)');
console.log('First removed line:', lines[removeStart]);
console.log('Last removed line:', lines[removeEnd]);
console.log('Line after removal:', lines[removeEnd + 1]);

// Actually we need to be careful. Let me check if the comment before the second function is identical.
// We should remove lines from (first comment line of first GP) to (line just before the comment of second GP)
// The line just after the removed section should be: "  /* ── Generate programme via OpenAI ── */"

// Check
var newLines = lines.slice(0, removeStart).concat(lines.slice(removeEnd + 1));
var result = newLines.join('\n');

// Verify syntax
try {
  new Function(result);
  console.log('\nSYNTAX AFTER FIX: OK');
  fs.writeFileSync('js/api.js', result, 'utf8');
  console.log('File written successfully');
} catch(e) {
  console.log('\nSYNTAX AFTER FIX: ERROR', e.message);
  console.log('NOT writing file. Investigate further.');
}
