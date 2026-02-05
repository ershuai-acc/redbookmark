const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { markId } = event;
  const wxContext = cloud.getWXContext();
  
  if (!markId) {
    return { success: false, error: 'Missing markId' };
  }

  try {
    const result = await db.collection('marks')
      .where({
        _id: markId,
        _openid: wxContext.OPENID
      })
      .remove();

    if (result.stats.removed === 0) {
      return { success: false, error: 'Mark not found or no permission' };
    }

    return { success: true };
  } catch (e) {
    console.error('Delete mark failed', e);
    return { success: false, error: e.message };
  }
};
