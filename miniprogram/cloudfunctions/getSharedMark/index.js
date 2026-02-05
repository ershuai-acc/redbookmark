const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { markId, volumeId } = event;
  
  if (!markId || !volumeId) {
    return { success: false, error: 'Missing parameters' };
  }

  try {
    const markRes = await db.collection('marks').doc(markId).get();
    const mark = markRes.data;
    
    const volumeRes = await db.collection('volumes').doc(volumeId).get();
    const volume = volumeRes.data;

    return {
      success: true,
      data: {
        mark: {
          _id: mark._id,
          text: mark.text,
          page: mark.page,
          date: mark.date
        },
        volume: {
          _id: volume._id,
          title: volume.title,
          author: volume.author
        }
      }
    };
  } catch (e) {
    console.error('Get shared mark failed', e);
    return { success: false, error: 'Mark not found' };
  }
};
