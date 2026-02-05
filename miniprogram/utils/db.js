const db = wx.cloud.database();
const _ = db.command;

const volumesCollection = db.collection('volumes');
const marksCollection = db.collection('marks');

module.exports = {
  db,
  _,
  volumesCollection,
  marksCollection,

  generateArchivalId() {
    return `V-${Math.floor(1000 + Math.random() * 9000)}`;
  },

  formatDate(date) {
    const d = date || new Date();
    return d.toISOString().split('T')[0];
  }
};
