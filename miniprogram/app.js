App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-3grxb42cef5babf1',
        traceUser: true,
      });
      
      this.loadFonts();
    }

    this.globalData = {};
  },

  loadFonts() {
    wx.cloud.callFunction({
      name: 'getFontUrl'
    }).then(res => {
      if (res.result && res.result.success) {
        const fonts = res.result.data;
        fonts.forEach(font => {
          if (font.tempFileURL) {
            const fontFamily = font.fileID.includes('DMSerif') ? 'DM Serif Display' : 'Newsreader';
            wx.loadFontFace({
              global: true,
              family: fontFamily,
              source: `url("${font.tempFileURL}")`,
              success: () => console.log(`${fontFamily} loaded`),
              fail: () => {}
            });
          }
        });
      }
    }).catch(() => {});
  },

  globalData: {
    userInfo: null
  }
});
