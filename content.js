// 监听文本选择事件
document.addEventListener('mouseup', async function(event) {
  if (event.ctrlKey) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0) {
      // 获取网页信息
      const pageTitle = document.title;
      const pageUrl = window.location.href;
      
      // 直接发送消息给背景脚本
      chrome.runtime.sendMessage({
        type: 'save_note',
        content: selectedText,
        title: pageTitle,
        url: pageUrl,
        tags: []
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('扩展上下文失效:', chrome.runtime.lastError);
          alert('扩展已重新加载，请刷新页面后重试');
        }
      });
      
      // 显示保存反馈
      showSaveFeedback();
    }
  }
});



// 显示保存成功的反馈
function showSaveFeedback() {
  const feedback = document.createElement('div');
  feedback.style.position = 'fixed';
  feedback.style.bottom = '20px';
  feedback.style.right = '20px';
  feedback.style.padding = '10px 15px';
  feedback.style.backgroundColor = '#4CAF50';
  feedback.style.color = 'white';
  feedback.style.borderRadius = '4px';
  feedback.style.zIndex = '9999';
  feedback.textContent = '笔记已保存!';
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.remove();
  }, 2000);
}