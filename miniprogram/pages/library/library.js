Page({
  data: {
    volumes: [],
    currentIndex: 0,
    searchQuery: '',
    showModal: false,
    editingId: null,
    formData: {
      title: '',
      author: '',
      classificationInput: ''
    },
    activeTagPopup: null,
    volumesWithSameTag: [],
    statusBarHeight: 44,
    navBarHeight: 44,
    headerSpacerWidth: 100
  },

  allVolumes: [],

  onLoad(options) {
    this.initNavBar();
    this.jumpToId = options.jumpToId || null;
    this.loadVolumes();
  },

  onShow() {
    this.loadVolumes();
  },

  initNavBar() {
    try {
      const windowInfo = wx.getWindowInfo();
      const menuButton = wx.getMenuButtonBoundingClientRect();
      const statusBarHeight = windowInfo.statusBarHeight || 44;
      const navBarHeight = menuButton.height ? (menuButton.top - statusBarHeight) * 2 + menuButton.height : 44;
      const menuButtonWidth = menuButton.width || 87;
      const menuButtonRight = windowInfo.windowWidth - menuButton.right || 10;
      const headerSpacerWidth = menuButtonWidth + menuButtonRight + 10;
      this.setData({ statusBarHeight, navBarHeight, headerSpacerWidth });
    } catch (e) {
      console.error('initNavBar failed', e);
    }
  },

  async loadVolumes() {
    const keyword = this.data.searchQuery.trim();
    const keywordLower = keyword.toLowerCase();
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'getVolumes',
        data: {}
      });
      if (res.result && res.result.success) {
        this.allVolumes = res.result.data || [];
      }
    } catch (e) {
      console.error('Load from cloud failed', e);
    }
    
    let filteredVolumes = this.allVolumes;
    if (keyword) {
      filteredVolumes = this.allVolumes.filter(v => 
        v.title.toLowerCase().includes(keywordLower) ||
        v.title.includes(keyword) ||
        (v.author && v.author.toLowerCase().includes(keywordLower)) ||
        (v.author && v.author.includes(keyword)) ||
        (v.classifications && v.classifications.some(c => c.toLowerCase().includes(keywordLower) || c.includes(keyword)))
      );
    }
    
    let targetIndex = Math.min(this.data.currentIndex, Math.max(0, filteredVolumes.length - 1));
    
    if (this.jumpToId) {
      const jumpIndex = filteredVolumes.findIndex(v => v._id === this.jumpToId);
      if (jumpIndex !== -1) {
        targetIndex = jumpIndex;
      }
      this.jumpToId = null;
    }
    
    this.setData({
      volumes: filteredVolumes,
      currentIndex: targetIndex
    });
  },

  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value, currentIndex: 0 });
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadVolumes(), 300);
  },

  prevVolume() {
    if (this.data.currentIndex > 0) {
      this.setData({ currentIndex: this.data.currentIndex - 1 });
    }
  },

  nextVolume() {
    if (this.data.currentIndex < this.data.volumes.length - 1) {
      this.setData({ currentIndex: this.data.currentIndex + 1 });
    }
  },

  onTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
  },

  onTouchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - this.touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        this.prevVolume();
      } else {
        this.nextVolume();
      }
    }
  },

  showAddForm() {
    this.setData({
      showModal: true,
      editingId: null,
      formData: { title: '', author: '', classificationInput: '' }
    });
  },

  openEdit(e) {
    const id = e.currentTarget.dataset.id;
    const volume = this.data.volumes.find(v => v._id === id);
    if (volume) {
      this.setData({
        showModal: true,
        editingId: id,
        formData: {
          title: volume.title,
          author: volume.author,
          classificationInput: volume.classifications.join(', ')
        }
      });
    }
  },

  closeModal() {
    this.setData({ showModal: false, editingId: null });
  },

  onTitleInput(e) {
    this.setData({ 'formData.title': e.detail.value });
  },

  onAuthorInput(e) {
    this.setData({ 'formData.author': e.detail.value });
  },

  onClassificationInput(e) {
    this.setData({ 'formData.classificationInput': e.detail.value });
  },

  async handleSubmit() {
    const { title, author, classificationInput } = this.data.formData;
    if (!title.trim()) {
      wx.showToast({ title: 'Please enter title', icon: 'none' });
      return;
    }

    const classifications = classificationInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .slice(0, 8);

    wx.showLoading({ title: 'Saving...' });
    try {
      if (this.data.editingId) {
        const db = wx.cloud.database();
        await db.collection('volumes').doc(this.data.editingId).update({
          data: { title, author, classifications, updateTime: db.serverDate() }
        });
        
        const idx = this.allVolumes.findIndex(v => v._id === this.data.editingId);
        if (idx !== -1) {
          this.allVolumes[idx] = { ...this.allVolumes[idx], title, author, classifications };
        }
      } else {
        await wx.cloud.callFunction({
          name: 'addVolume',
          data: { title, author, classifications }
        });
        
        await this.loadVolumes();
      }
      
      this.closeModal();
      
      const targetIndex = this.allVolumes.length - 1;
      this.setData({
        volumes: this.allVolumes,
        currentIndex: targetIndex,
        searchQuery: ''
      });
      
      wx.showToast({ title: 'Saved', icon: 'success' });
    } catch (e) {
      console.error('Save failed', e);
      wx.showToast({ title: 'Save failed', icon: 'none' });
    }
    wx.hideLoading();
  },

  showTagPopup(e) {
    const tag = e.currentTarget.dataset.tag;
    const volumesWithSameTag = this.data.volumes.filter(v => 
      v.classifications.includes(tag)
    );
    this.setData({ activeTagPopup: tag, volumesWithSameTag });
  },

  closeTagPopup() {
    this.setData({ activeTagPopup: null, volumesWithSameTag: [] });
  },

  jumpToVolume(e) {
    const id = e.currentTarget.dataset.id;
    const index = this.data.volumes.findIndex(v => v._id === id);
    if (index !== -1) {
      this.setData({ 
        currentIndex: index, 
        activeTagPopup: null,
        searchQuery: ''
      });
    }
  },

  goToBookmark(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/bookmark/bookmark?id=${id}` });
  },

  stopPropagation() {}
});
