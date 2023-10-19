const fs = require('fs');
const path = require('path');

function saveBase64Image(base64Image) {
    try {
        const prefix = 'data:image/jpeg;base64,';

        if (base64Image.startsWith(prefix)) {
            const data = base64Image.slice(prefix.length);

            const imageBuffer = Buffer.from(data, 'base64');

            const uniqueFilename = "Voter_Id_Image/" + Date.now() + '.jpeg';

            const filePath = path.join('public/', uniqueFilename);

            fs.writeFileSync(filePath, imageBuffer);

            return uniqueFilename;
        } else {
            return "Voter_Id_Image/" + "no-image.png"
        }
    } catch (error) {
        console.error('Error saving image:', error);
        throw new Error('An error occurred while saving the image.');
    }
}

module.exports = { saveBase64Image }