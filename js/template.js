// Edit Template view logic

// Add a new template item
function addTemplateItem() {
  const data = loadData();

  const newItem = {
    id: generateId(),
    title: '',
    category: data.categories[0].name,
    order: data.template.length
  };

  data.template.push(newItem);
  saveData(data);

  renderTemplateItems(data);
  initTemplateDragDrop();
  attachTemplateEventListeners();

  // Focus on the new item's title input
  const newInput = document.querySelector(`input[data-item-id="${newItem.id}"]`);
  if (newInput) {
    newInput.focus();
  }
}

// Delete a template item
function deleteTemplateItem(itemId) {
  const data = loadData();

  // Remove from template
  data.template = data.template.filter(item => item.id !== itemId);

  // Reorder remaining items
  data.template.forEach((item, index) => {
    item.order = index;
  });

  // Remove from pending if present
  data.currentDay.pending = data.currentDay.pending.filter(id => id !== itemId);

  // Remove from done if present
  if (data.currentDay.done[itemId]) {
    delete data.currentDay.done[itemId];
  }

  saveData(data);

  renderTemplateItems(data);
  initTemplateDragDrop();
  attachTemplateEventListeners();
}

// Update template item title
function updateTemplateItemTitle(itemId, newTitle) {
  const data = loadData();
  const item = data.template.find(t => t.id === itemId);

  if (item) {
    item.title = newTitle;
    saveData(data);
  }
}

// Update template item category
function updateTemplateItemCategory(itemId, newCategory) {
  const data = loadData();
  const item = data.template.find(t => t.id === itemId);

  if (item) {
    item.category = newCategory;
    saveData(data);
  }
}

// Attach event listeners to template items
function attachTemplateEventListeners() {
  // Delete buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const itemId = e.target.dataset.itemId;
      if (confirm('Delete this item?')) {
        deleteTemplateItem(itemId);
      }
    });
  });

  // Title inputs
  document.querySelectorAll('.title-input').forEach(input => {
    input.addEventListener('blur', (e) => {
      const itemId = e.target.dataset.itemId;
      const newTitle = e.target.value.trim();
      if (newTitle) {
        updateTemplateItemTitle(itemId, newTitle);
      }
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.target.blur();
      }
    });
  });

  // Category selects
  document.querySelectorAll('.category-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const itemId = e.target.dataset.itemId;
      const newCategory = e.target.value;
      updateTemplateItemCategory(itemId, newCategory);
    });
  });
}

// Open manage categories modal
function openManageCategoriesModal() {
  const modal = document.getElementById('categories-modal');
  const overlay = document.getElementById('modal-overlay');

  renderCategoriesModal();
  attachCategoryEventListeners();

  overlay.classList.add('active');
}

// Close manage categories modal
function closeManageCategoriesModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('active');

  // Refresh template view in case categories changed
  const data = loadData();
  renderTemplateItems(data);
  initTemplateDragDrop();
  attachTemplateEventListeners();
}

// Render categories in modal
function renderCategoriesModal() {
  const data = loadData();
  const container = document.getElementById('category-list');
  container.innerHTML = '';

  data.categories.forEach((cat, index) => {
    const isSeeded = index < 5; // First 5 are seeded
    const categoryItem = document.createElement('div');
    categoryItem.className = 'category-item card';

    categoryItem.innerHTML = `
      <input type="text" class="emoji-input" data-cat-index="${index}" value="${cat.emoji}" maxlength="2">
      <input type="text" class="name-input" data-cat-index="${index}" value="${escapeHtml(cat.name)}" ${isSeeded ? 'readonly' : ''}>
      ${isSeeded ? '<span class="seeded">SEEDED</span>' : '<button class="delete-btn" data-cat-index="' + index + '">🗑️</button>'}
    `;

    container.appendChild(categoryItem);
  });

  // Update add button state
  const addBtn = document.getElementById('add-category-btn');
  const customCount = data.categories.length - 5;
  if (customCount >= 5) {
    addBtn.disabled = true;
    addBtn.textContent = '+ Add Custom Category (Max 5)';
  } else {
    addBtn.disabled = false;
    addBtn.textContent = `+ Add Custom Category (${customCount}/5)`;
  }
}

// Attach event listeners for category modal
function attachCategoryEventListeners() {
  const data = loadData();

  // Emoji inputs
  document.querySelectorAll('.emoji-input').forEach(input => {
    input.addEventListener('blur', (e) => {
      const index = parseInt(e.target.dataset.catIndex);
      const newEmoji = e.target.value.trim();
      if (newEmoji) {
        data.categories[index].emoji = newEmoji;
        saveData(data);
      }
    });
  });

  // Name inputs (only for custom categories)
  document.querySelectorAll('.name-input:not([readonly])').forEach(input => {
    input.addEventListener('blur', (e) => {
      const index = parseInt(e.target.dataset.catIndex);
      const newName = e.target.value.trim();
      if (newName) {
        data.categories[index].name = newName;
        saveData(data);
      }
    });
  });

  // Delete buttons
  document.querySelectorAll('.category-item .delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.catIndex);
      if (confirm('Delete this category? Items using it will keep the category name.')) {
        deleteCategory(index);
      }
    });
  });
}

// Add a new custom category
function addCustomCategory() {
  const data = loadData();

  if (data.categories.length >= 10) {
    alert('Maximum 10 categories allowed (5 seeded + 5 custom)');
    return;
  }

  const newCategory = {
    name: 'New Category',
    emoji: '📌'
  };

  data.categories.push(newCategory);
  saveData(data);

  renderCategoriesModal();
  attachCategoryEventListeners();

  // Focus on new category name input
  const inputs = document.querySelectorAll('.name-input:not([readonly])');
  const lastInput = inputs[inputs.length - 1];
  if (lastInput) {
    lastInput.focus();
    lastInput.select();
  }
}

// Delete a custom category
function deleteCategory(index) {
  const data = loadData();

  if (index < 5) {
    alert('Cannot delete seeded categories');
    return;
  }

  data.categories.splice(index, 1);
  saveData(data);

  renderCategoriesModal();
  attachCategoryEventListeners();
}
