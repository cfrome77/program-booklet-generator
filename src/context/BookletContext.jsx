import React, { createContext, useContext, useReducer, useEffect, useState, useRef } from 'react';
import { bookletReducer, INITIAL_STATE } from './bookletReducer.js';
import { saveAutosaveSession, getAutosaveSession, clearAutosaveSession } from '../utils/storage.js';
import { resolveAssetUrl as resolveUrl } from '../utils/assets.js';

const BookletContext = createContext(null);

export { bookletReducer, INITIAL_STATE };

export function BookletProvider({ children, initialBookletState }) {
  const [state, dispatch] = useReducer(
    bookletReducer,
    initialBookletState || INITIAL_STATE
  );

  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [recoverableSession, setRecoverableSession] = useState(null);
  const [isRecoveryPromptOpen, setIsRecoveryPromptOpen] = useState(false);
  const isInitializedRef = useRef(false);
  const lastStateStringRef = useRef(JSON.stringify({ booklet: state.booklet, activePresetKey: state.activePresetKey }));

  const canUndo = (state.history?.past?.length || 0) > 0;
  const canRedo = (state.history?.future?.length || 0) > 0;

  const undo = () => dispatch({ type: 'UNDO' });
  const redo = () => dispatch({ type: 'REDO' });

  // Check for recoverable session on mount
  useEffect(() => {
    let isMounted = true;
    async function checkForRecoverableSession() {
      try {
        const saved = await getAutosaveSession();
        if (isMounted && saved && saved.booklet && Array.isArray(saved.booklet.pages)) {
          setRecoverableSession(saved);
          setIsRecoveryPromptOpen(true);
        }
      } catch (err) {
        console.warn('Failed to check recoverable session:', err);
      } finally {
        if (isMounted) {
          isInitializedRef.current = true;
        }
      }
    }
    checkForRecoverableSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced Autosave effect
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const currentStateString = JSON.stringify({ booklet: state.booklet, activePresetKey: state.activePresetKey });
    if (currentStateString === lastStateStringRef.current) {
      return;
    }

    setSaveStatus('unsaved');

    const timer = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        const now = Date.now();
        await saveAutosaveSession({
          booklet: state.booklet,
          activePresetKey: state.activePresetKey,
          timestamp: now
        });
        lastStateStringRef.current = currentStateString;
        setLastSavedAt(now);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveStatus('error');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [state.booklet, state.activePresetKey]);

  const handleRestoreSession = () => {
    if (recoverableSession) {
      dispatch({
        type: 'RESTORE_SESSION',
        booklet: recoverableSession.booklet,
        activePresetKey: recoverableSession.activePresetKey
      });
      setLastSavedAt(recoverableSession.timestamp);
      setSaveStatus('saved');
      lastStateStringRef.current = JSON.stringify({
        booklet: recoverableSession.booklet,
        activePresetKey: recoverableSession.activePresetKey
      });
    }
    setRecoverableSession(null);
    setIsRecoveryPromptOpen(false);
  };

  const handleDiscardSession = async () => {
    await clearAutosaveSession();
    setRecoverableSession(null);
    setIsRecoveryPromptOpen(false);
    // Force initial current state as baseline
    lastStateStringRef.current = JSON.stringify({ booklet: state.booklet, activePresetKey: state.activePresetKey });
  };

  // Global Keyboard Shortcuts (Undo, Redo, Save, Print, Duplicate, Delete, Deselect, Move)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.isContentEditable
      );

      const hasCmdOrCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Shortcuts with Ctrl/Cmd
      if (hasCmdOrCtrl && !e.altKey) {
        if (key === 'z') {
          if (e.shiftKey) {
            e.preventDefault();
            dispatch({ type: 'REDO' });
          } else {
            e.preventDefault();
            dispatch({ type: 'UNDO' });
          }
          return;
        } else if (key === 'y') {
          e.preventDefault();
          dispatch({ type: 'REDO' });
          return;
        } else if (key === 's') {
          e.preventDefault();
          // Force immediate autosave trigger
          saveAutosaveSession({
            booklet: state.booklet,
            activePresetKey: state.activePresetKey,
            timestamp: Date.now()
          }).then(() => {
            setLastSavedAt(Date.now());
            setSaveStatus('saved');
          }).catch((err) => {
            console.error('Manual save failed:', err);
            setSaveStatus('error');
          });
          return;
        } else if (key === 'p') {
          e.preventDefault();
          // Dispatch custom event to trigger preflight/print setup modal in App
          window.dispatchEvent(new CustomEvent('open-preflight-modal'));
          return;
        } else if (key === 'd') {
          e.preventDefault();
          if (state.selectedElement) {
            const { pageIndex, blockIndex, elementType } = state.selectedElement;
            if (elementType === 'block' && pageIndex !== undefined && blockIndex !== undefined) {
              dispatch({ type: 'DUPLICATE_CONTENT_BLOCK', pageIndex, blockIndex });
            } else if ((elementType === 'page' || elementType === undefined) && pageIndex !== undefined) {
              dispatch({ type: 'DUPLICATE_PAGE', pageIndex });
            }
          }
          return;
        }
      }

      // Keyboard shortcuts when NOT typing in an input
      if (!isInputFocused) {
        if (e.key === 'Escape') {
          e.preventDefault();
          dispatch({ type: 'SET_SELECTED_ELEMENT', selectedElement: null });
          return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (state.selectedElement) {
            const { pageIndex, blockIndex, elementType } = state.selectedElement;
            if (elementType === 'block' && pageIndex !== undefined && blockIndex !== undefined) {
              e.preventDefault();
              dispatch({ type: 'DELETE_CONTENT_BLOCK', pageIndex, blockIndex });
            } else if (elementType === 'page' && pageIndex !== undefined) {
              e.preventDefault();
              dispatch({ type: 'DELETE_PAGE', pageIndex });
              dispatch({ type: 'SET_SELECTED_ELEMENT', selectedElement: null });
            }
          }
          return;
        }

        // Nudge with Arrow Keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          if (state.selectedElement) {
            const { pageIndex, blockIndex, elementType } = state.selectedElement;
            if (pageIndex !== undefined) {
              e.preventDefault();
              const step = e.shiftKey ? 10 : 1;
              let dx = 0;
              let dy = 0;

              if (e.key === 'ArrowLeft') dx = -step;
              if (e.key === 'ArrowRight') dx = step;
              if (e.key === 'ArrowUp') dy = -step;
              if (e.key === 'ArrowDown') dy = step;

              if (elementType === 'block' && blockIndex !== undefined) {
                const currentBlock = state.booklet.pages?.[pageIndex]?.blocks?.[blockIndex];
                if (currentBlock) {
                  const newX = (currentBlock.offsetX || 0) + dx;
                  const newY = (currentBlock.offsetY || 0) + dy;
                  dispatch({
                    type: 'UPDATE_CONTENT_BLOCK',
                    pageIndex,
                    blockIndex,
                    field: 'offsetX',
                    value: newX,
                    isContinuous: true
                  });
                  dispatch({
                    type: 'UPDATE_CONTENT_BLOCK',
                    pageIndex,
                    blockIndex,
                    field: 'offsetY',
                    value: newY,
                    isContinuous: true
                  });
                }
              } else if (elementType && elementType !== 'page') {
                const prefix = elementType;
                const currX = state.booklet.pages?.[pageIndex]?.[`${prefix}OffsetX`] || 0;
                const currY = state.booklet.pages?.[pageIndex]?.[`${prefix}OffsetY`] || 0;
                dispatch({
                  type: 'UPDATE_PAGE_FIELD',
                  pageIndex,
                  field: `${prefix}OffsetX`,
                  value: currX + dx,
                  isContinuous: true
                });
                dispatch({
                  type: 'UPDATE_PAGE_FIELD',
                  pageIndex,
                  field: `${prefix}OffsetY`,
                  value: currY + dy,
                  isContinuous: true
                });
              }
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedElement, state.booklet, state.activePresetKey]);

  const value = {
    state,
    dispatch,
    activePresetKey: state.activePresetKey,
    booklet: state.booklet,
    assets: state.booklet.assets || [],
    theme: state.booklet.theme || {},
    pages: state.booklet.pages || [],
    jsonState: state.jsonState,
    selectedElement: state.selectedElement,
    zoomLevel: state.zoomLevel || '100%',
    guides: state.guides || {
      showRulers: true,
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

    // Autosave & Session
    saveStatus,
    lastSavedAt,
    recoverableSession,
    isRecoveryPromptOpen,
    restoreSession: handleRestoreSession,
    discardSession: handleDiscardSession,

    // Asset Helpers
    addAsset: (asset) => dispatch({ type: 'ADD_ASSET', asset }),
    removeAsset: (assetId) => dispatch({ type: 'REMOVE_ASSET', assetId }),
    purgeUnusedAssets: () => dispatch({ type: 'PURGE_UNUSED_ASSETS' }),
    resolveAssetUrl: (ref) => resolveUrl(state.booklet, ref),

    // Zoom & Action Helpers
    setZoomLevel: (zoom) => dispatch({ type: 'SET_ZOOM_LEVEL', zoomLevel: zoom }),
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
    duplicateContentBlock: (pageIndex, blockIndex) => dispatch({ type: 'DUPLICATE_CONTENT_BLOCK', pageIndex, blockIndex }),
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
      const currentBooklet = state.booklet || {};
      const exportData = {
        schemaVersion: currentBooklet.schemaVersion || '1.0.0',
        generatorVersion: currentBooklet.generatorVersion || '0.1.0',
        createdAt: currentBooklet.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...currentBooklet,
        updatedAt: new Date().toISOString()
      };
      return JSON.stringify(exportData, null, 2);
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
