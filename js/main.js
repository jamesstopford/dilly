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
    done: {}
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
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
