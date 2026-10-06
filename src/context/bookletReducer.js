import { PRESETS } from '../presets/index.js';
import { validateProject } from '../utils/schemaValidator.js';
import { migrateProject } from '../utils/migrations.js';

const MAX_HISTORY = 50;

export const INITIAL_STATE = {
  activePresetKey: 'blank',
  booklet: JSON.parse(JSON.stringify(PRESETS.blank || {})),
  jsonState: {
    importError: null,
    lastImportedAt: null,
    lastExportedAt: null,
  },
  selectedElement: null, // { pageIndex, blockIndex, elementType: 'block' | 'emblem' }
  guides: {
    showPageBoundary: true,
    showSafeArea: true,
    showCenterFold: true,
    showBleed: false,
    showGrid: false
  },
  history: {
    past: [],
    future: [],
    lastMutationTime: 0
  }
};

function baseReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_GUIDE': {
      const guideKey = action.guideKey;
      if (!guideKey || !(guideKey in (state.guides || {}))) return state;
      return {
        ...state,
        guides: {
          ...state.guides,
          [guideKey]: !state.guides[guideKey]
        }
      };
    }

    case 'SET_GUIDE': {
      const { guideKey, value } = action;
      if (!guideKey) return state;
      return {
        ...state,
        guides: {
          ...state.guides,
          [guideKey]: Boolean(value)
        }
      };
    }

    case 'LOAD_PRESET': {
      const presetKey = action.presetKey;
      const targetPreset = PRESETS[presetKey];
      if (!targetPreset) return state;

      return {
        ...state,
        activePresetKey: presetKey,
        booklet: JSON.parse(JSON.stringify(targetPreset)),
        jsonState: {
          ...state.jsonState,
          importError: null,
        }
      };
    }

    case 'UPDATE_GLOBAL_FIELD': {
      return {
        ...state,
        booklet: {
          ...state.booklet,
          [action.field]: action.value
        }
      };
    }

    case 'UPDATE_THEME_FIELD': {
      return {
        ...state,
        booklet: {
          ...state.booklet,
          theme: {
            ...state.booklet.theme,
            [action.field]: action.value
          }
        }
      };
    }

    case 'ADD_PAGE': {
      const newPages = [...(state.booklet.pages || [])];
      const pageIndex = newPages.length + 1;
      const newPage = action.pageObj || {
        id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: 'custom',
        title: `New Page ${pageIndex}`,
        content: 'Enter page content here...',
        blocks: []
      };
      newPages.push(newPage);

      return {
        ...state,
        booklet: {
          ...state.booklet,
          pages: newPages
        }
      };
    }

    case 'DUPLICATE_PAGE': {
      const { pageIndex } = action;
      const pages = [...(state.booklet.pages || [])];
      if (pageIndex < 0 || pageIndex >= pages.length) return state;

      const sourcePage = pages[pageIndex];
      const duplicatedPage = JSON.parse(JSON.stringify(sourcePage));
      duplicatedPage.id = `page-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      duplicatedPage.title = sourcePage.title ? `${sourcePage.title} (Copy)` : 'Page Copy';
      if (Array.isArray(duplicatedPage.blocks)) {
        duplicatedPage.blocks = duplicatedPage.blocks.map((b) => ({
          ...b,
          id: `b-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        }));
      }

      pages.splice(pageIndex + 1, 0, duplicatedPage);

      return {
        ...state,
        booklet: {
          ...state.booklet,
          pages
        }
      };
    }

    case 'UPDATE_PAGE_FIELD': {
      const { pageIndex, field, value } = action;
      const pages = [...(state.booklet.pages || [])];
      if (!pages[pageIndex]) return state;

      pages[pageIndex] = {
        ...pages[pageIndex],
        [field]: value
      };

      return {
        ...state,
        booklet: {
          ...state.booklet,
          pages
        }
      };
    }

    case 'CHANGE_PAGE_TYPE': {
      const { pageIndex, newType } = action;
      const pages = [...(state.booklet.pages || [])];
      if (!pages[pageIndex]) return state;

      const title = pages[pageIndex].title || (newType.charAt(0).toUpperCase() + newType.slice(1));
      pages[pageIndex] = {
        ...pages[pageIndex],
        type: newType,
        title
      };

      return {
        ...state,
        booklet: {
          ...state.booklet,
          pages
        }
      };
    }

    case 'MOVE_PAGE': {
      const { pageIndex, delta } = action;
      const pages = [...(state.booklet.pages || [])];
      const targetIndex = pageIndex + delta;

      if (pageIndex < 0 || pageIndex >= pages.length || targetIndex < 0 || targetIndex >= pages.length) {
        return state;
      }

      const temp = pages[pageIndex];
      pages[pageIndex] = pages[targetIndex];
      pages[targetIndex] = temp;

      return {
        ...state,
        booklet: {
          ...state.booklet,
          pages
        }
      };
    }

    case 'DELETE_PAGE': {
      const { pageIndex } = action;
      const pages = [...(state.booklet.pages || [])];
      if (pageIndex < 0 || pageIndex >= pages.length) return state;

      pages.splice(pageIndex, 1);

      return {
        ...state,
        booklet: {
          ...state.booklet,
          pages
        }
      };
    }

    case 'ADD_CONTENT_BLOCK': {
      const { pageIndex, blockType } = action;
      const pages = [...(state.booklet.pages || [])];
      if (!pages[pageIndex]) return state;

      const page = { ...pages[pageIndex] };
      const blocks = [...(page.blocks || [])];

      const newBlock = {
        id: `b-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: blockType,
        text: blockType === 'heading' ? 'New Subheading' : blockType === 'paragraph' ? 'New paragraph text block...' : '',
        url: ''
      };

      blocks.push(newBlock);
      page.blocks = blocks;
      pages[pageIndex] = page;

      return {
        ...state,
        booklet: {
          ...state.booklet,
          pages
        }
      };
    }

    case 'UPDATE_CONTENT_BLOCK': {
      const { pageIndex, blockIndex, field, value } = action;
      const pages = [...(state.booklet.pages || [])];
      if (!pages[pageIndex]) return state;

      const page = { ...pages[pageIndex] };
      const blocks = [...(page.blocks || [])];
      if (!blocks[blockIndex]) return state;

      blocks[blockIndex] = {
        ...blocks[blockIndex],
        [field]: value
      };

      page.blocks = blocks;
      pages[pageIndex] = page;

      return {
        ...state,
        booklet: {
          ...state.booklet,
          pages
        }
      };
    }

    case 'MOVE_CONTENT_BLOCK': {
      const { pageIndex, blockIndex, delta } = action;
      const pages = [...(state.booklet.pages || [])];
      if (!pages[pageIndex]) return state;

      const page = { ...pages[pageIndex] };
      const blocks = [...(page.blocks || [])];
      const targetIndex = blockIndex + delta;

      if (blockIndex < 0 || blockIndex >= blocks.length || targetIndex < 0 || targetIndex >= blocks.length) {
        return state;
      }

      const temp = blocks[blockIndex];
      blocks[blockIndex] = blocks[targetIndex];
      blocks[targetIndex] = temp;

      page.blocks = blocks;
      pages[pageIndex] = page;

      return {
        ...state,
        booklet: {
          ...state.booklet,
          pages
        }
      };
    }

    case 'DELETE_CONTENT_BLOCK': {
      const { pageIndex, blockIndex } = action;
      const pages = [...(state.booklet.pages || [])];
      if (!pages[pageIndex]) return state;

      const page = { ...pages[pageIndex] };
      const blocks = [...(page.blocks || [])];
      if (blockIndex < 0 || blockIndex >= blocks.length) return state;

      blocks.splice(blockIndex, 1);
      page.blocks = blocks;
      pages[pageIndex] = page;

      return {
        ...state,
        booklet: {
          ...state.booklet,
          pages
        },
        selectedElement: state.selectedElement?.pageIndex === pageIndex &&
          state.selectedElement?.elementType === 'block' &&
          state.selectedElement?.blockIndex === blockIndex ? null : state.selectedElement
      };
    }

    case 'UPDATE_ELEMENT_TRANSFORM': {
      const { pageIndex, elementType, blockIndex, transforms } = action;
      const pages = [...(state.booklet.pages || [])];
      if (!pages[pageIndex]) return state;

      const page = { ...pages[pageIndex] };

      if (elementType === 'block' && blockIndex !== undefined && blockIndex !== null) {
        const blocks = [...(page.blocks || [])];
        if (blocks[blockIndex]) {
          blocks[blockIndex] = {
            ...blocks[blockIndex],
            ...transforms
          };
          page.blocks = blocks;
        }
      } else {
        const prefix = elementType;
        Object.entries(transforms).forEach(([key, val]) => {
          const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
          page[`${prefix}${capitalizedKey}`] = val;
        });
      }

      pages[pageIndex] = page;

      return {
        ...state,
        booklet: {
          ...state.booklet,
          pages
        }
      };
    }

    case 'REORDER_CONTENT_BLOCK_LAYER': {
      const { pageIndex, blockIndex, direction } = action;
      const pages = [...(state.booklet.pages || [])];
      if (!pages[pageIndex]) return state;

      const page = { ...pages[pageIndex] };
      const blocks = [...(page.blocks || [])];
      if (blockIndex < 0 || blockIndex >= blocks.length) return state;

      let newIndex = blockIndex;
      if (direction === 'front') {
        const [item] = blocks.splice(blockIndex, 1);
        blocks.push(item);
        newIndex = blocks.length - 1;
      } else if (direction === 'back') {
        const [item] = blocks.splice(blockIndex, 1);
        blocks.unshift(item);
        newIndex = 0;
      } else if (direction === 'forward' && blockIndex < blocks.length - 1) {
        const temp = blocks[blockIndex];
        blocks[blockIndex] = blocks[blockIndex + 1];
        blocks[blockIndex + 1] = temp;
        newIndex = blockIndex + 1;
      } else if (direction === 'backward' && blockIndex > 0) {
        const temp = blocks[blockIndex];
        blocks[blockIndex] = blocks[blockIndex - 1];
        blocks[blockIndex - 1] = temp;
        newIndex = blockIndex - 1;
      }

      blocks.forEach((b, idx) => {
        b.zIndex = (idx + 1) * 10;
      });

      page.blocks = blocks;
      pages[pageIndex] = page;

      return {
        ...state,
        booklet: {
          ...state.booklet,
          pages
        },
        selectedElement: state.selectedElement?.pageIndex === pageIndex && state.selectedElement?.elementType === 'block'
          ? { ...state.selectedElement, blockIndex: newIndex }
          : state.selectedElement
      };
    }

    case 'SET_SELECTED_ELEMENT': {
      return {
        ...state,
        selectedElement: action.selectedElement
      };
    }

    case 'IMPORT_JSON': {
      const rawData = action.data;
      if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
        return {
          ...state,
          jsonState: {
            ...state.jsonState,
            importError: 'Invalid JSON format: Content must be a valid JSON object.'
          }
        };
      }

      const migrated = migrateProject(rawData);
      const validation = validateProject(migrated);

      if (!validation.valid) {
        const errorDetails = validation.errors.map((e) => `[${e.path}]: ${e.message}`).join('; ');
        return {
          ...state,
          jsonState: {
            ...state.jsonState,
            importError: `Project validation failed: ${errorDetails}`
          }
        };
      }

      const now = new Date().toISOString();
      const updatedBooklet = {
        ...migrated,
        updatedAt: now
      };

      return {
        ...state,
        activePresetKey: 'custom',
        booklet: updatedBooklet,
        jsonState: {
          importError: null,
          lastImportedAt: now,
          lastExportedAt: state.jsonState.lastExportedAt
        }
      };
    }

    case 'MARK_EXPORTED': {
      return {
        ...state,
        jsonState: {
          ...state.jsonState,
          lastExportedAt: new Date().toISOString()
        }
      };
    }

    case 'CLEAR_IMPORT_ERROR': {
      return {
        ...state,
        jsonState: {
          ...state.jsonState,
          importError: null
        }
      };
    }

    case 'RESTORE_SESSION': {
      const { booklet, activePresetKey } = action;
      if (!booklet || typeof booklet !== 'object') return state;

      const migrated = migrateProject(booklet);

      return {
        ...state,
        activePresetKey: activePresetKey || 'custom',
        booklet: JSON.parse(JSON.stringify(migrated)),
        jsonState: {
          ...state.jsonState,
          importError: null,
        },
        history: {
          past: [],
          future: [],
          lastMutationTime: 0
        }
      };
    }

    default:
      return state;
  }
}

export function bookletReducer(state, action) {
  if (action.type === 'UNDO') {
    const past = state.history?.past || [];
    if (past.length === 0) return state;

    const previousDocument = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const currentDocument = {
      booklet: JSON.parse(JSON.stringify(state.booklet)),
      activePresetKey: state.activePresetKey
    };
    const future = state.history?.future || [];
    const newFuture = [currentDocument, ...future];

    let newSelectedElement = state.selectedElement;
    if (newSelectedElement && newSelectedElement.pageIndex !== undefined) {
      const restoredPages = previousDocument.booklet?.pages || [];
      const page = restoredPages[newSelectedElement.pageIndex];
      if (!page) {
        newSelectedElement = null;
      } else if (newSelectedElement.elementType === 'block' && newSelectedElement.blockIndex !== undefined) {
        if (!page.blocks || !page.blocks[newSelectedElement.blockIndex]) {
          newSelectedElement = null;
        }
      }
    }

    return {
      ...state,
      activePresetKey: previousDocument.activePresetKey,
      booklet: JSON.parse(JSON.stringify(previousDocument.booklet)),
      selectedElement: newSelectedElement,
      history: {
        past: newPast,
        future: newFuture,
        lastMutationTime: 0
      }
    };
  }

  if (action.type === 'REDO') {
    const future = state.history?.future || [];
    if (future.length === 0) return state;

    const nextDocument = future[0];
    const newFuture = future.slice(1);
    const currentDocument = {
      booklet: JSON.parse(JSON.stringify(state.booklet)),
      activePresetKey: state.activePresetKey
    };
    const past = state.history?.past || [];
    const newPast = [...past, currentDocument];

    let newSelectedElement = state.selectedElement;
    if (newSelectedElement && newSelectedElement.pageIndex !== undefined) {
      const restoredPages = nextDocument.booklet?.pages || [];
      const page = restoredPages[newSelectedElement.pageIndex];
      if (!page) {
        newSelectedElement = null;
      } else if (newSelectedElement.elementType === 'block' && newSelectedElement.blockIndex !== undefined) {
        if (!page.blocks || !page.blocks[newSelectedElement.blockIndex]) {
          newSelectedElement = null;
        }
      }
    }

    return {
      ...state,
      activePresetKey: nextDocument.activePresetKey,
      booklet: JSON.parse(JSON.stringify(nextDocument.booklet)),
      selectedElement: newSelectedElement,
      history: {
        past: newPast,
        future: newFuture,
        lastMutationTime: 0
      }
    };
  }

  const nextState = baseReducer(state, action);

  const isTransientAction = [
    'TOGGLE_GUIDE',
    'SET_GUIDE',
    'SET_SELECTED_ELEMENT',
    'MARK_EXPORTED',
    'CLEAR_IMPORT_ERROR',
    'RESTORE_SESSION'
  ].includes(action.type);

  if (isTransientAction) {
    return nextState;
  }

  const docChanged = nextState.booklet !== state.booklet || nextState.activePresetKey !== state.activePresetKey;

  if (!docChanged) {
    return nextState;
  }

  if (nextState.booklet !== state.booklet && nextState.booklet) {
    nextState.booklet = {
      ...nextState.booklet,
      updatedAt: new Date().toISOString()
    };
  }

  const prevDoc = {
    booklet: JSON.parse(JSON.stringify(state.booklet)),
    activePresetKey: state.activePresetKey
  };

  const now = Date.now();
  const isContinuous = action.isContinuous || action.meta?.continuous;

  const isCoalescableAction = [
    'UPDATE_GLOBAL_FIELD',
    'UPDATE_THEME_FIELD',
    'UPDATE_PAGE_FIELD',
    'UPDATE_CONTENT_BLOCK',
    'UPDATE_ELEMENT_TRANSFORM'
  ].includes(action.type);

  const shouldCoalesce = isCoalescableAction && Boolean(isContinuous);

  const past = state.history?.past || [];

  let newPast;
  if (shouldCoalesce && past.length > 0) {
    newPast = past;
  } else {
    newPast = [...past, prevDoc];
    if (newPast.length > MAX_HISTORY) {
      newPast = newPast.slice(newPast.length - MAX_HISTORY);
    }
  }

  return {
    ...nextState,
    history: {
      past: newPast,
      future: [],
      lastMutationTime: now
    }
  };
}
