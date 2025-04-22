// 从chrome.storage加载笔记并显示在弹出窗口中
document.addEventListener('DOMContentLoaded', () => {
  // 应用当前主题
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
  };
  
  // 从存储加载主题设置
  chrome.storage.local.get(['settings'], (result) => {
    if (result.settings?.theme) {
      applyTheme(result.settings.theme);
    }
  });
  
  // 监听主题变更消息
  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === 'update_theme') {
      applyTheme(request.theme);
    }
  });
  
  // 确保DOM完全加载后再执行
  setTimeout(() => {
    const notesList = document.getElementById('notes-list');
    
    const loadWithRetry = (attempt = 1) => {
      chrome.storage.local.get(['notes'], (result) => {
        if (chrome.runtime.lastError) {
          console.error(`存储获取失败(尝试 ${attempt}):`, chrome.runtime.lastError);
          if (attempt < 3) {
            setTimeout(() => loadWithRetry(attempt + 1), 500);
          } else {
            // 最后一次失败后尝试从chrome.storage.sync加载
            chrome.storage.sync.get(['notes'], (syncResult) => {
              if (chrome.runtime.lastError) {
                console.error('同步存储加载也失败:', chrome.runtime.lastError);
                notesList.innerHTML = '<p style="color: red;">笔记加载失败，请检查扩展权限或刷新页面</p>';
              } else if (syncResult.notes && syncResult.notes.length > 0) {
                renderNotes(syncResult.notes);
              } else {
                notesList.innerHTML = '<p></p>';
              }
            });
          }
          return;
        }
        
        if (result.notes && result.notes.length > 0) {
          renderNotes(result.notes);
        } else {
          notesList.innerHTML = '<p></p>';
        }
      });
    };
    
    loadWithRetry();
    
    // 设置按钮点击事件
    document.getElementById('settings-btn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    
    // 设置导出按钮点击事件
    document.getElementById('export-btn').addEventListener('click', () => {
      chrome.storage.local.get(['notes'], (result) => {
        if (result.notes && result.notes.length > 0) {
          // 显示导出选项菜单
          const exportMenu = document.createElement('div');
          exportMenu.className = 'export-menu';
          exportMenu.innerHTML = `
            <div class="export-option" data-format="json">导出为JSON</div>
            <div class="export-option" data-format="csv">导出为CSV</div>
          `;
          
          document.body.appendChild(exportMenu);
          
          // 添加菜单样式
          const style = document.createElement('style');
          style.textContent = `
            .export-menu {
              position: absolute;
              right: 10px;
              top: 50px;
              background: white;
              border: 1px solid #ddd;
              border-radius: 4px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              z-index: 1000;
            }
            .export-option {
              padding: 8px 16px;
              cursor: pointer;
            }
            .export-option:hover {
              background: #f5f5f5;
            }
          `;
          document.head.appendChild(style);
          
          // 处理导出选项点击
          exportMenu.querySelectorAll('.export-option').forEach(option => {
            option.addEventListener('click', (e) => {
              const format = e.target.dataset.format;
              if (format === 'json') {
                exportNotesAsJSON(result.notes);
              } else if (format === 'csv') {
                exportNotesAsCSV(result.notes);
              }
              document.body.removeChild(exportMenu);
              document.head.removeChild(style);
            });
          });
          
          // 点击外部关闭菜单
          const closeMenu = (e) => {
            if (!exportMenu.contains(e.target) && e.target.id !== 'export-btn') {
              document.body.removeChild(exportMenu);
              document.head.removeChild(style);
              document.removeEventListener('click', closeMenu);
            }
          };
          
          setTimeout(() => {
            document.addEventListener('click', closeMenu);
          }, 0);
        } else {
          alert('没有可导出的笔记');
        }
      });
    });
  }, 100); // 100ms延迟确保DOM完全加载
  
  // 添加删除按钮点击事件处理
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-note')) {
      const noteId = parseInt(e.target.dataset.id);
      if (confirm('确定要删除这条笔记吗？')) {
        chrome.runtime.sendMessage({
          type: 'delete_note',
          id: noteId
        }, (response) => {
          if (response && response.status === 'success') {
            // 直接从当前notes数组移除对应项，避免重新加载
            chrome.storage.local.get(['notes'], (result) => {
              if (result.notes) {
                const updatedNotes = result.notes.filter(n => n.id !== noteId);
                renderNotes(updatedNotes);
              } else {
                document.getElementById('notes-list').innerHTML = '<p>暂无笔记</p>';
              }
            });
          } else {
            alert(response?.message || '删除失败，请重试');
          }
        });
      }
    } else if (e.target.classList.contains('edit-tags')) {
      const noteId = parseInt(e.target.dataset.id);
      chrome.storage.local.get(['notes'], (result) => {
        if (result.notes) {
          const note = result.notes.find(n => n.id === noteId);
          if (note) {
            // 显示标签编辑对话框
            const tagsInput = prompt('编辑标签(用逗号分隔)', note.tags ? note.tags.join(', ') : '');
            if (tagsInput !== null) {
              // 处理标签输入
              const newTags = tagsInput.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);
              
              // 更新笔记
              chrome.runtime.sendMessage({
                type: 'update_tags',
                id: noteId,
                tags: newTags
              }, (response) => {
                if (response && response.status === 'success') {
                  // 更新UI
                  note.tags = newTags;
                  renderNotes(result.notes);
                } else {
                  alert(response?.message || '标签更新失败');
                }
              });
            }
          }
        }
      });
    }
  });
});

// 导出笔记为JSON
function exportNotesAsJSON(notes) {
  const data = JSON.stringify(notes, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `mindful-notes-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

// 导出笔记为CSV
function exportNotesAsCSV(notes) {
  let csv = '内容,标签,创建时间,来源\n';
  
  notes.forEach(note => {
    const content = note.content.replace(/"/g, '""');
    const tags = note.tags ? note.tags.join(';') : '';
    const createdAt = new Date(note.createdAt).toLocaleString();
    const url = note.url;
    
    csv += `"${content}","${tags}","${createdAt}","${url}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `mindful-notes-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

// 渲染笔记列表
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  // const hours = String(date.getHours()).padStart(2, '0');
  // const minutes = String(date.getMinutes()).padStart(2, '0');
  // return `${year}-${month}-${day} ${hours}:${minutes}`;
  return `${year}-${month}-${day}`;
}

function renderNotes(notes) {
  const notesList = document.getElementById('notes-list');
  notesList.innerHTML = '';
  
  // 按创建时间降序排序
  const sortedNotes = notes.sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  
  // 创建笔记项
  sortedNotes.forEach(note => {
    const noteItem = document.createElement('div');
    noteItem.className = 'note-item';
    noteItem.innerHTML = `
      <div class="note-content">${note.content}</div>
      ${note.tags && note.tags.length > 0 ? 
        `<div class="note-tags">
          ${note.tags.map(tag => `<span class="tag" style="display: inline-block; background:rgb(241, 241, 241); color:rgb(3, 3, 3); padding: 1px 6px; border-radius: 15px; margin-right: 4px; font-size: 10px;">${tag}</span>`).join('')}
        </div>` : ''}
      <div class="note-meta">
        ${formatDate(note.createdAt)}  | 
        <a href="${note.url}" class="note-url" target="_blank">来源</a>
        <span class="edit-tags" data-id="${note.id}">标签</span>
        <span class="delete-note" data-id="${note.id}">删除</span>
      </div>
    `;
    notesList.appendChild(noteItem);
  });
}