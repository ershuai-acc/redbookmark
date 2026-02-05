const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  try {
    const fileList = [
      'cloud://cloud1-1ga45e303c7e0c3b.636c-cloud1-1ga45e303c7e0c3b-1330529037/fonts/DMSerifDisplay-Italic.ttf',
      'cloud://cloud1-1ga45e303c7e0c3b.636c-cloud1-1ga45e303c7e0c3b-1330529037/fonts/Newsreader-Italic.ttf'
    ];
    
    const result = await cloud.getTempFileURL({
      fileList: fileList
    });
    
    return {
      success: true,
      data: result.fileList
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
};
