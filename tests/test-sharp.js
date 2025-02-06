const sharp = require('sharp');

sharp('duke5.jpg')
  .resize(200, 200)
  .toFile('output.jpg', (err, info) => {
    if (err) {
      console.error('Error processing image:', err);
    } else {
      console.log('Image processed successfully:', info);
    }
  });