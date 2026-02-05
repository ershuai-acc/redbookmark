const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { volumeId, text, page, vertical } = event;
  const wxContext = cloud.getWXContext();
  
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  
  const result = await db.collection('marks').add({
    data: {
      volumeId,
      text,
      page: page || `Mark`,
      vertical: vertical || false,
      date: dateStr,
      openid: wxContext.OPENID,
      createTime: db.serverDate()
    }
  });
  
  return {
    success: true,
    _id: result._id,
    date: dateStr
  };
};
