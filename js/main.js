// Main app initialization and routing

let currentView = 'daily';

// Initialize the app
function initApp() {
  const data = loadData();

  // Apply theme
  applyTheme(data.settings.theme);

  // Show daily view by default
  showView('daily');

  // Attach header event listeners
  attachHeaderEventListeners();

  // Render initial view
  renderDailyView(data);
  initDailyDragDrop();
  attachDailyEventListeners();
}

// Show a specific view
function showView(viewName) {
  currentView = viewName;

  // Close any open task menus
  const existingMenu = document.querySelector('.task-menu-popover');
  if (existingMenu) {
    existingMenu.remove();
    document.removeEventListener('click', closeTaskMenu);
  }

  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });

  // Show the selected view
  const view = document.getElementById(`${viewName}-view`);
  if (view) {
    view.classList.add('active');
  }

  // Render the appropriate content
  const data = loadData();

  if (viewName === 'daily') {
    renderDailyView(data);
    initDailyDragDrop();
    attachDailyEventListeners();
  } else if (viewName === 'template') {
    renderTemplateItems(data);
    initTemplateDragDrop();
    attachTemplateEventListeners();
  }
}

// Apply theme to body
function applyTheme(theme) {
  document.body.className = `theme-${theme}`;

  // Update theme selector
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.value = theme;
  }
}

// Change theme
function changeTheme(newTheme) {
  const data = loadData();
  data.settings.theme = newTheme;
  saveData(data);
  applyTheme(newTheme);
}

// Reset the day
function resetDay() {
  if (!confirm('Reset the day? This will clear all completed items and reset the pending list to match your template.')) {
    return;
  }

  const data = loadData();

  // Reset current day
  data.currentDay = {
    dateString: getTodayString(),
    pending: data.template.map(item => item.id),
    done: {},
    oneOffItems: []
  };

  saveData(data);

  // Re-render daily view
  renderDailyView(data);
  initDailyDragDrop();
  attachDailyEventListeners();
}

// Mark item as done
function markItemDone(itemId) {
  const data = loadData();

  // Remove from pending
  data.currentDay.pending = data.currentDay.pending.filter(id => id !== itemId);

  // Add to done with timestamp
  data.currentDay.done[itemId] = getNowISO();

  saveData(data);

  // Re-render
  renderDailyView(data);
  initDailyDragDrop();
  attachDailyEventListeners();
}

// Undo item (move from done back to pending)
function undoItem(itemId) {
  const data = loadData();

  // Remove from done
  delete data.currentDay.done[itemId];

  // Add back to pending (at the end)
  if (!data.currentDay.pending.includes(itemId)) {
    data.currentDay.pending.push(itemId);
  }

  saveData(data);

  // Re-render
  renderDailyView(data);
  initDailyDragDrop();
  attachDailyEventListeners();
}

// Add a one-off task
function addOneOffTask() {
  const data = loadData();

  // Create new one-off item with first category as default
  const newItem = {
    id: generateId(),
    title: '',
    category: data.categories[0].name
  };

  // Add to one-off items
  data.currentDay.oneOffItems.push(newItem);

  // Add to pending
  data.currentDay.pending.push(newItem.id);

  saveData(data);

  // Re-render
  renderDailyView(data);
  initDailyDragDrop();
  attachDailyEventListeners();

  // Focus on the new item's title (we'll need to modify the render to support editing)
  setTimeout(() => {
    const input = document.querySelector(`[data-oneoff-id="${newItem.id}"]`);
    if (input) {
      input.focus();
    }
  }, 100);
}

// Delete a one-off task
function deleteOneOffTask(itemId) {
  const data = loadData();

  // Remove from one-off items
  data.currentDay.oneOffItems = data.currentDay.oneOffItems.filter(item => item.id !== itemId);

  // Remove from pending if present
  data.currentDay.pending = data.currentDay.pending.filter(id => id !== itemId);

  // Remove from done if present
  if (data.currentDay.done[itemId]) {
    delete data.currentDay.done[itemId];
  }

  saveData(data);

  // Re-render
  renderDailyView(data);
  initDailyDragDrop();
  attachDailyEventListeners();
}

// Update one-off task title
function updateOneOffTitle(itemId, newTitle) {
  const data = loadData();
  const item = data.currentDay.oneOffItems.find(item => item.id === itemId);

  if (item) {
    item.title = newTitle;
    saveData(data);
  }
}

// Update one-off task category
function updateOneOffCategory(itemId, newCategory) {
  const data = loadData();
  const item = data.currentDay.oneOffItems.find(item => item.id === itemId);

  if (item) {
    item.category = newCategory;
    saveData(data);
  }
}

