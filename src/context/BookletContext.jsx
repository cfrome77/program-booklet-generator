import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { bookletReducer, INITIAL_STATE } from './bookletReducer.js';

const BookletContext = createContext(null);

export { bookletReducer, INITIAL_STATE };

export function BookletProvider({ children, initialBookletState }) {
  const [state, dispatch] = useReducer(
    bookletReducer,
    initialBookletState || INITIAL_STATE
  );

  const canUndo = (state.history?.past?.length || 0) > 0;
  const canRedo = (state.history?.future?.length || 0) > 0;

  const undo = () => dispatch({ type: 'UNDO' });
  const redo = () => dispatch({ type: 'REDO' });

  // Global Keyboard Shortcuts for Document History (Ctrl/Cmd + Z, Ctrl/Cmd + Shift + Z, Ctrl/Cmd + Y)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'z') {
          if (e.shiftKey) {
            e.preventDefault();
            dispatch({ type: 'REDO' });
          } else {
            e.preventDefault();
            dispatch({ type: 'UNDO' });
          }
        } else if (key === 'y') {
          e.preventDefault();
          dispatch({ type: 'REDO' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const value = {
    state,
    dispatch,
    activePresetKey: state.activePresetKey,
    booklet: state.booklet,
    theme: state.booklet.theme || {},
    pages: state.booklet.pages || [],
    jsonState: state.jsonState,
    selectedElement: state.selectedElement,
    guides: state.guides || {
      showPageBoundary: true,
      showSafeArea: true,
      showCenterFold: true,
      showBleed: false,
      showGrid: false
    },

    // History
    canUndo,
    canRedo,
    undo,
    redo,

    // Action Helpers
    toggleGuide: (guideKey) => dispatch({ type: 'TOGGLE_GUIDE', guideKey }),
    setGuide: (guideKey, value) => dispatch({ type: 'SET_GUIDE', guideKey, value }),
    loadPreset: (presetKey) => dispatch({ type: 'LOAD_PRESET', presetKey }),
    updateGlobalField: (field, value, isContinuous = false) => dispatch({ type: 'UPDATE_GLOBAL_FIELD', field, value, isContinuous }),
    updateThemeField: (field, value, isContinuous = false) => dispatch({ type: 'UPDATE_THEME_FIELD', field, value, isContinuous }),
    addPage: (pageObj) => dispatch({ type: 'ADD_PAGE', pageObj }),
    duplicatePage: (pageIndex) => dispatch({ type: 'DUPLICATE_PAGE', pageIndex }),
    updatePageField: (pageIndex, field, value, isContinuous = false) => dispatch({ type: 'UPDATE_PAGE_FIELD', pageIndex, field, value, isContinuous }),
    changePageType: (pageIndex, newType) => dispatch({ type: 'CHANGE_PAGE_TYPE', pageIndex, newType }),
    movePage: (pageIndex, delta) => dispatch({ type: 'MOVE_PAGE', pageIndex, delta }),
    deletePage: (pageIndex) => dispatch({ type: 'DELETE_PAGE', pageIndex }),
    addContentBlock: (pageIndex, blockType) => dispatch({ type: 'ADD_CONTENT_BLOCK', pageIndex, blockType }),
    updateContentBlock: (pageIndex, blockIndex, field, value, isContinuous = false) => dispatch({ type: 'UPDATE_CONTENT_BLOCK', pageIndex, blockIndex, field, value, isContinuous }),
    moveContentBlock: (pageIndex, blockIndex, delta) => dispatch({ type: 'MOVE_CONTENT_BLOCK', pageIndex, blockIndex, delta }),
    deleteContentBlock: (pageIndex, blockIndex) => dispatch({ type: 'DELETE_CONTENT_BLOCK', pageIndex, blockIndex }),
    reorderContentBlockLayer: (pageIndex, blockIndex, direction) => dispatch({ type: 'REORDER_CONTENT_BLOCK_LAYER', pageIndex, blockIndex, direction }),
    updateElementTransform: (pageIndex, elementType, blockIndex, transforms, isContinuous = false) => dispatch({ type: 'UPDATE_ELEMENT_TRANSFORM', pageIndex, elementType, blockIndex, transforms, isContinuous }),
    setSelectedElement: (selectedElement) => dispatch({ type: 'SET_SELECTED_ELEMENT', selectedElement }),

    // JSON Import/Export
    importJSON: (input) => {
      try {
        const data = typeof input === 'string' ? JSON.parse(input) : input;
        dispatch({ type: 'IMPORT_JSON', data });
        return true;
      } catch (err) {
        dispatch({
          type: 'IMPORT_JSON',
          data: null
        });
        return false;
      }
    },
    exportJSONData: () => {
      dispatch({ type: 'MARK_EXPORTED' });
      return JSON.stringify(state.booklet, null, 2);
    },
    clearImportError: () => dispatch({ type: 'CLEAR_IMPORT_ERROR' })
  };

  return (
    <BookletContext.Provider value={value}>
      {children}
    </BookletContext.Provider>
  );
}

export function useBooklet() {
  const context = useContext(BookletContext);
  if (!context) {
    throw new Error('useBooklet must be used within a BookletProvider');
  }
  return context;
}

export default BookletContext;
