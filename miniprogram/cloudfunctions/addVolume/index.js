const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { title, author, classifications } = event;
  const wxContext = cloud.getWXContext();
  
  const archivalId = `V-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const result = await db.collection('volumes').add({
    data: {
      title,
      author: author || '',
      classifications: classifications || [],
      archivalId,
      openid: wxContext.OPENID,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });
  
  return {
    success: true,
    _id: result._id,
    archivalId
  };
};
