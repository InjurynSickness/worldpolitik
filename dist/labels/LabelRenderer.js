// /src/labels/LabelRenderer.ts
export class LabelRenderer {
    allCountryData;
    constructor(allCountryData) {
        this.allCountryData = allCountryData;
    }
    drawLabels(ctx, labelCache, provinceOwnerMap, cameraZoom) {
        const countrySizes = new Map();
        for (const [provinceId, countryId] of provinceOwnerMap.entries()) {
            countrySizes.set(countryId, (countrySizes.get(countryId) || 0) + 1);
        }
        const maxSize = Math.max(...Array.from(countrySizes.values()));
        const minSize = Math.min(...Array.from(countrySizes.values()));
        const labels = [];
        for (const [countryId, position] of labelCache.entries()) {
            const countryInfo = this.allCountryData.get(countryId);
            if (!countryInfo)
                continue;
            const countrySize = countrySizes.get(countryId) || 0;
            if (cameraZoom < 0.5 && countrySize < 100)
                continue;
            if (cameraZoom < 1.0 && countrySize < 30)
                continue;
            if (cameraZoom < 2.0 && countrySize < 10)
                continue;
            const sizeRatio = (countrySize - minSize) / (maxSize - minSize);
            const baseFontSize = 16 + (sizeRatio * 32);
            let fontSize = baseFontSize;
            if (cameraZoom < 0.5)
                fontSize *= 2.0;
            else if (cameraZoom < 1.0)
                fontSize *= 1.5;
            else if (cameraZoom > 3.0)
                fontSize *= 0.8;
            fontSize = Math.max(14, Math.min(56, fontSize));
            const letterSpacing = 4 + (sizeRatio * 12);
            const displayName = countryInfo.name.toUpperCase();
            ctx.font = `900 ${fontSize}px Arial, sans-serif`;
            const textMetrics = ctx.measureText(displayName);
            const baseWidth = textMetrics.width;
            const spacingWidth = letterSpacing * (displayName.length - 1);
            const textWidth = baseWidth + spacingWidth;
            const textHeight = fontSize;
            labels.push({
                countryId,
                name: displayName,
                x: position.x,
                y: position.y,
                fontSize,
                letterSpacing,
                width: textWidth + 40,
                height: textHeight + 25,
                size: countrySize
            });
        }
        labels.sort((a, b) => b.size - a.size);
        const drawnLabels = [];
        for (const label of labels) {
            let collides = false;
            for (const drawn of drawnLabels) {
                const padding = 25;
                if (!(label.x + label.width / 2 + padding < drawn.x - drawn.width / 2 ||
                    label.x - label.width / 2 > drawn.x + drawn.width / 2 + padding ||
                    label.y + label.height / 2 + padding < drawn.y - drawn.height / 2 ||
                    label.y - label.height / 2 > drawn.y + drawn.height / 2 + padding)) {
                    collides = true;
                    break;
                }
            }
            if (!collides) {
                drawnLabels.push(label);
            }
        }
        for (const label of drawnLabels) {
            ctx.save();
            ctx.font = `italic 900 ${label.fontSize}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const chars = label.name.split('');
            const totalWidth = chars.reduce((sum, char) => {
                return sum + ctx.measureText(char).width;
            }, 0) + (label.letterSpacing * (chars.length - 1));
            let currentX = label.x - totalWidth / 2;
            for (const char of chars) {
                const charWidth = ctx.measureText(char).width;
                const charX = currentX + charWidth / 2;
                ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
                ctx.lineWidth = 5.5;
                ctx.lineJoin = 'round';
                ctx.miterLimit = 2;
                ctx.strokeText(char, charX, label.y);
                ctx.lineWidth = 4.5;
                ctx.strokeText(char, charX, label.y);
                ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                ctx.fillText(char, charX, label.y);
                currentX += charWidth + label.letterSpacing;
            }
            ctx.restore();
        }
    }
}
//# sourceMappingURL=LabelRenderer.js.map