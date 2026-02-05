Component({
  properties: {
    active: {
      type: String,
      value: 'library'
    }
  },
  methods: {
    goLibrary() {
      wx.redirectTo({ url: '/pages/library/library' });
    },
    goProfile() {
      wx.redirectTo({ url: '/pages/profile/profile' });
    }
  }
});
