// Drag and drop logic for Dilly

let draggedElement = null;
let draggedItemId = null;

// Initialize drag and drop for pending items (Daily View)
function initDailyDragDrop() {
  const pendingList = document.getElementById('pending-list');
  if (!pendingList) return;

  pendingList.addEventListener('dragstart', handleDragStart);
  pendingList.addEventListener('dragend', handleDragEnd);
  pendingList.addEventListener('dragover', handleDragOver);
  pendingList.addEventListener('drop', handleDrop);
}

// Initialize drag and drop for template items (Edit View)
function initTemplateDragDrop() {
  const templateContainer = document.getElementById('template-items');
  if (!templateContainer) return;

  templateContainer.addEventListener('dragstart', handleTemplateDragStart);
  templateContainer.addEventListener('dragend', handleDragEnd);
  templateContainer.addEventListener('dragover', handleDragOver);
  templateContainer.addEventListener('drop', handleTemplateDrop);
}

// Handle drag start
function handleDragStart(e) {
  if (!e.target.classList.contains('card')) return;

  draggedElement = e.target;
  draggedItemId = e.target.dataset.itemId;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.innerHTML);
}

// Handle template drag start
function handleTemplateDragStart(e) {
  const templateItem = e.target.closest('.template-item');
  if (!templateItem) return;

  draggedElement = templateItem;
  draggedItemId = templateItem.dataset.itemId;
  templateItem.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', templateItem.innerHTML);
}

// Handle drag end
function handleDragEnd(e) {
  if (draggedElement) {
    draggedElement.classList.remove('dragging');
  }

  // Remove drag-over class from all elements
  document.querySelectorAll('.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });

  draggedElement = null;
  draggedItemId = null;
}

// Handle drag over
function handleDragOver(e) {
  if (!draggedElement) return;

  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const afterElement = getDragAfterElement(e.currentTarget, e.clientY);

  // Remove previous drag-over indicators
  e.currentTarget.querySelectorAll('.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });

  if (afterElement == null) {
    e.currentTarget.appendChild(draggedElement);
  } else {
    e.currentTarget.insertBefore(draggedElement, afterElement);
  }
}

// Handle drop for pending items
function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  if (!draggedItemId) return;

  // Get new order from DOM
  const cards = document.querySelectorAll('#pending-list .card');
  const newOrder = Array.from(cards).map(card => card.dataset.itemId);

  // Update data
  const data = loadData();
  data.currentDay.pending = newOrder;
  saveData(data);

  // Re-render to ensure consistency
  renderPendingItems(data);
  initDailyDragDrop();
  attachDailyEventListeners();
}

// Handle drop for template items
function handleTemplateDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  if (!draggedItemId) return;

  // Get new order from DOM
  const items = document.querySelectorAll('#template-items .template-item');
  const newOrder = Array.from(items).map(item => item.dataset.itemId);

  // Update data - reorder template and update order field
  const data = loadData();

  // Create new template with updated order
  const reorderedTemplate = newOrder.map((id, index) => {
    const item = data.template.find(t => t.id === id);
    return { ...item, order: index };
  });

  data.template = reorderedTemplate;

  // Update pending list to match new template order
  const pendingSet = new Set(data.currentDay.pending);
  data.currentDay.pending = newOrder.filter(id => pendingSet.has(id));

  saveData(data);

  // Re-render
  renderTemplateItems(data);
  initTemplateDragDrop();
  attachTemplateEventListeners();
}

// Get the element that should come after the dragged element
function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll('.card:not(.dragging), .template-item:not(.dragging)')
  ];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
