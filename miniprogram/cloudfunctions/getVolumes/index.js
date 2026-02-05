const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { keyword } = event;
  
  let query = db.collection('volumes').where({
    openid: wxContext.OPENID
  });
  
  if (keyword) {
    const _ = db.command;
    query = db.collection('volumes').where({
      openid: wxContext.OPENID,
      _: _.or([
        { title: db.RegExp({ regexp: keyword, options: 'i' }) },
        { author: db.RegExp({ regexp: keyword, options: 'i' }) },
        { classifications: _.elemMatch(db.RegExp({ regexp: keyword, options: 'i' })) }
      ])
    });
  }
  
  const result = await query.orderBy('createTime', 'desc').get();
  
  return {
    success: true,
    data: result.data
  };
};
