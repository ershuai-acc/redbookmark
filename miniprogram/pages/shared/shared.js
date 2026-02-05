Page({
  data: {
    volume: null,
    mark: null,
    loading: true,
    error: null,
    statusBarHeight: 44,
    navBarHeight: 44
  },

  onLoad(options) {
    this.initNavBar();
    const { markId, volumeId } = options;
    if (!markId || !volumeId) {
      this.setData({ loading: false, error: 'Invalid share link' });
      return;
    }
    this.markId = markId;
    this.volumeId = volumeId;
    this.loadSharedMark(markId, volumeId);
  },

  initNavBar() {
    try {
      const windowInfo = wx.getWindowInfo();
      const menuButton = wx.getMenuButtonBoundingClientRect();
      const statusBarHeight = windowInfo.statusBarHeight || 44;
      const navBarHeight = menuButton.height ? (menuButton.top - statusBarHeight) * 2 + menuButton.height : 44;
      this.setData({ statusBarHeight, navBarHeight });
    } catch (e) {
      console.error('initNavBar failed', e);
    }
  },

  async loadSharedMark(markId, volumeId) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getSharedMark',
        data: { markId, volumeId }
      });

      if (res.result && res.result.success) {
        this.setData({
          volume: res.result.data.volume,
          mark: res.result.data.mark,
          loading: false
        });
      } else {
        this.setData({ loading: false, error: res.result?.error || 'Mark not found' });
      }
    } catch (e) {
      console.error('Load shared mark failed', e);
      this.setData({ 
        loading: false, 
        error: 'Please deploy getSharedMark cloud function first' 
      });
    }
  },

  goToLibrary() {
    wx.switchTab({ url: '/pages/library/library' });
  },

  goToProfile() {
    wx.switchTab({ url: '/pages/profile/profile' });
  },

  onShareAppMessage() {
    const { mark, volume } = this.data;
    return {
      title: `"${mark?.text?.substring(0, 30)}..." - ${volume?.title || 'Book Mark'}`,
      path: `/pages/shared/shared?markId=${mark?._id}&volumeId=${volume?._id}`
    };
  }
});
