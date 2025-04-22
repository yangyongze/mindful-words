// 初始化设置页面
document.addEventListener('DOMContentLoaded', () => {
  // 从存储加载设置
  chrome.storage.local.get(['settings'], (result) => {
    if (result.settings) {
      document.getElementById('theme').value = result.settings.theme || 'light';
    }
  });

  // 保存设置
  document.getElementById('save-settings').addEventListener('click', () => {
    const settings = {
      theme: document.getElementById('theme').value
    };
    
    chrome.storage.local.set({ settings }, () => {
      // 发送主题更新消息给所有页面
      chrome.runtime.sendMessage({
        type: 'update_theme',
        theme: settings.theme
      });
      
      alert('设置已保存');
    });
  });


});

// 标签管理功能
function manageTags() {
  // 从存储加载所有笔记
  chrome.storage.local.get(['notes'], (result) => {
    if (result.notes) {
      // 提取所有标签
      const allTags = [];
      result.notes.forEach(note => {
        if (note.tags && note.tags.length > 0) {
          note.tags.forEach(tag => {
            if (!allTags.includes(tag)) {
              allTags.push(tag);
            }
          });
        }
      });
      
      // 显示标签管理界面
      renderTagManager(allTags);
    }
  });
}

// 渲染标签管理器
function renderTagManager(tags) {
  const tagManager = document.getElementById('tag-manager');
  tagManager.innerHTML = '';
  
  // 添加标签输入框
  const tagInputContainer = document.createElement('div');
  tagInputContainer.style.marginBottom = '10px';
  tagInputContainer.innerHTML = `
    <input type="text" id="new-tag" placeholder="输入新标签">
    <button id="add-tag-btn">添加</button>
  `;
  tagManager.appendChild(tagInputContainer);
  
  // 添加标签按钮事件
  document.getElementById('add-tag-btn').addEventListener('click', () => {
    const newTag = document.getElementById('new-tag').value.trim();
    if (newTag && !tags.includes(newTag)) {
      tags.push(newTag);
      renderTagManager(tags);
      document.getElementById('new-tag').value = '';
    }
  });
  
  // 显示标签列表
  if (tags.length > 0) {
    const tagList = document.createElement('ul');
    tagList.style.listStyle = 'none';
    tagList.style.padding = '0';
    
    tags.forEach((tag, index) => {
      const tagItem = document.createElement('li');
      tagItem.style.margin = '5px 0';
      tagItem.style.display = 'flex';
      tagItem.style.alignItems = 'center';
      
      const tagText = document.createElement('span');
      tagText.textContent = tag;
      tagText.style.flexGrow = '1';
      
      const editBtn = document.createElement('button');
      editBtn.textContent = '编辑';
      editBtn.style.margin = '0 5px';
      editBtn.addEventListener('click', () => {
        const newTag = prompt('编辑标签:', tag);
        if (newTag && newTag.trim()) {
          tags[index] = newTag.trim();
          renderTagManager(tags);
        }
      });
      
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '删除';
      deleteBtn.addEventListener('click', () => {
        if (confirm(`确定删除标签 "${tag}"?`)) {
          tags.splice(index, 1);
          renderTagManager(tags);
        }
      });
      
      tagItem.appendChild(tagText);
      tagItem.appendChild(editBtn);
      tagItem.appendChild(deleteBtn);
      tagList.appendChild(tagItem);
    });
    
    tagManager.appendChild(tagList);
  }
}