const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('d:/consultancy-project/client/src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('http://localhost:5000')) {
    let needsApi = !content.includes('VITE_API_URL');
    
    let newContent = content;
    newContent = newContent.replace(/'http:\/\/localhost:5000([^']*)'/g, '`${API}$1`');
    newContent = newContent.replace(/"http:\/\/localhost:5000([^"]*)"/g, '`${API}$1`');
    newContent = newContent.replace(/`http:\/\/localhost:5000([^`]*)`/g, '`${API}$1`');
    
    if (needsApi) {
        let lines = newContent.split('\n');
        let lastImport = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ') || lines[i].trim() === '}' || lines[i].includes('} from')) {
                // Approximate: track the last import line or end of multiline import
                if (lines[i].includes('from')) lastImport = i;
            }
        }
        
        const injectString = 'const API = import.meta.env.VITE_API_URL || "http://localhost:5000";';
        lines.splice(lastImport + 1, 0, '\n' + injectString + '\n');
        newContent = lines.join('\n');
    }
    
    fs.writeFileSync(file, newContent);
    console.log('Updated: ' + file);
  }
});
