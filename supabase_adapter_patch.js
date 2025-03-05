// supabase_adapter_patch.js
// This file contains a patch for the Supabase adapter to fix the timestamp issue

const fs = require('fs');
const path = require('path');

// Path to the Supabase adapter file
const adapterPath = path.join(__dirname, 'node_modules/@elizaos-plugins/adapter-supabase/dist/index.js');

// Read the file
fs.readFile(adapterPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Find the createKnowledge method and replace the createdAt line
  const originalLine = 'createdAt: knowledge.createdAt || /* @__PURE__ */ new Date(),';
  const replacementLine = 'createdAt: /* @__PURE__ */ new Date(), // Always use current timestamp to avoid JS Date conversion issues';

  // Replace the line
  const updatedData = data.replace(originalLine, replacementLine);

  // Write the updated file
  fs.writeFile(adapterPath, updatedData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('Successfully patched Supabase adapter');
  });
}); 