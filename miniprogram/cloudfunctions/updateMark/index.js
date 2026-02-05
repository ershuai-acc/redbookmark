const cloud = require('wx-server-sdk');

exports.main = async (event, context) => {
  cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
  });
  
  const db = cloud.database();
  const { markId, text, page, vertical } = event;
  
  if (!markId || !text) {
    return { success: false, error: 'Missing parameters' };
  }

  try {
    const _ = db.command;
    const updateData = {
      text: text,
      page: page
    };
    
    // Include vertical field if provided (can be true or false)
    if (typeof vertical === 'boolean') {
      updateData.vertical = vertical;
    }
    
    const result = await db.collection('marks').doc(markId).update({
      data: updateData
    });

    return { success: true, updated: result.stats.updated };
  } catch (e) {
    console.error('Update mark failed:', e);
    return { 
      success: false, 
      error: e.message,
      errCode: e.errCode,
      errMsg: e.errMsg
    };
  }
};
