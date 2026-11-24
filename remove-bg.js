const Jimp = require('jimp');

async function removeBackground() {
  try {
    const imagePath = './client/public/images/hero-banner.png';
    const image = await Jimp.read(imagePath);

    // Get the background color of the top-left pixel
    const bgPixel = image.getPixelColor(0, 0);
    const { r: bgR, g: bgG, b: bgB } = Jimp.intToRGBA(bgPixel);

    const tolerance = 25; // How close to the background color a pixel has to be to get removed

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      const rDiff = Math.abs(red - bgR);
      const gDiff = Math.abs(green - bgG);
      const bDiff = Math.abs(blue - bgB);

      // If the pixel is close to the background color and very light (almost white)
      if (rDiff <= tolerance && gDiff <= tolerance && bDiff <= tolerance && red > 220 && green > 220 && blue > 220) {
        this.bitmap.data[idx + 3] = 0; // Set alpha to 0 completely transparent
      }
    });

    await image.writeAsync(imagePath);
    console.log('Background removed successfully!');
  } catch (err) {
    console.error('Error processing image:', err);
  }
}

removeBackground();
