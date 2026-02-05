const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { volumeId } = event;
  
  let query = db.collection('marks').where({
    openid: wxContext.OPENID
  });
  
  if (volumeId) {
    query = db.collection('marks').where({
      openid: wxContext.OPENID,
      volumeId
    });
  }
  
  const result = await query.orderBy('createTime', 'desc').get();
  
  return {
    success: true,
    data: result.data
  };
};
