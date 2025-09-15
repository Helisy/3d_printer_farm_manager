const fs = require('fs');
const readline = require('readline');
const path = require('path');

function inserZOffset(inputPath, outputPath, z_offset) {
    return new Promise((resolve, reject) => {

        const inputFile = path.resolve(inputPath);
        const outputFile = path.resolve(outputPath);

        const inputStream = fs.createReadStream(inputFile);
        const outputStream = fs.createWriteStream(outputFile);

        const rl = readline.createInterface({
            input: inputStream,
            crlfDelay: Infinity
        });

        rl.on('line', (line) => {
            // Modifica valor de Z nas linhas que começam com G1
            if (/^G1\b/.test(line)) {
                const zMatch = line.match(/\bZ([-.]?\d*\.?\d+)/);
                if (zMatch) {
                    const originalZ = parseFloat(zMatch[1].startsWith('.') ? '0' + zMatch[1] : zMatch[1]);
                    const newZValue = originalZ + z_offset;
                    let newZ = newZValue.toFixed(4);

                    if (Math.abs(newZValue) < 1 && newZValue !== 0) {
                        newZ = newZ.replace(/^(-?)0\./, '$1.');
                    }

                    line = line.replace(/Z([-.]?\d*\.?\d+)/, `Z${removeTrailingZeros(newZ)}`);
                }
            }

            // Adiciona ";z_offset" ao final da linha específica
            if (line.startsWith('; different_settings_to_system')) {
                if (!line.endsWith(';z_offset')) {
                    line += ';z_offset';
                }
            }

            // Substitui linha "; z_offset = ..." pelo valor correto
            if (line.startsWith('; z_offset =')) {
                line = `; z_offset = ${z_offset}`;
            }

            outputStream.write(line + '\n');
        });

        rl.on('close', () => {
            outputStream.end();
            resolve(outputFile);
        });

        rl.on('error', reject);
        outputStream.on('error', reject);
    });
}

function removeTrailingZeros(str) {
    // Check if the string contains a decimal point
    if (str.includes('.')) {
        // Remove trailing zeros after the decimal point
        str = str.replace(/\.?0+$/, '');
    }
    return str;
}

module.exports = { inserZOffset }