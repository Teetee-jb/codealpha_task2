(function () {
  var MAX_CHARS = 500;
  var POSTS_PER_PAGE = 10;

  // ─── API ───

  var api = {
    _headers: function () {
      var h = { 'Content-Type': 'application/json' };
      var token = localStorage.getItem('token');
      if (token) h['Authorization'] = 'Bearer ' + token;
      return h;
    },
    _handle: function (res) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        return Promise.reject(new Error('Unauthorized'));
      }
      return res.json().then(function (data) {
        if (!res.ok) return Promise.reject(data);
        return data;
      });
    },
    get: function (url) {
      return fetch(url, { headers: api._headers() }).then(api._handle);
    },
    post: function (url, data) {
      return fetch(url, {
        method: 'POST',
        headers: api._headers(),
        body: JSON.stringify(data)
      }).then(api._handle);
    },
    postForm: function (url, formData) {
      var h = {};
      var token = localStorage.getItem('token');
      if (token) h['Authorization'] = 'Bearer ' + token;
      return fetch(url, {
        method: 'POST',
        headers: h,
        body: formData
      }).then(api._handle);
    },
    put: function (url, data) {
      return fetch(url, {
        method: 'PUT',
        headers: api._headers(),
        body: JSON.stringify(data)
      }).then(api._handle);
    },
    delete: function (url) {
      return fetch(url, {
        method: 'DELETE',
        headers: api._headers()
      }).then(api._handle);
    }
  };

  // ─── Auth Helpers ───

  function getUser() {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch (e) { return null; }
  }

  function isLoggedIn() {
    return !!localStorage.getItem('token');
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  }

  function showAuthError(msg) {
    var el = document.getElementById('auth-error');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
  }

  function handleLogin(e) {
    e.preventDefault();
    var btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    api.post('/api/auth/login', {
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value
    }).then(function (data) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/index.html';
    }).catch(function (err) {
      showAuthError(err.error || err.message || 'Invalid credentials');
      btn.disabled = false;
      btn.textContent = 'Sign In';
    });
  }

  function handleRegister(e) {
    e.preventDefault();
    var btn = document.getElementById('register-btn');
    btn.disabled = true;
    btn.textContent = 'Creating account...';

    api.post('/api/auth/register', {
      username: document.getElementById('username').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value
    }).then(function (data) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/index.html';
    }).catch(function (err) {
      showAuthError(err.error || err.message || 'Registration failed');
      btn.disabled = false;
      btn.textContent = 'Create Account';
    });
  }

  // ─── Utilities ───

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"'`=\/]/g, function (s) {
      return {
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
        "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
      }[s];
    });
  }

  function timeAgo(date) {
    var seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm ago';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    var days = Math.floor(hours / 24);
    if (days < 30) return days + 'd ago';
    var months = Math.floor(days / 30);
    if (months < 12) return months + 'mo ago';
    return Math.floor(months / 12) + 'y ago';
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function () {
      toast.classList.add('removing');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  // ─── Post Card ───

  function createAvatarHtml(user) {
    if (user.avatar) {
      return '<div class="avatar"><img src="' + escapeHtml(user.avatar) + '" alt=""></div>';
    }
    return '<div class="avatar">' + getInitials(user.username) + '</div>';
  }

  function createPostCard(post) {
    var currentUser = getUser();
    var isOwner = currentUser && (post.author._id === currentUser._id || post.author._id === currentUser.id);
    var isLiked = currentUser && post.likes && post.likes.indexOf(currentUser._id || currentUser.id) !== -1;
    var likeCount = post.likes ? post.likes.length : 0;
    var commentCount = post.commentCount || 0;

    var card = document.createElement('div');
    card.className = 'post-card';
    card.dataset.postId = post._id;

    var menuHtml = '';
    if (isOwner) {
      menuHtml = '<div class="post-menu-wrapper">' +
        '<button class="post-menu-btn" data-action="toggle-menu" title="Options">\u22EF</button>' +
        '<div class="post-menu hidden">' +
        '<button data-action="edit-post">Edit</button>' +
        '<button data-action="delete-post" class="danger">Delete</button>' +
        '</div></div>';
    }

    card.innerHTML =
      '<a href="/profile.html?id=' + post.author._id + '">' + createAvatarHtml(post.author) + '</a>' +
      '<div class="post-body">' +
        '<div class="post-header">' +
          '<div class="post-author-info">' +
            '<a href="/profile.html?id=' + post.author._id + '" class="post-author-name">' + escapeHtml(post.author.username) + '</a>' +
            '<span class="post-handle">@' + escapeHtml(post.author.username) + '</span>' +
            '<span class="post-time">· ' + timeAgo(post.createdAt) + '</span>' +
          '</div>' +
          menuHtml +
        '</div>' +
        '<div class="post-content" data-content>' + escapeHtml(post.content) + '</div>' +
        (post.image ? '<div class="post-image"><img src="' + escapeHtml(post.image) + '" style="max-width:100%; border-radius:16px; margin-top:12px; border:1px solid var(--border);"></div>' : '') +
        '<div class="post-actions">' +
          '<button class="action-btn comment-toggle-btn" data-action="toggle-comments" data-post-id="' + post._id + '">' +
            '<div class="icon-bg"><span class="icon"><svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="currentColor"><g><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></g></svg></span></div>' +
            '<span class="comment-count">' + commentCount + '</span>' +
          '</button>' +
          '<button class="action-btn like-btn' + (isLiked ? ' liked' : '') + '" data-action="like" data-post-id="' + post._id + '">' +
            '<div class="icon-bg"><span class="icon">' + (isLiked ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="#f91880"><g><path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>' : '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><g><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>') + '</span></div>' +
            '<span class="like-count">' + likeCount + '</span>' +
          '</button>' +
        '</div>' +
      '</div>';

    return card;
  }

  // ─── Comments ───

  function createCommentElement(comment) {
    var el = document.createElement('div');
    el.className = 'comment-item';
    el.innerHTML =
      '<div class="comment-avatar">' + getInitials(comment.author ? comment.author.username : '') + '</div>' +
      '<div class="comment-body">' +
        '<span class="comment-author">' + escapeHtml(comment.author ? comment.author.username : 'Unknown') + '</span>' +
        '<p class="comment-text">' + escapeHtml(comment.content || comment.text || '') + '</p>' +
        '<span class="comment-time">' + timeAgo(comment.createdAt) + '</span>' +
      '</div>';
    return el;
  }

  function loadComments(postId, section) {
    var list = section.querySelector('.comment-list');
    list.innerHTML = '<div class="spinner spinner-sm" style="margin:12px auto;"></div>';

    api.get('/api/comments?postId=' + postId).then(function (data) {
      list.innerHTML = '';
      var comments = data.comments || [];
      if (!comments.length) {
        list.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;padding:8px 0;">No comments yet.</p>';
        return;
      }
      comments.forEach(function (c) {
        list.appendChild(createCommentElement(c));
      });
    }).catch(function () {
      list.innerHTML = '<p style="color:var(--danger);font-size:0.85rem;">Failed to load comments.</p>';
    });
  }

  function toggleComments(postCard) {
    var postId = postCard.dataset.postId;
    var existing = postCard.querySelector('.comments-section');
    if (existing) {
      existing.remove();
      return;
    }

    var section = document.createElement('div');
    section.className = 'comments-section';
    section.innerHTML =
      '<div class="comment-list"></div>' +
      '<form class="comment-form" data-post-id="' + postId + '">' +
        '<input class="comment-input" placeholder="Post your reply" required>' +
        '<button type="submit" class="btn btn-primary btn-sm">Reply</button>' +
      '</form>';

    var bodyEl = postCard.querySelector('.post-body');
    if (bodyEl) {
      bodyEl.appendChild(section);
    } else {
      postCard.appendChild(section);
    }
    loadComments(postId, section);

    section.querySelector('.comment-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = section.querySelector('.comment-input');
      var text = input.value.trim();
      if (!text) return;

      api.post('/api/comments', { postId: postId, text: text }).then(function (data) {
        var comment = data.comment;
        var list = section.querySelector('.comment-list');
        var noComments = list.querySelector('p');
        if (noComments) noComments.remove();
        list.appendChild(createCommentElement(comment));
        input.value = '';
        var countEl = postCard.querySelector('.comment-count');
        if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
      }).catch(function () {
        showToast('Failed to post comment', 'error');
      });
    });
  }

  // ─── Feed ───

  var feedState = {
    tab: 'following',
    page: 1,
    loading: false
  };

  function initFeed() {
    var composeForm = document.getElementById('compose-form');
    var textarea = document.getElementById('compose-textarea');
    var counter = document.getElementById('char-counter');
    var composeBtn = document.getElementById('compose-btn');
    var feedContainer = document.getElementById('feed-container');

    var currentUser = getUser();
    var avatarPlaceholder = document.getElementById('composer-avatar-placeholder');
    if (avatarPlaceholder && currentUser) {
      if (currentUser.avatar) {
        avatarPlaceholder.innerHTML = '<img src="' + escapeHtml(currentUser.avatar) + '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
      } else {
        avatarPlaceholder.textContent = getInitials(currentUser.username);
        avatarPlaceholder.style.display = 'flex';
        avatarPlaceholder.style.alignItems = 'center';
        avatarPlaceholder.style.justifyContent = 'center';
        avatarPlaceholder.style.color = '#fff';
      }
    }

    var imageInput = document.getElementById('post-image-input');
    var imagePreviewContainer = document.getElementById('image-preview-container');
    var imagePreview = document.getElementById('image-preview');
    var removeImageBtn = document.getElementById('remove-image-btn');

    function checkSubmitState() {
      var len = textarea.value.trim().length;
      var hasImage = imageInput && imageInput.files && imageInput.files.length > 0;
      composeBtn.disabled = (!len && !hasImage) || len > MAX_CHARS;
    }

    if (imageInput) {
      imageInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
          var reader = new FileReader();
          reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreviewContainer.style.display = 'block';
          };
          reader.readAsDataURL(this.files[0]);
        }
        checkSubmitState();
      });

      removeImageBtn.addEventListener('click', function () {
        imageInput.value = '';
        imagePreviewContainer.style.display = 'none';
        imagePreview.src = '';
        checkSubmitState();
      });
    }

    textarea.addEventListener('input', function () {
      var len = textarea.value.length;
      counter.textContent = len + ' / ' + MAX_CHARS;
      counter.className = 'char-counter';
      if (len > MAX_CHARS * 0.9) counter.classList.add('warn');
      if (len >= MAX_CHARS) counter.classList.add('over');
      checkSubmitState();
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    });

    composeForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var content = textarea.value.trim();
      var hasImage = imageInput && imageInput.files && imageInput.files.length > 0;
      if ((!content && !hasImage) || content.length > MAX_CHARS) return;

      composeBtn.disabled = true;
      
      var submitPromise;
      if (hasImage) {
        var formData = new FormData();
        formData.append('content', content);
        formData.append('image', imageInput.files[0]);
        submitPromise = api.postForm('/api/posts', formData);
      } else {
        submitPromise = api.post('/api/posts', { content: content });
      }

      submitPromise.then(function (data) {
        var post = data.post;
        textarea.value = '';
        counter.textContent = '0 / ' + MAX_CHARS;
        counter.className = 'char-counter';
        composeBtn.disabled = true;
        textarea.style.height = 'auto';
        if (imageInput) {
          imageInput.value = '';
          imagePreviewContainer.style.display = 'none';
          imagePreview.src = '';
        }
        feedContainer.prepend(createPostCard(post));
        showToast('Post published', 'success');
      }).catch(function () {
        showToast('Failed to create post', 'error');
        composeBtn.disabled = false;
      });
    });

    document.querySelectorAll('.feed-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelector('.feed-tab.active').classList.remove('active');
        tab.classList.add('active');
        feedState.tab = tab.dataset.tab;
        feedState.page = 1;
        feedContainer.innerHTML = '';
        loadFeed();
      });
    });

    feedContainer.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.dataset.action;
      var card = btn.closest('.post-card');

      if (action === 'like') {
        handleLike(btn, card);
      } else if (action === 'toggle-comments') {
        toggleComments(card);
      } else if (action === 'toggle-menu') {
        var menu = card.querySelector('.post-menu');
        menu.classList.toggle('hidden');
      } else if (action === 'edit-post') {
        startEditPost(card);
      } else if (action === 'delete-post') {
        handleDeletePost(card);
      }
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.post-menu-wrapper')) {
        document.querySelectorAll('.post-menu:not(.hidden)').forEach(function (m) {
          m.classList.add('hidden');
        });
      }
    });

    document.getElementById('load-more-btn').addEventListener('click', function () {
      feedState.page++;
      loadFeed(true);
    });

    loadFeed();
  }

  function loadFeed(append) {
    if (feedState.loading) return;
    feedState.loading = true;

    var feedContainer = document.getElementById('feed-container');
    var spinner = document.getElementById('feed-spinner');
    var loadMoreWrapper = document.getElementById('load-more-wrapper');

    if (!append) spinner.classList.remove('hidden');
    loadMoreWrapper.classList.add('hidden');

    var url = '/api/posts?page=' + feedState.page + '&limit=' + POSTS_PER_PAGE;
    if (feedState.tab === 'following') url += '&feed=true';

    api.get(url).then(function (data) {
      var posts = data.posts || [];
      spinner.classList.add('hidden');
      feedState.loading = false;

      if (!append && posts.length === 0) {
        feedContainer.innerHTML =
          '<div class="empty-state">' +
            '<div class="icon">\uD83D\uDCED</div>' +
            '<p>No posts yet. ' + (feedState.tab === 'following' ? 'Follow people to see their posts here.' : 'Be the first to share something.') + '</p>' +
          '</div>';
        return;
      }

      posts.forEach(function (post) {
        feedContainer.appendChild(createPostCard(post));
      });

      if (posts.length >= POSTS_PER_PAGE) {
        loadMoreWrapper.classList.remove('hidden');
      }
    }).catch(function () {
      spinner.classList.add('hidden');
      feedState.loading = false;
      showToast('Failed to load posts', 'error');
    });
  }

  function handleLike(btn, card) {
    var postId = btn.dataset.postId || card.dataset.postId;
    var isLiked = btn.classList.contains('liked');
    var icon = btn.querySelector('.icon');
    var countEl = btn.querySelector('.like-count');
    var count = parseInt(countEl.textContent);

    if (isLiked) {
      btn.classList.remove('liked');
      icon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><g><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>';
      countEl.textContent = Math.max(0, count - 1);
    } else {
      btn.classList.add('liked');
      icon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="#f91880"><g><path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>';
      countEl.textContent = count + 1;
    }

    api.post('/api/posts/' + postId + '/like').catch(function () {
      if (isLiked) {
        btn.classList.add('liked');
        icon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="#f91880"><g><path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>';
        countEl.textContent = count;
      } else {
        btn.classList.remove('liked');
        icon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><g><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>';
        countEl.textContent = count;
      }
    });
  }

  function startEditPost(card) {
    var contentEl = card.querySelector('[data-content]');
    var originalText = contentEl.textContent;
    var menu = card.querySelector('.post-menu');
    if (menu) menu.classList.add('hidden');

    contentEl.innerHTML =
      '<textarea class="edit-textarea">' + escapeHtml(originalText) + '</textarea>' +
      '<div class="edit-actions">' +
        '<button class="btn btn-primary btn-sm" data-action="save-edit">Save</button>' +
        '<button class="btn btn-ghost btn-sm" data-action="cancel-edit">Cancel</button>' +
      '</div>';

    var editTextarea = contentEl.querySelector('.edit-textarea');
    editTextarea.focus();
    editTextarea.setSelectionRange(editTextarea.value.length, editTextarea.value.length);

    contentEl.querySelector('[data-action="cancel-edit"]').addEventListener('click', function () {
      contentEl.textContent = originalText;
    });

    contentEl.querySelector('[data-action="save-edit"]').addEventListener('click', function () {
      var newText = editTextarea.value.trim();
      if (!newText) return;

      api.put('/api/posts/' + card.dataset.postId, { content: newText }).then(function () {
        contentEl.textContent = newText;
        showToast('Post updated', 'success');
      }).catch(function () {
        contentEl.textContent = originalText;
        showToast('Failed to update post', 'error');
      });
    });
  }

  function handleDeletePost(card) {
    if (!confirm('Delete this post? This cannot be undone.')) return;

    var menu = card.querySelector('.post-menu');
    if (menu) menu.classList.add('hidden');

    api.delete('/api/posts/' + card.dataset.postId).then(function () {
      card.style.transition = 'opacity 0.3s, transform 0.3s';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      setTimeout(function () { card.remove(); }, 300);
      showToast('Post deleted', 'success');
    }).catch(function () {
      showToast('Failed to delete post', 'error');
    });
  }

  // ─── Profile ───

  function initProfile() {
    var params = new URLSearchParams(window.location.search);
    var currentUser = getUser();
    var userId = params.get('id') || (currentUser ? (currentUser._id || currentUser.id) : null);

    if (!userId) {
      window.location.href = '/login.html';
      return;
    }

    var isOwnProfile = currentUser && (userId === currentUser._id || userId === currentUser.id);

    document.getElementById('profile-spinner').classList.remove('hidden');

    api.get('/api/users/' + userId).then(function (data) {
      var user = data.user;
      var followerCount = data.followerCount || 0;
      var followingCount = data.followingCount || 0;
      var isFollowingUser = data.isFollowing;

      document.getElementById('profile-spinner').classList.add('hidden');

      var avatarEl = document.getElementById('profile-avatar');
      if (user.avatar) {
        avatarEl.innerHTML = '<img src="' + escapeHtml(user.avatar) + '" alt="">';
      } else {
        avatarEl.textContent = getInitials(user.username);
      }

      document.getElementById('profile-username').textContent = user.username;
      var handleEl = document.getElementById('profile-handle');
      if (handleEl) handleEl.textContent = '@' + user.username;
      document.getElementById('profile-bio').textContent = user.bio || 'No bio yet.';
      document.getElementById('stat-followers').textContent = followerCount;
      document.getElementById('stat-following').textContent = followingCount;

      var actionsEl = document.getElementById('profile-actions');
      actionsEl.innerHTML = '';

      if (isOwnProfile) {
        var editBtn = document.createElement('button');
        editBtn.className = 'btn btn-outline btn-sm';
        editBtn.textContent = 'Edit Profile';
        editBtn.addEventListener('click', function () {
          document.getElementById('edit-bio').value = user.bio || '';
          document.getElementById('edit-avatar').value = user.avatar || '';
          document.getElementById('edit-modal').classList.add('active');
        });
        actionsEl.appendChild(editBtn);
      } else {
        var msgBtn = document.createElement('a');
        msgBtn.className = 'btn btn-outline btn-sm';
        msgBtn.href = '/messages.html?user=' + userId;
        msgBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><g><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.636V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 3.636-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z"></path></g></svg>';
        actionsEl.appendChild(msgBtn);

        var followBtn = document.createElement('button');
        followBtn.className = 'btn btn-sm ' + (isFollowingUser ? 'btn-outline' : 'btn-white');
        followBtn.textContent = isFollowingUser ? 'Following' : 'Follow';
        followBtn.addEventListener('click', function () {
          var method = followBtn.textContent === 'Follow' ? 'post' : 'delete';
          api[method]('/api/follow/' + userId).then(function () {
            if (method === 'post') {
              followBtn.textContent = 'Following';
              followBtn.className = 'btn btn-sm btn-outline';
              var fc = document.getElementById('stat-followers');
              fc.textContent = parseInt(fc.textContent) + 1;
            } else {
              followBtn.textContent = 'Follow';
              followBtn.className = 'btn btn-sm btn-white';
              var fc2 = document.getElementById('stat-followers');
              fc2.textContent = Math.max(0, parseInt(fc2.textContent) - 1);
            }
          }).catch(function () {
            showToast('Action failed', 'error');
          });
        });
        actionsEl.appendChild(followBtn);
      }

      loadProfilePosts(userId);
    }).catch(function () {
      document.getElementById('profile-spinner').classList.add('hidden');
      showToast('Failed to load profile', 'error');
    });

    if (isOwnProfile) {
      document.getElementById('edit-cancel').addEventListener('click', function () {
        document.getElementById('edit-modal').classList.remove('active');
      });

      document.getElementById('edit-modal').addEventListener('click', function (e) {
        if (e.target === this) this.classList.remove('active');
      });

      document.getElementById('edit-profile-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var bio = document.getElementById('edit-bio').value.trim();
        var avatar = document.getElementById('edit-avatar').value.trim();

        api.put('/api/users/' + userId, { bio: bio, avatar: avatar }).then(function (data) {
          var updated = data.user;
          document.getElementById('profile-bio').textContent = updated.bio || 'No bio yet.';
          var avatarEl = document.getElementById('profile-avatar');
          if (updated.avatar) {
            avatarEl.innerHTML = '<img src="' + escapeHtml(updated.avatar) + '" alt="">';
          } else {
            avatarEl.innerHTML = '';
            avatarEl.textContent = getInitials(updated.username);
          }
          document.getElementById('edit-modal').classList.remove('active');
          showToast('Profile updated', 'success');
        }).catch(function () {
          showToast('Failed to update profile', 'error');
        });
      });
    }
  }

  function loadProfilePosts(userId) {
    var container = document.getElementById('profile-posts');
    container.innerHTML = '<div class="spinner"></div>';

    api.get('/api/posts?author=' + userId + '&limit=50').then(function (data) {
      var posts = data.posts || [];
      container.innerHTML = '';
      var count = 0;
      posts.forEach(function (post) {
        if (post.author._id === userId || post.author === userId) {
          container.appendChild(createPostCard(post));
          count++;
        }
      });
      document.getElementById('stat-posts').textContent = count;
      if (!count) {
        container.innerHTML =
          '<div class="empty-state" style="padding:32px;text-align:center;color:var(--text-secondary);">' +
            '<p>No posts yet.</p>' +
          '</div>';
      }
    }).catch(function () {
      container.innerHTML = '';
      showToast('Failed to load posts', 'error');
    });

    container.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.dataset.action;
      var card = btn.closest('.post-card');

      if (action === 'like') handleLike(btn, card);
      else if (action === 'toggle-comments') toggleComments(card);
      else if (action === 'toggle-menu') {
        var menu = card.querySelector('.post-menu');
        menu.classList.toggle('hidden');
      } else if (action === 'edit-post') startEditPost(card);
      else if (action === 'delete-post') handleDeletePost(card);
    });
  }

  // ─── Init ───

  function initMessages() {
    var params = new URLSearchParams(window.location.search);
    var targetUserId = params.get('user');
    
    var listEl = document.getElementById('chat-list');
    var viewEl = document.getElementById('chat-view');

    if (targetUserId) {
      loadChatView(targetUserId);
    } else {
      loadInbox();
    }

    function loadInbox() {
      viewEl.innerHTML = '<div class="empty-state" style="padding:40px;text-align:center;color:var(--text-secondary);">Select a message</div>';
      api.get('/api/messages/conversations').then(function (data) {
        listEl.innerHTML = '';
        var convs = data.conversations || [];
        if (!convs.length) {
          listEl.innerHTML = '<div style="padding:16px;color:var(--text-secondary);">Welcome to your inbox!<br><br>Drop a line, share posts and more with private conversations between you and others on Pulse.</div>';
          return;
        }
        convs.forEach(function (c) {
          var item = document.createElement('a');
          item.className = 'chat-list-item';
          item.href = '/messages.html?user=' + c.partner._id;
          item.innerHTML = 
            createAvatarHtml(c.partner) +
            '<div class="chat-list-info">' +
              '<div style="font-weight:700;color:var(--text-primary);">' + escapeHtml(c.partner.username) + '</div>' +
              '<div style="font-size:0.85rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(c.lastMessage.text) + '</div>' +
            '</div>';
          listEl.appendChild(item);
        });
      });
    }

    function loadChatView(userId) {
      listEl.innerHTML = '<div class="spinner"></div>';
      api.get('/api/messages/conversations').then(function(d){
         listEl.innerHTML='';
         var convs = d.conversations || [];
         convs.forEach(function (c) {
          var item = document.createElement('a');
          item.className = 'chat-list-item' + (c.partner._id === userId ? ' active' : '');
          item.href = '/messages.html?user=' + c.partner._id;
          item.innerHTML = 
            createAvatarHtml(c.partner) +
            '<div class="chat-list-info">' +
              '<div style="font-weight:700;color:var(--text-primary);">' + escapeHtml(c.partner.username) + '</div>' +
              '<div style="font-size:0.85rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(c.lastMessage.text) + '</div>' +
            '</div>';
          listEl.appendChild(item);
        });
      });

      api.get('/api/users/' + userId).then(function(data){
         var partner = data.user;
         viewEl.innerHTML = 
           '<div class="chat-header">' +
             '<h3>' + escapeHtml(partner.username) + '</h3>' +
           '</div>' +
           '<div class="chat-history" id="chat-history"></div>' +
           '<form class="chat-input-form" id="chat-form">' +
             '<input type="text" id="chat-input" class="form-input" placeholder="Start a new message" required autocomplete="off">' +
             '<button type="submit" class="action-btn"><div class="icon-bg" style="color:var(--accent);"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><g><path d="M2.504 21.866l.526-2.108C3.04 19.719 4 15.823 4 12s-.96-7.719-.97-7.757l-.527-2.109L22.236 12 2.504 21.866zM5.981 13c-.072 1.962-.34 3.833-.583 5.183L17.764 12 5.398 5.818c.242 1.349.51 3.221.583 5.183H10v2H5.981z"></path></g></svg></div></button>' +
           '</form>';

         var historyEl = document.getElementById('chat-history');
         function fetchMsgs() {
           api.get('/api/messages/' + userId).then(function(mdata) {
             historyEl.innerHTML = '';
             var currentU = getUser();
             mdata.messages.forEach(function(m){
                var isMe = m.sender._id === currentU.id || m.sender._id === currentU._id;
                var b = document.createElement('div');
                b.className = 'chat-bubble ' + (isMe ? 'sent' : 'received');
                b.textContent = m.text;
                historyEl.appendChild(b);
             });
             historyEl.scrollTop = historyEl.scrollHeight;
           });
         }
         fetchMsgs();
         
         // simple polling every 5s
         setInterval(fetchMsgs, 5000);

         document.getElementById('chat-form').addEventListener('submit', function(e){
            e.preventDefault();
            var inp = document.getElementById('chat-input');
            var txt = inp.value.trim();
            if(!txt) return;
            inp.value = '';
            api.post('/api/messages', { receiverId: userId, text: txt }).then(function(mdata){
               var m = mdata.message;
               var b = document.createElement('div');
               b.className = 'chat-bubble sent';
               b.textContent = m.text;
               historyEl.appendChild(b);
               historyEl.scrollTop = historyEl.scrollHeight;
            });
         });
      });
    }
  }

  function initRightSidebar() {
    var container = document.getElementById('who-to-follow-container');
    if (!container) return;

    api.get('/api/users?limit=3').then(function(data) {
      if (!data.users || data.users.length === 0) {
        container.innerHTML = '<div style="color:var(--text-secondary);font-size:0.95rem;">No suggestions right now.</div>';
        return;
      }
      container.innerHTML = '';
      data.users.forEach(function(u) {
        var item = document.createElement('div');
        item.className = 'wtf-item';
        item.innerHTML = 
          '<a href="/profile.html?id=' + u._id + '" class="wtf-user-info" style="text-decoration:none;">' +
             (u.avatar ? '<img src="'+escapeHtml(u.avatar)+'" class="wtf-avatar" style="object-fit:cover;">' : '<div class="wtf-avatar">'+escapeHtml(getInitials(u.username))+'</div>') +
             '<div style="min-width:0;">' +
                '<span class="wtf-name">' + escapeHtml(u.username) + '</span>' +
                '<span class="wtf-handle">@' + escapeHtml(u.username).toLowerCase() + '</span>' +
             '</div>' +
          '</a>' +
          '<a href="/profile.html?id=' + u._id + '" class="btn btn-white" style="padding:6px 16px; font-size:0.85rem; min-height:32px; text-decoration:none;">View</a>';
        container.appendChild(item);
      });
    }).catch(function() {
      container.innerHTML = '<div style="color:var(--text-secondary);font-size:0.95rem;">Failed to load.</div>';
    });
  }

  function init() {
    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    if (document.getElementById('login-page')) {
      if (isLoggedIn()) { window.location.href = '/index.html'; return; }
      document.getElementById('login-form').addEventListener('submit', handleLogin);
      return;
    }

    if (document.getElementById('register-page')) {
      if (isLoggedIn()) { window.location.href = '/index.html'; return; }
      document.getElementById('register-form').addEventListener('submit', handleRegister);
      return;
    }

    if (!isLoggedIn()) {
      window.location.href = '/login.html';
      return;
    }

    if (document.querySelector('.right-sidebar')) {
      initRightSidebar();
    }

    if (document.getElementById('feed-page')) {
      initFeed();
    } else if (document.getElementById('profile-page')) {
      initProfile();
    } else if (document.getElementById('messages-page')) {
      initMessages();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
