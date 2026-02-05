Page({
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: ''
    },
    volumes: [],
    marks: [],
    stats: {
      totalVolumes: 0,
      totalMarks: 0,
      classificationCount: 0,
      daysLogged: 0
    },
    displayClassifications: [],
    heatmapData: [],
    currentYear: new Date().getFullYear(),
    activeTagPopup: null,
    volumesWithSameTag: []
  },

  onLoad() {
    this.loadUserInfo();
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({
      userInfo: {
        avatarUrl: userInfo.avatarUrl || '',
        nickName: userInfo.nickName || ''
      }
    });
  },

  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    const userInfo = { ...this.data.userInfo, avatarUrl };
    this.setData({ userInfo });
    wx.setStorageSync('userInfo', userInfo);
  },

  onNicknameInput(e) {
    const nickName = e.detail.value;
    this.setData({ 'userInfo.nickName': nickName });
  },

  onNicknameBlur(e) {
    const nickName = e.detail.value;
    const userInfo = { ...this.data.userInfo, nickName };
    this.setData({ userInfo });
    wx.setStorageSync('userInfo', userInfo);
  },

  async loadData() {
    let volumes = [];
    let marks = [];
    
    try {
      const [volumesRes, marksRes] = await Promise.all([
        wx.cloud.callFunction({ name: 'getVolumes', data: {} }),
        wx.cloud.callFunction({ name: 'getMarks', data: {} })
      ]);
      
      if (volumesRes.result && volumesRes.result.success) {
        volumes = volumesRes.result.data || [];
      }
      if (marksRes.result && marksRes.result.success) {
        marks = marksRes.result.data || [];
      }
    } catch (e) {
      console.error('Cloud load failed');
    }
    
    this.calculateStats(volumes, marks);
    const heatmapData = this.generateHeatmapData(marks);
    
    this.setData({ volumes, marks, heatmapData });
  },

  calculateStats(volumes, marks) {
    const totalVolumes = volumes.length;
    const totalMarks = marks.length;
    const totalMarksDisplay = totalMarks > 999 ? (totalMarks / 1000).toFixed(1) + 'k' : String(totalMarks);
    
    const allClassifications = volumes.flatMap(v => v.classifications || []);
    const uniqueClassifications = [...new Set(allClassifications)];
    const classificationCount = uniqueClassifications.length;
    
    const uniqueDates = new Set(marks.map(m => m.date));
    const daysLogged = uniqueDates.size;
    
    this.setData({
      stats: { totalVolumes, totalMarks, totalMarksDisplay, classificationCount, daysLogged },
      displayClassifications: uniqueClassifications.slice(0, 12)
    });
  },

  generateHeatmapData(marks) {
    const ROWS = 4;
    const activityMap = {};
    marks.forEach(mark => {
      const date = mark.date;
      activityMap[date] = (activityMap[date] || 0) + 1;
    });

    const days = [];
    const year = this.data.currentYear;
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const count = activityMap[dateStr] || 0;
        
        let opacity = 0.05;
        if (count >= 1 && count <= 2) opacity = 0.25;
        else if (count >= 3 && count <= 10) opacity = 0.45;
        else if (count > 10 && count <= 20) opacity = 0.7;
        else if (count > 20) opacity = 1.0;

        days.push({
          opacity,
          dateStr,
          isFirstOfMonth: day === 1,
          monthLabel: day === 1 ? monthNames[month] : null
        });
      }
    }

    while (days.length % ROWS !== 0) {
      days.push({ opacity: 0, dateStr: '', isFirstOfMonth: false, monthLabel: null });
    }

    return days;
  },

  showTagPopup(e) {
    const tag = e.currentTarget.dataset.tag;
    const volumesWithSameTag = this.data.volumes.filter(v => 
      (v.classifications || []).includes(tag)
    );
    this.setData({ activeTagPopup: tag, volumesWithSameTag });
  },

  closeTagPopup() {
    this.setData({ activeTagPopup: null, volumesWithSameTag: [] });
  },

  jumpToVolume(e) {
    const id = e.currentTarget.dataset.id;
    wx.redirectTo({
      url: `/pages/library/library?jumpToId=${id}`
    });
    this.closeTagPopup();
  },

  stopPropagation() {}
});
