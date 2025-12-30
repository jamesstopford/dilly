// DOM builders for Dilly

// Render the scorecard
function renderScorecard(data) {
  const total = data.template.length;

  // Separate template items from one-off items in done
  const templateItemIds = new Set(data.template.map(item => item.id));
  const doneItemIds = Object.keys(data.currentDay.done);

  const templateCompleted = doneItemIds.filter(id => templateItemIds.has(id)).length;
  const oneOffCompleted = doneItemIds.filter(id => !templateItemIds.has(id)).length;

  const percentage = total > 0 ? Math.round((templateCompleted / total) * 100) : 0;

  // Build the completion text
  let completionText = `${templateCompleted} / ${total}`;
  if (oneOffCompleted > 0) {
    completionText += ` +${oneOffCompleted}`;
  }

  const scorecard = document.getElementById('header-scorecard');
  scorecard.innerHTML = `
    <div class="progress-bar-container">
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
      <div class="progress-text">${completionText}</div>
    </div>
  `;
}

// Create a card element for daily view
function createDailyCard(data, itemId, isDone = false) {
  const item = getTemplateItemById(data, itemId);
  if (!item) return null;

  // Check if this is a one-off item
  const isOneOff = data.currentDay.oneOffItems?.some(oi => oi.id === itemId);

  const category = getCategoryByName(data, item.category);
  const emoji = category ? category.emoji : '📌';

  const card = document.createElement('div');
  card.className = `card ${isDone ? 'done' : ''} ${isOneOff ? 'oneoff-card' : ''}`;
  card.dataset.itemId = itemId;

  if (!isDone) {
    card.draggable = true;
  }

  let timestampHtml = '';
  if (isDone && data.currentDay.done[itemId]) {
    const timestamp = data.currentDay.done[itemId];
    timestampHtml = `<div class="timestamp">${getRelativeTime(timestamp)}</div>`;
  }

  // Build category options for one-off items
  let categorySelect = '';
  if (isOneOff && !isDone) {
    const categoryOptions = data.categories.map(cat => {
      const selected = cat.name === item.category ? 'selected' : '';
      return `<option value="${escapeHtml(cat.name)}" ${selected} title="${escapeHtml(cat.name)}">${cat.emoji}</option>`;
    }).join('');
    categorySelect = `<select class="oneoff-category-select" data-oneoff-id="${itemId}">${categoryOptions}</select>`;
  }

  // Title display - editable for one-off pending items
  let titleContent;
  if (isOneOff && !isDone) {
    titleContent = `<input type="text" class="oneoff-title-input" data-oneoff-id="${itemId}" value="${escapeHtml(item.title)}" placeholder="Task name...">`;
  } else {
    titleContent = `<div class="title">${escapeHtml(item.title)}</div>`;
  }

  // Disable Done button if one-off task has no title yet
  const doneDisabled = isOneOff && !isDone && !item.title ? 'disabled' : '';

  const actionButton = isDone
    ? '<button class="undo-btn" data-item-id="' + itemId + '">Undo</button>'
    : '<button class="done-btn" data-item-id="' + itemId + '" ' + doneDisabled + '>Done</button>';

  // Add menu icon for both one-off and template tasks (when pending)
  const menuIcon = !isDone
    ? '<div class="task-menu-icon" data-item-id="' + itemId + '" data-is-oneoff="' + isOneOff + '">⋮</div>'
    : '';

  card.innerHTML = `
    ${!isDone ? '<div class="drag-handle">☰</div>' : ''}
    ${!isDone && isOneOff ? categorySelect : '<div class="emoji">' + emoji + '</div>'}
    <div class="content">
      ${titleContent}
      ${timestampHtml}
    </div>
    <div class="actions">
      ${actionButton}
      ${menuIcon}
    </div>
  `;

  return card;
}

// Render pending items list
function renderPendingItems(data) {
  const container = document.getElementById('pending-items');
  container.innerHTML = '';

  if (data.currentDay.pending.length === 0) {
    container.innerHTML = '<div class="item-list empty">All done! 🎉</div>';
    return;
  }

  const list = document.createElement('div');
  list.className = 'item-list';
  list.id = 'pending-list';

  data.currentDay.pending.forEach(itemId => {
    const card = createDailyCard(data, itemId, false);
    if (card) {
      list.appendChild(card);
    }
  });

  container.appendChild(list);
}

// Render done items list
function renderDoneItems(data) {
  const container = document.getElementById('done-items');
  container.innerHTML = '';

  const doneIds = Object.keys(data.currentDay.done);
  if (doneIds.length === 0) {
    container.innerHTML = '<div class="item-list empty">No completed items yet</div>';
    return;
  }

  const list = document.createElement('div');
  list.className = 'item-list';

  // Sort by completion time (most recent first)
  doneIds.sort((a, b) => {
    return new Date(data.currentDay.done[b]) - new Date(data.currentDay.done[a]);
  });

  doneIds.forEach(itemId => {
    const card = createDailyCard(data, itemId, true);
    if (card) {
      list.appendChild(card);
    }
  });

  container.appendChild(list);
}

// Render the entire daily view
function renderDailyView(data) {
  renderScorecard(data);
  renderPendingItems(data);
  renderDoneItems(data);
}

// Render template items for edit view
function renderTemplateItems(data) {
  const container = document.getElementById('template-items');
  container.innerHTML = '';

  if (data.template.length === 0) {
    container.innerHTML = '<div class="item-list empty">No items in template. Add one below!</div>';
    return;
  }

  // Sort by order
  const sortedTemplate = [...data.template].sort((a, b) => a.order - b.order);

  sortedTemplate.forEach(item => {
    const templateItem = createTemplateItem(data, item);
    container.appendChild(templateItem);
  });
}

// Create a template item element
function createTemplateItem(data, item) {
  const div = document.createElement('div');
  div.className = 'template-item card';
  div.dataset.itemId = item.id;
  div.draggable = true;

  // Build category options
  const categoryOptions = data.categories.map(cat => {
    const selected = cat.name === item.category ? 'selected' : '';
    return `<option value="${escapeHtml(cat.name)}" ${selected}>${cat.emoji} ${escapeHtml(cat.name)}</option>`;
  }).join('');

  div.innerHTML = `
    <div class="drag-handle">☰</div>
    <select class="category-select" data-item-id="${item.id}">
      ${categoryOptions}
    </select>
    <input type="text" class="title-input" data-item-id="${item.id}" value="${escapeHtml(item.title)}" placeholder="Item title">
    <button class="delete-btn" data-item-id="${item.id}">🗑️</button>
  `;

  return div;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Render category select dropdown
function renderCategorySelect(categories, selectedCategory = null) {
  return categories.map(cat => {
    const selected = cat.name === selectedCategory ? 'selected' : '';
    return `<option value="${escapeHtml(cat.name)}" ${selected}>${cat.emoji} ${escapeHtml(cat.name)}</option>`;
  }).join('');
}