// Show task menu popover
function showTaskMenu(itemId, triggerElement, isOneOff) {
  // Remove any existing menu
  const existingMenu = document.querySelector('.task-menu-popover');
  if (existingMenu) {
    existingMenu.remove();
  }

  // Create menu popover
  const menu = document.createElement('div');
  menu.className = 'task-menu-popover';

  if (isOneOff) {
    menu.innerHTML = `
      <button class="menu-action-btn" data-item-id="${itemId}" data-action="delete-oneoff">
        <span class="menu-icon">🗑️</span>
        <span class="menu-label">Delete</span>
      </button>
    `;
  } else {
    menu.innerHTML = `
      <button class="menu-action-btn" data-item-id="${itemId}" data-action="skip-today">
        <span class="menu-icon">⏭️</span>
        <span class="menu-label">Skip Today</span>
      </button>
    `;
  }

  // Position the menu to the right of the trigger
  const rect = triggerElement.getBoundingClientRect();
  menu.style.position = 'fixed';

  // Check if menu would overflow screen, if so position to the left
  const menuWidth = 140; // approximate width
  if (rect.right + 8 + menuWidth > window.innerWidth) {
    menu.style.right = `${window.innerWidth - rect.left + 8}px`;
  } else {
    menu.style.left = `${rect.right + 8}px`;
  }

  menu.style.top = `${rect.top}px`;

  document.body.appendChild(menu);

  // Add action handler
  menu.querySelector('.menu-action-btn').addEventListener('click', (e) => {
    const action = e.currentTarget.dataset.action;
    if (action === 'delete-oneoff') {
      deleteOneOffTask(itemId);
    } else if (action === 'skip-today') {
      skipTaskToday(itemId);
    }
    menu.remove();
  });

  // Close menu when clicking outside
  setTimeout(() => {
    document.addEventListener('click', closeTaskMenu);
  }, 0);
}

// Close task menu
function closeTaskMenu(e) {
  const menu = document.querySelector('.task-menu-popover');
  if (menu && !menu.contains(e.target)) {
    menu.remove();
    document.removeEventListener('click', closeTaskMenu);
  }
}

// Skip a task for today (remove from pending but keep in template)
function skipTaskToday(itemId) {
  const data = loadData();

  // Remove from pending
  data.currentDay.pending = data.currentDay.pending.filter(id => id !== itemId);

  saveData(data);

  // Re-render
  renderDailyView(data);
  initDailyDragDrop();
  attachDailyEventListeners();
}

// Attach event listeners to header buttons
function attachHeaderEventListeners() {
  // View switchers
  document.getElementById('daily-btn').addEventListener('click', () => {
    showView('daily');
  });

  document.getElementById('template-btn').addEventListener('click', () => {
    showView('template');
  });

  // Reset day button
  document.getElementById('reset-btn').addEventListener('click', resetDay);

  // Theme selector
  document.getElementById('theme-select').addEventListener('change', (e) => {
    changeTheme(e.target.value);
  });

  // Add item button (template view)
  document.getElementById('add-item-btn').addEventListener('click', addTemplateItem);

  // Manage categories button
  document.getElementById('manage-categories-btn').addEventListener('click', openManageCategoriesModal);

  // Back to today button
  document.getElementById('back-to-today-btn').addEventListener('click', () => {
    showView('daily');
  });

  // Modal close button
  document.getElementById('close-modal-btn').addEventListener('click', closeManageCategoriesModal);

  // Modal overlay click to close
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') {
      closeManageCategoriesModal();
    }
  });

  // Add category button
  document.getElementById('add-category-btn').addEventListener('click', addCustomCategory);

  // Add one-off task button
  document.getElementById('add-oneoff-btn').addEventListener('click', addOneOffTask);
}

// Attach event listeners to daily view items
function attachDailyEventListeners() {
  // Done buttons
  document.querySelectorAll('.done-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const itemId = e.target.dataset.itemId;
      markItemDone(itemId);
    });
  });

  // Undo buttons
  document.querySelectorAll('.undo-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const itemId = e.target.dataset.itemId;
      undoItem(itemId);
    });
  });

  // Task menu icons (both one-off and template)
  document.querySelectorAll('.task-menu-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = e.target.dataset.itemId;
      const isOneOff = e.target.dataset.isOneoff === 'true';
      showTaskMenu(itemId, e.target, isOneOff);
    });
  });

  // One-off title inputs
  document.querySelectorAll('.oneoff-title-input').forEach(input => {
    input.addEventListener('blur', (e) => {
      const itemId = e.target.dataset.oneoffId;
      const newTitle = e.target.value.trim();
      if (newTitle) {
        updateOneOffTitle(itemId, newTitle);
        // Re-render to enable Done button
        const data = loadData();
        renderDailyView(data);
        initDailyDragDrop();
        attachDailyEventListeners();
      } else {
        // If empty, delete the one-off task
        deleteOneOffTask(itemId);
      }
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.target.blur();
      }
    });
  });

  // One-off category selects
  document.querySelectorAll('.oneoff-category-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const itemId = e.target.dataset.oneoffId;
      const newCategory = e.target.value;
      updateOneOffCategory(itemId, newCategory);
    });
  });
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
