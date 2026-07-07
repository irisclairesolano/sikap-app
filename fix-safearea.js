const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/screens', function (filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (
      content.includes('SafeAreaView') &&
      content.match(/import .*SafeAreaView.* from 'react-native';/)
    ) {
      // Remove SafeAreaView from react-native import
      let newContent = content.replace(
        /import \{([^}]*)SafeAreaView([^}]*)\} from 'react-native';/,
        (match, p1, p2) => {
          let newImports = (p1 + p2)
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s)
            .join(', ');
          return newImports ? `import { ${newImports} } from 'react-native';` : '';
        },
      );

      // If there's an empty import like import {  } from 'react-native'; remove it
      newContent = newContent.replace(/import \{ \} from 'react-native';\n?/, '');

      // Add safe area context import
      newContent = `import { SafeAreaView } from 'react-native-safe-area-context';\n` + newContent;

      fs.writeFileSync(filePath, newContent);
      console.log('Fixed:', filePath);
    }
  }
});
