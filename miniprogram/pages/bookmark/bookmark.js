Page({
  data: {
    volume: null,
    marks: [],
    activeTab: 0,
    currentMark: null,
    showModal: false,
    showShareMenu: false,
    showEditModal: false,
    newMarkText: '',
    newPageNumber: '',
    newVertical: false,
    editMarkText: '',
    editPageNumber: '',
    editVertical: false,
    statusBarHeight: 44,
    navBarHeight: 44
  },

  onLoad(options) {
    this.initNavBar();
    this.volumeId = options.id;
    if (!this.volumeId) {
      console.error('No volume ID provided');
      wx.navigateBack();
      return;
    }
    this.loadData();
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

  async loadData(options = {}) {
    const { skipCurrentMarkUpdate = false } = options;
    wx.showLoading({ title: 'Loading...' });

    try {
      const [volumesRes, marksRes] = await Promise.all([
        wx.cloud.callFunction({
          name: 'getVolumes',
          data: {}
        }),
        wx.cloud.callFunction({
          name: 'getMarks',
          data: { volumeId: this.volumeId }
        })
      ]);

      let volume = null;
      if (volumesRes.result && volumesRes.result.success) {
        volume = volumesRes.result.data.find(v => v._id === this.volumeId) || null;
      }

      const marks = (marksRes.result && marksRes.result.success) ? marksRes.result.data : [];

      const updateData = { volume, marks };
      if (!skipCurrentMarkUpdate) {
        updateData.currentMark = marks[this.data.activeTab] || (marks.length > 0 ? marks[0] : null);
      }
      this.setData(updateData);

      wx.hideLoading();
      return { volume, marks };

    } catch (e) {
      console.error('Load failed', e);
      wx.showToast({ title: 'Load failed', icon: 'none' });
      wx.hideLoading();
      return null;
    }
  },

  handlePrev() {
    const { activeTab, marks } = this.data;
    if (activeTab > 0) {
      const newTab = activeTab - 1;
      this.setData({
        activeTab: newTab,
        currentMark: marks[newTab]
      });
    }
  },

  handleNext() {
    const { activeTab, marks } = this.data;
    if (activeTab < marks.length - 1) {
      const newTab = activeTab + 1;
      this.setData({
        activeTab: newTab,
        currentMark: marks[newTab]
      });
    }
  },

  showAddModal() {
    this.setData({ showModal: true, newMarkText: '', newPageNumber: '', newVertical: false });
  },

  closeModal() {
    this.setData({ showModal: false, newMarkText: '', newPageNumber: '', newVertical: false });
  },

  onMarkTextInput(e) {
    this.setData({ newMarkText: e.detail.value });
  },

  onPageInput(e) {
    this.setData({ newPageNumber: e.detail.value });
  },

  onNewVerticalChange(e) {
    this.setData({ newVertical: e.detail.value });
  },

  showEditModal() {
    const { currentMark } = this.data;
    if (!currentMark) return;
    this.setData({
      showEditModal: true,
      editMarkText: currentMark.text || '',
      editPageNumber: currentMark.page || '',
      editVertical: currentMark.vertical || false
    });
  },

  closeEditModal() {
    this.setData({ showEditModal: false, editMarkText: '', editPageNumber: '', editVertical: false });
  },

  onEditVerticalChange(e) {
    this.setData({ editVertical: e.detail.value });
  },

  onEditMarkTextInput(e) {
    this.setData({ editMarkText: e.detail.value });
  },

  onEditPageInput(e) {
    this.setData({ editPageNumber: e.detail.value });
  },

  chooseImageForEdit() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.doOCRForEdit(tempFilePath);
      }
    });
  },

  async doOCRForEdit(imagePath) {
    wx.showLoading({ title: 'Recognizing...' });

    try {
      const timestamp = Date.now();
      const cloudPath = `ocr_temp/${timestamp}_${Math.random().toString(36).substr(2, 9)}.jpg`;

      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: imagePath
      });

      if (!uploadRes.fileID) {
        throw new Error('Upload failed');
      }

      const ocrRes = await wx.cloud.callFunction({
        name: 'ocr',
        data: { fileID: uploadRes.fileID }
      });

      wx.cloud.deleteFile({ fileList: [uploadRes.fileID] });

      if (ocrRes.result && ocrRes.result.success && ocrRes.result.text) {
        this.setData({
          editMarkText: this.data.editMarkText
            ? this.data.editMarkText + '\n' + ocrRes.result.text
            : ocrRes.result.text
        });
        wx.hideLoading();
        wx.showToast({ title: 'Text extracted', icon: 'success' });
      } else {
        wx.hideLoading();
        wx.showToast({ title: ocrRes.result?.error || 'No text found', icon: 'none' });
      }
    } catch (e) {
      console.error('OCR failed', e);
      wx.hideLoading();
      wx.showToast({ title: 'OCR failed', icon: 'none' });
    }
  },

  async handleEditSubmit() {
    const { editMarkText, editPageNumber, editVertical, currentMark } = this.data;

    if (!editMarkText.trim()) {
      wx.showToast({ title: 'Please enter content', icon: 'none' });
      return;
    }

    console.log('Updating mark:', {
      markId: currentMark._id,
      text: editMarkText.trim(),
      page: editPageNumber.trim() || currentMark.page,
      vertical: editVertical
    });

    wx.showLoading({ title: 'Saving...' });

    try {
      const res = await wx.cloud.callFunction({
        name: 'updateMark',
        data: {
          markId: currentMark._id,
          text: editMarkText.trim(),
          page: editPageNumber.trim() || currentMark.page,
          vertical: editVertical
        }
      });

      console.log('Update result:', res.result);

      if (res.result && res.result.success) {
        this.closeEditModal();
        await this.loadData();
        wx.hideLoading();
        wx.showToast({ title: 'Saved', icon: 'success' });
      } else {
        wx.hideLoading();
        wx.showToast({ title: res.result?.error || 'Update failed', icon: 'none' });
      }
    } catch (e) {
      console.error('Update failed', e);
      wx.hideLoading();
      wx.showToast({ title: 'Update failed', icon: 'none' });
    }
  },

  handleDeleteMark() {
    const { currentMark } = this.data;
    if (!currentMark) return;

    wx.showModal({
      title: 'Delete Mark',
      content: 'Are you sure you want to delete this mark?',
      confirmColor: '#D31526',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: 'Deleting...' });
          try {
            const result = await wx.cloud.callFunction({
              name: 'deleteMark',
              data: { markId: currentMark._id }
            });

            if (result.result && result.result.success) {
              this.closeEditModal();

              const { activeTab } = this.data;
              const newTab = activeTab > 0 ? activeTab - 1 : 0;
              this.setData({ activeTab: newTab });

              await this.loadData();

              wx.hideLoading();
              wx.showToast({ title: 'Deleted', icon: 'success' });
            } else {
              wx.hideLoading();
              wx.showToast({ title: result.result?.error || 'Delete failed', icon: 'none' });
            }
          } catch (e) {
            console.error('Delete failed', e);
            wx.hideLoading();
            wx.showToast({ title: 'Delete failed', icon: 'none' });
          }
        }
      }
    });
  },

  async handleAddSubmit() {
    const { newMarkText, newPageNumber, newVertical, marks } = this.data;

    if (!newMarkText.trim()) {
      wx.showToast({ title: 'Please enter content', icon: 'none' });
      return;
    }

    wx.showLoading({ title: 'Saving...' });

    try {
      await wx.cloud.callFunction({
        name: 'addMark',
        data: {
          volumeId: this.volumeId,
          text: newMarkText.trim(),
          page: newPageNumber.trim() || `Mark ${marks.length + 1}`,
          vertical: newVertical
        }
      });

      this.closeModal();

      const data = await this.loadData({ skipCurrentMarkUpdate: true });
      if (data && data.marks && data.marks.length > 0) {
        const newIndex = data.marks.length - 1;
        this.setData({
          activeTab: newIndex,
          currentMark: data.marks[newIndex]
        });
      }

      wx.hideLoading();
      wx.showToast({ title: 'Saved', icon: 'success' });

    } catch (e) {
      console.error('Save failed', e);
      wx.hideLoading();
      wx.showToast({ title: 'Save failed', icon: 'none' });
    }
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.doOCR(tempFilePath);
      }
    });
  },

  async doOCR(imagePath) {
    wx.showLoading({ title: 'Recognizing...' });

    try {
      const timestamp = Date.now();
      const cloudPath = `ocr_temp/${timestamp}_${Math.random().toString(36).substr(2, 9)}.jpg`;

      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: imagePath
      });

      if (!uploadRes.fileID) {
        throw new Error('Upload failed');
      }

      const ocrRes = await wx.cloud.callFunction({
        name: 'ocr',
        data: { fileID: uploadRes.fileID }
      });

      wx.cloud.deleteFile({ fileList: [uploadRes.fileID] });

      if (ocrRes.result && ocrRes.result.success && ocrRes.result.text) {
        this.setData({
          newMarkText: this.data.newMarkText
            ? this.data.newMarkText + '\n' + ocrRes.result.text
            : ocrRes.result.text
        });
        wx.hideLoading();
        wx.showToast({ title: 'Text extracted', icon: 'success' });
      } else {
        wx.hideLoading();
        wx.showToast({ title: ocrRes.result?.error || 'No text found', icon: 'none' });
      }
    } catch (e) {
      console.error('OCR failed', e);
      wx.hideLoading();
      wx.showToast({ title: 'OCR failed', icon: 'none' });
    }
  },

  shareMark() {
    if (!this.data.currentMark) {
      wx.showToast({ title: 'No mark', icon: 'none' });
      return;
    }
    this.setData({ showShareMenu: true });
  },

  hideShareMenu() {
    this.setData({ showShareMenu: false });
  },

  onShareAppMessage() {
    const { currentMark, volume, activeTab } = this.data;
    if (!currentMark || !volume) {
      return {
        title: '我的书签',
        path: '/pages/library/library'
      };
    }

    return {
      title: `我的「${volume.title || '书籍'}」书签 Mark${activeTab + 1}`,
      path: `/pages/shared/shared?markId=${currentMark._id}&volumeId=${volume._id}`
    };
  },

  async exportCard() {
    if (!this.data.currentMark) {
      wx.showToast({ title: 'No mark', icon: 'none' });
      return;
    }

    wx.showLoading({ title: 'Generating...' });

    try {
      const query = wx.createSelectorQuery();
      query.select('#exportCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) {
            wx.hideLoading();
            wx.showToast({ title: 'Export failed', icon: 'none' });
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getWindowInfo().pixelRatio;

          let width = 750;
          const calcResult = this.calculateCardHeight(ctx, width);
          const { height, lines, isVertical, textWidth } = calcResult;

          if (isVertical && textWidth) {
            width = textWidth;
          }

          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          this.drawCard(ctx, width, height, lines);

          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvas: canvas,
              width: width * dpr,
              height: height * dpr,
              destWidth: width * 2,
              destHeight: height * 2,
              success: (res) => {
                wx.saveImageToPhotosAlbum({
                  filePath: res.tempFilePath,
                  success: () => {
                    wx.hideLoading();
                    wx.showToast({ title: 'Saved to album', icon: 'success' });
                  },
                  fail: (err) => {
                    wx.hideLoading();
                    if (err.errMsg.includes('auth deny')) {
                      wx.showModal({
                        title: 'Permission Required',
                        content: 'Please allow access to save images',
                        success: (res) => {
                          if (res.confirm) {
                            wx.openSetting();
                          }
                        }
                      });
                    } else {
                      wx.showToast({ title: 'Save failed', icon: 'none' });
                    }
                  }
                });
              },
              fail: () => {
                wx.hideLoading();
                wx.showToast({ title: 'Export failed', icon: 'none' });
              }
            });
          }, 100);
        });
    } catch (e) {
      console.error('Export failed', e);
      wx.hideLoading();
      wx.showToast({ title: 'Export failed', icon: 'none' });
    }
  },

  calculateCardHeight(ctx, width) {
    const { currentMark } = this.data;
    const text = '"' + currentMark.text + '"';
    const isVertical = currentMark.vertical || false;

    if (isVertical) {
      const height = 1250; // Fixed tall height for vertical
      const maxHeight = height - 120 - 100 - 180 - 60; // Header - TopSpace - Footer - Buffer
      ctx.font = '32px "Songti SC", SimSun, STSong, serif';
      const lines = this.wrapVerticalText(ctx, text, maxHeight);
      return { height, lines, isVertical: true };
    } else {
      const maxWidth = width - 120;
      const lineHeight = 70;
      ctx.font = 'italic 48px Georgia, serif';
      const lines = this.wrapText(ctx, text, maxWidth);

      const headerHeight = 120;
      const topDividerArea = 100;
      const textHeight = lines.length * lineHeight;
      const bottomDividerArea = 80;
      const footerHeight = 180;

      const minHeight = 1000;
      const calculatedHeight = headerHeight + topDividerArea + textHeight + bottomDividerArea + footerHeight;
      const height = Math.max(minHeight, calculatedHeight);
      return { height, lines, isVertical: false };
    }
  },

  drawCard(ctx, width, height, lines) {
    const { volume, currentMark, activeTab } = this.data;
    const isVertical = currentMark.vertical || false;
    const lineHeight = 70; // Horizontal line height

    ctx.fillStyle = '#F2E8CF';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#D31526';
    ctx.fillRect(0, 0, width, 120);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'italic 36px Georgia, serif';
    ctx.textAlign = 'center';
    const title = volume?.title || 'Untitled';
    ctx.fillText(title.length > 25 ? title.substring(0, 25) + '...' : title, width / 2, 75);

    ctx.strokeStyle = 'rgba(211, 21, 38, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 60, 200);
    ctx.lineTo(width / 2 + 60, 200);
    ctx.stroke();

    let actualDividerY = 0;

    if (isVertical) {
      // -- DRAW VERTICAL TEXT --
      ctx.fillStyle = '#D31526';
      ctx.font = '32px "Songti SC", SimSun, STSong, serif';
      ctx.textBaseline = 'top';

      const colWidth = 52; // Matches CSS line-height 1.6 * 32px
      const verLineHeight = 45; // Tighter vertical char spacing
      const totalWidth = lines.length * colWidth;
      const startX = width / 2 + totalWidth / 2 - colWidth / 2; // Start from right
      const startY = 120 + 100; // Fixed top margin

      lines.forEach((line, colIndex) => {
        const x = startX - colIndex * colWidth;
        let y = startY;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const charWidth = ctx.measureText(char).width;
          const charX = x - charWidth / 2;

          ctx.fillText(char, charX, y);
          y += verLineHeight;
        }
      });

      actualDividerY = height - 200;

    } else {
      // -- DRAW HORIZONTAL TEXT --
      ctx.fillStyle = '#D31526';
      ctx.font = 'italic 48px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      const totalTextHeight = lines.length * lineHeight;
      const textAreaHeight = height - 120 - 100 - 180;
      const startY = 120 + 100 + (textAreaHeight - totalTextHeight) / 2 + lineHeight / 2;

      lines.forEach((line, index) => {
        ctx.fillText(line, width / 2, startY + index * lineHeight);
      });

      actualDividerY = startY + (lines.length - 1) * lineHeight + 60;
    }

    ctx.beginPath();
    ctx.moveTo(width / 2 - 60, actualDividerY);
    ctx.lineTo(width / 2 + 60, actualDividerY);
    ctx.stroke();

    const footerY = height - 120;

    ctx.fillStyle = 'rgba(211, 21, 38, 0.4)';
    ctx.font = 'bold 14px monospace';
    ctx.textBaseline = 'alphabetic'; // Reset baseline

    ctx.textAlign = 'left';
    ctx.fillText('VOLUME', 60, footerY);

    ctx.textAlign = 'center';
    ctx.fillText('PAGE', width / 2, footerY);

    ctx.textAlign = 'right';
    ctx.fillText('DATE', width - 60, footerY);

    ctx.fillStyle = '#D31526';
    ctx.font = 'bold 18px monospace';

    ctx.textAlign = 'left';
    const volTitle = volume?.title || 'Unknown';
    ctx.fillText(volTitle.length > 15 ? volTitle.substring(0, 15) + '...' : volTitle, 60, footerY + 30);

    ctx.textAlign = 'center';
    const pageText = currentMark.page || 'N/A';
    ctx.fillText(pageText.length > 15 ? pageText.substring(0, 15) + '...' : pageText, width / 2, footerY + 30);

    ctx.textAlign = 'right';
    ctx.fillText(currentMark.date || '-', width - 60, footerY + 30);
  },

  wrapVerticalText(ctx, text, maxHeight) {
    const lines = [];
    let currentLine = '';
    let currentHeight = 0;
    const charHeight = 45; // Match verLineHeight
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if ((currentHeight + charHeight) > maxHeight) {
        lines.push(currentLine);
        currentLine = char;
        currentHeight = charHeight;
      } else {
        currentLine += char;
        currentHeight += charHeight;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  },

  wrapText(ctx, text, maxWidth) {
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  },

  exportAllMarks() {
    const { volume, marks } = this.data;

    if (!marks || marks.length === 0) {
      wx.showToast({ title: 'No marks to export', icon: 'none' });
      return;
    }

    let content = '';
    content += '===========================================\n';
    content += '  ARCHIVAL BOOKSHELF - EXPORT\n';
    content += '===========================================\n\n';

    content += 'BOOK INFO\n';
    content += '-------------------------------------------\n';
    content += 'Title:  ' + (volume?.title || 'Untitled') + '\n';
    content += 'Author: ' + (volume?.author || 'Anonymous') + '\n';
    if (volume?.tags && volume.tags.length > 0) {
      content += 'Tags:   ' + volume.tags.join(', ') + '\n';
    }
    content += 'Total Marks: ' + marks.length + '\n';
    content += 'Export Date: ' + this.formatDate(new Date()) + '\n';
    content += '\n';

    content += 'MARKS\n';
    content += '===========================================\n\n';

    marks.forEach((mark, index) => {
      content += '[MARK ' + (index + 1) + ']\n';
      content += '-------------------------------------------\n';
      content += 'Date: ' + (mark.date || '-') + '\n';
      content += 'Page: ' + (mark.page || '-') + '\n';
      content += '\n';
      content += '"' + mark.text + '"\n';
      content += '\n\n';
    });

    content += '===========================================\n';
    content += '  End of Export\n';
    content += '===========================================\n';

    try {
      const fs = wx.getFileSystemManager();
      const fileName = (volume?.title || 'BookMarks').replace(/[\\/:*?"<>|]/g, '_') + '_' + this.formatDateForFile(new Date()) + '.txt';
      const filePath = wx.env.USER_DATA_PATH + '/' + fileName;

      fs.writeFileSync(filePath, content, 'utf8');

      wx.shareFileMessage({
        filePath: filePath,
        fileName: fileName,
        success: () => {
          wx.showToast({ title: 'Shared', icon: 'success' });
        },
        fail: (err) => {
          console.error('Share file failed', err);
          wx.openDocument({
            filePath: filePath,
            showMenu: true,
            success: () => {
              wx.showToast({ title: 'Use top-right menu to share', icon: 'none', duration: 2000 });
            },
            fail: () => {
              wx.showToast({ title: 'Export failed', icon: 'none' });
            }
          });
        }
      });
    } catch (e) {
      console.error('Export all marks failed', e);
      wx.showToast({ title: 'Export failed', icon: 'none' });
    }
  },

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  },

  formatDateForFile(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return year + month + day + '_' + hour + min;
  },

  goBack() {
    wx.navigateBack();
  },

  stopPropagation() { }
});
