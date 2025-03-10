import fs from 'fs';

export const removeLocalFile = (filePath) => {
    try {
        if (filePath) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error(`Error removing file: ${error.message}`);
    }
};

