// localStorage helpers for Dilly

const STORAGE_KEY = 'dilly-data';

// Default seeded categories
const DEFAULT_CATEGORIES = [
  { name: 'Fitness', emoji: '💪' },
  { name: 'Health', emoji: '🍎' },
  { name: 'Work', emoji: '💻' },
  { name: 'Chore', emoji: '🧹' },
  { name: 'Social', emoji: '👥' }
];

// Get default data structure
function getDefaultData() {
  return {
    template: [],
    categories: [...DEFAULT_CATEGORIES],
    currentDay: {
      dateString: getTodayString(),
      pending: [],
      done: {},
      oneOffItems: []
    },
    settings: {
      theme: 'hacker'
    }
  };
}

// Load data from localStorage
function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Ensure all required fields exist (migration safety)
      const defaultData = getDefaultData();

      // Migrate removed themes to 'hacker'
      const validThemes = ['hacker', 'plain'];
      const currentTheme = data.settings?.theme || 'hacker';
      if (!validThemes.includes(currentTheme)) {
        data.settings = data.settings || {};
        data.settings.theme = 'hacker';
      }

      return {
        ...defaultData,
        ...data,
        currentDay: {
          ...defaultData.currentDay,
          ...data.currentDay,
          oneOffItems: data.currentDay?.oneOffItems || []
        }
      };
    }
  } catch (e) {
    console.error('Error loading data from localStorage:', e);
  }
  return getDefaultData();
}

// Save data to localStorage
function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Error saving data to localStorage:', e);
    return false;
  }
}

// Get category by name
function getCategoryByName(data, categoryName) {
  return data.categories.find(cat => cat.name === categoryName);
}

// Get template item by ID (also checks one-off items)
function getTemplateItemById(data, itemId) {
  // Check template first
  let item = data.template.find(item => item.id === itemId);
  // If not found, check one-off items
  if (!item && data.currentDay.oneOffItems) {
    item = data.currentDay.oneOffItems.find(item => item.id === itemId);
  }
  return item;
}

// Check if item is done
function isItemDone(data, itemId) {
  return itemId in data.currentDay.done;
}
