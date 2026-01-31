// GitHub Gist 笔记应用
class NotesApp {
  constructor() {
    this.token = localStorage.getItem('github_token') || '';
    this.gistId = localStorage.getItem('notes_gist_id') || '';
    this.currentEditId = null;
    this.notes = [];
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateAuthUI();
    
    if (this.token) {
      this.loadNotes();
    }
  }

  bindEvents() {
    // 认证相关
    document.getElementById('connect-btn').addEventListener('click', () => this.connect());
    document.getElementById('disconnect-btn').addEventListener('click', () => this.disconnect());
    
    // 笔记操作
    document.getElementById('save-note-btn').addEventListener('click', () => this.saveNote());
    document.getElementById('cancel-edit-btn').addEventListener('click', () => this.cancelEdit());
    document.getElementById('refresh-btn').addEventListener('click', () => this.loadNotes());
    
    // Enter键保存
    document.getElementById('github-token').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.connect();
    });
  }

  async connect() {
    const tokenInput = document.getElementById('github-token');
    const token = tokenInput.value.trim();
    
    if (!token) {
      alert('请输入 GitHub Token');
      return;
    }

    try {
      // 验证 token
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('Token 无效');
      }

      this.token = token;
      localStorage.setItem('github_token', token);
      tokenInput.value = '';
      
      this.updateAuthUI();
      await this.loadNotes();
      
    } catch (error) {
      alert('连接失败：' + error.message);
    }
  }

  disconnect() {
    if (confirm('确定要断开连接吗？这不会删除你的笔记数据。')) {
      this.token = '';
      this.gistId = '';
      localStorage.removeItem('github_token');
      localStorage.removeItem('notes_gist_id');
      this.notes = [];
      this.updateAuthUI();
    }
  }

  updateAuthUI() {
    const authStatus = document.getElementById('auth-status');
    const authControls = document.getElementById('auth-controls');
    const tokenInput = document.getElementById('github-token');
    const connectBtn = document.getElementById('connect-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');
    const editorSection = document.getElementById('editor-section');
    const notesListSection = document.getElementById('notes-list-section');

    if (this.token) {
      authStatus.innerHTML = '<p style="color: #10b981;">✓ 已连接到 GitHub</p>';
      tokenInput.style.display = 'none';
      connectBtn.style.display = 'none';
      disconnectBtn.style.display = 'inline-block';
      editorSection.style.display = 'block';
      notesListSection.style.display = 'block';
    } else {
      authStatus.innerHTML = '<p>请先连接 GitHub 以使用笔记功能</p>';
      tokenInput.style.display = 'block';
      connectBtn.style.display = 'inline-block';
      disconnectBtn.style.display = 'none';
      editorSection.style.display = 'none';
      notesListSection.style.display = 'none';
    }
  }

  async loadNotes() {
    const loading = document.getElementById('loading');
    const notesList = document.getElementById('notes-list');
    const emptyState = document.getElementById('empty-state');

    loading.style.display = 'block';
    notesList.innerHTML = '';
    emptyState.style.display = 'none';

    try {
      // 如果没有 gist ID，尝试查找或创建
      if (!this.gistId) {
        await this.findOrCreateGist();
      }

      // 获取 gist 内容
      const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('获取笔记失败');
      }

      const gist = await response.json();
      const notesFile = gist.files['notes.json'];
      
      if (notesFile) {
        this.notes = JSON.parse(notesFile.content);
      } else {
        this.notes = [];
      }

      this.renderNotes();

    } catch (error) {
      console.error('加载笔记失败：', error);
      alert('加载笔记失败：' + error.message);
    } finally {
      loading.style.display = 'none';
    }
  }

  async findOrCreateGist() {
    try {
      // 查找现有的笔记 gist
      const response = await fetch('https://api.github.com/gists', {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('获取 Gist 列表失败');
      }

      const gists = await response.json();
      const notesGist = gists.find(g => g.description === 'My Private Notes');

      if (notesGist) {
        this.gistId = notesGist.id;
        localStorage.setItem('notes_gist_id', this.gistId);
      } else {
        // 创建新的 gist
        await this.createGist();
      }
    } catch (error) {
      throw new Error('初始化笔记存储失败：' + error.message);
    }
  }

  async createGist() {
    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: 'My Private Notes',
        public: false,
        files: {
          'notes.json': {
            content: JSON.stringify([])
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error('创建笔记存储失败');
    }

    const gist = await response.json();
    this.gistId = gist.id;
    localStorage.setItem('notes_gist_id', this.gistId);
  }

  async saveNote() {
    const titleInput = document.getElementById('note-title');
    const contentInput = document.getElementById('note-content');
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!content) {
      alert('请输入笔记内容');
      return;
    }

    const now = new Date().toISOString();

    if (this.currentEditId) {
      // 编辑现有笔记
      const note = this.notes.find(n => n.id === this.currentEditId);
      if (note) {
        note.title = title;
        note.content = content;
        note.updatedAt = now;
      }
    } else {
      // 创建新笔记
      const note = {
        id: Date.now().toString(),
        title: title || '无标题',
        content: content,
        createdAt: now,
        updatedAt: now
      };
      this.notes.unshift(note);
    }

    await this.syncNotes();
    
    titleInput.value = '';
    contentInput.value = '';
    this.currentEditId = null;
    this.cancelEdit();
  }

  async syncNotes() {
    try {
      const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {
            'notes.json': {
              content: JSON.stringify(this.notes, null, 2)
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('同步失败');
      }

      this.renderNotes();
    } catch (error) {
      alert('保存失败：' + error.message);
    }
  }

  renderNotes() {
    const notesList = document.getElementById('notes-list');
    const emptyState = document.getElementById('empty-state');

    if (this.notes.length === 0) {
      notesList.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    notesList.innerHTML = this.notes.map(note => `
      <div class="note-item" data-id="${note.id}">
        <div class="note-header">
          <h4class="note-title">${this.escapeHtml(note.title)}</h4>
          <span class="note-date">${this.formatDate(note.createdAt)}</span>
        </div>
        <div class="note-content">${this.escapeHtml(note.content)}</div>
        <div class="note-actions">
          <button class="notes-btn notes-btn-secondary" onclick="notesApp.editNote('${note.id}')">编辑</button>
          <button class="notes-btn notes-btn-secondary" onclick="notesApp.deleteNote('${note.id}')">删除</button>
        </div>
      </div>
    `).join('');
  }

  editNote(id) {
    const note = this.notes.find(n => n.id === id);
    if (!note) return;

    document.getElementById('note-title').value = note.title === '无标题' ? '' : note.title;
    document.getElementById('note-content').value = note.content;
    document.getElementById('editor-title').textContent = '编辑笔记';
    document.getElementById('cancel-edit-btn').style.display = 'inline-block';
    
    this.currentEditId = id;
    //滚动到编辑器
    document.getElementById('editor-section').scrollIntoView({ behavior: 'smooth' });
  }

  cancelEdit() {
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    document.getElementById('editor-title').textContent = '添加新笔记';
    document.getElementById('cancel-edit-btn').style.display = 'none';
    this.currentEditId = null;
  }

  async deleteNote(id) {
    if (!confirm('确定要删除这条笔记吗？')) {
      return;
    }

    this.notes = this.notes.filter(n => n.id !== id);
    await this.syncNotes();}

  formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// 初始化应用
let notesApp;
document.addEventListener('DOMContentLoaded', () => {
  notesApp = new NotesApp();
});