var fs = require('fs');
var c = fs.readFileSync('js/api.js', 'utf8');
var lines = c.split('\n');

// Try wrapping chunks of the file
for (var end = 50; end <= lines.length; end += 50) {
  var chunk = lines.slice(0, end).join('\n');
  // Wrap it as a complete function
  var test = chunk + '\nreturn {};})();';
  try {
    new Function(test);
  } catch(e) {
    // Now narrow down within this 50-line block
    for (var l = end - 50; l < end; l++) {
      var chunk2 = lines.slice(0, l + 1).join('\n') + '\nreturn {};})();';
      try {
        new Function(chunk2);
      } catch(e2) {
        // Check if previous line was also bad
        if (l > 0) {
          var chunk3 = lines.slice(0, l).join('\n') + '\nreturn {};})();';
          try {
            new Function(chunk3);
            console.log('ERROR FIRST APPEARS AT LINE ' + (l + 1) + ':');
            console.log('  ' + lines[l].substring(0, 200));
            console.log('  Error: ' + e2.message);
            console.log('CONTEXT:');
            for (var k = Math.max(0, l - 3); k <= Math.min(lines.length - 1, l + 3); k++) {
              console.log('  ' + (k + 1) + (k === l ? ' >>>' : '    ') + ' ' + lines[k].substring(0, 200));
            }
            process.exit(0);
          } catch(e3) {
            // continue
          }
        }
      }
    }
  }
}

// If we get here, whole file might parse line by line OK
// Try the full file
try {
  new Function(c);
  console.log('Full file: OK');
} catch(e) {
  console.log('Full file error:', e.message);
  // Check for unescaped curly quotes in string contexts
  for (var i = 0; i < lines.length; i++) {
    if (/[\u2018\u2019]/.test(lines[i]) && /^[^\/]/.test(lines[i].trim())) {
      console.log('Curly quote at line ' + (i+1) + ': ' + lines[i].substring(0, 200));
    }
  }
}
