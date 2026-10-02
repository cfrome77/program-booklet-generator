import React, { createContext, useContext, useReducer } from 'react';
import { bookletReducer, INITIAL_STATE } from './bookletReducer.js';

const BookletContext = createContext(null);

export { bookletReducer, INITIAL_STATE };

export function BookletProvider({ children, initialBookletState }) {
  const [state, dispatch] = useReducer(
    bookletReducer,
    initialBookletState || INITIAL_STATE
  );

  const value = {
    state,
    dispatch,
    activePresetKey: state.activePresetKey,
    booklet: state.booklet,
    theme: state.booklet.theme || {},
    pages: state.booklet.pages || [],
    jsonState: state.jsonState,

    // Action Helpers
    loadPreset: (presetKey) => dispatch({ type: 'LOAD_PRESET', presetKey }),
    updateGlobalField: (field, value) => dispatch({ type: 'UPDATE_GLOBAL_FIELD', field, value }),
    updateThemeField: (field, value) => dispatch({ type: 'UPDATE_THEME_FIELD', field, value }),
    addPage: (pageObj) => dispatch({ type: 'ADD_PAGE', pageObj }),
    updatePageField: (pageIndex, field, value) => dispatch({ type: 'UPDATE_PAGE_FIELD', pageIndex, field, value }),
    changePageType: (pageIndex, newType) => dispatch({ type: 'CHANGE_PAGE_TYPE', pageIndex, newType }),
    movePage: (pageIndex, delta) => dispatch({ type: 'MOVE_PAGE', pageIndex, delta }),
    deletePage: (pageIndex) => dispatch({ type: 'DELETE_PAGE', pageIndex }),
    addContentBlock: (pageIndex, blockType) => dispatch({ type: 'ADD_CONTENT_BLOCK', pageIndex, blockType }),
    updateContentBlock: (pageIndex, blockIndex, field, value) => dispatch({ type: 'UPDATE_CONTENT_BLOCK', pageIndex, blockIndex, field, value }),
    moveContentBlock: (pageIndex, blockIndex, delta) => dispatch({ type: 'MOVE_CONTENT_BLOCK', pageIndex, blockIndex, delta }),
    deleteContentBlock: (pageIndex, blockIndex) => dispatch({ type: 'DELETE_CONTENT_BLOCK', pageIndex, blockIndex }),

    // JSON Import/Export
    importJSON: (input) => {
      try {
        const data = typeof input === 'string' ? JSON.parse(input) : input;
        dispatch({ type: 'IMPORT_JSON', data });
        return true;
      } catch (err) {
        dispatch({
          type: 'IMPORT_JSON',
          data: null // Triggers error state in reducer
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
