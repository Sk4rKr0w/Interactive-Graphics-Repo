// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos) {

    // Background data
    let bgData = bgImg.data;
    let bgWidth = bgImg.width;
    let bgHeight = bgImg.height;

    // Foreground data
    let fgData = fgImg.data;
    let fgWidth = fgImg.width;
    let fgHeight = fgImg.height;
    let fgX = fgPos.x;
    let fgY = fgPos.y;

    for (let y = 0; y < fgHeight; y++) {
        for (let x = 0; x < fgWidth; x++) {
            let fgIndex = (y * fgWidth + x) * 4;
            let bgX = fgX + x;
            let bgY = fgY + y;

            if (bgX < 0 || bgX >= bgWidth || bgY < 0 || bgY >= bgHeight) {
                continue;
            }

            let bgIndex = (bgY * bgWidth + bgX) * 4;
            let fgAlpha = (fgData[fgIndex + 3] / 255) * fgOpac;
            let bgAlpha = 1 - fgAlpha;

            bgData[bgIndex] = fgData[fgIndex] * fgAlpha + bgData[bgIndex] * bgAlpha;
            bgData[bgIndex + 1] = fgData[fgIndex + 1] * fgAlpha + bgData[bgIndex + 1] * bgAlpha;
            bgData[bgIndex + 2] = fgData[fgIndex + 2] * fgAlpha + bgData[bgIndex + 2] * bgAlpha;
            bgData[bgIndex + 3] = 255;
        }
    }
}

