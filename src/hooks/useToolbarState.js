import { useState, useRef, useCallback, useMemo } from 'react';

const ALL_TOOL_IDS = ['text', 'stickers', 'gallery', 'doodle', 'eraser', 'download'];

export function useToolbarState() {
  const [toolsCollapsed, setToolsCollapsed] = useState(false);
  const toolsCollapsedRef = useRef(false);
  const toolsCollapseTimerRef = useRef(null);

  const [labelsExpanded, setLabelsExpanded] = useState(false);
  const labelPressTimerRef = useRef(null);
  const labelCollapseTimerRef = useRef(null);

  const [recentTools, setRecentTools] = useState(['text', 'doodle', 'eraser']);
  const orderedToolIds = useMemo(() => {
    const recentSet = new Set(recentTools);
    const rest = ALL_TOOL_IDS.filter(id => !recentSet.has(id));
    return [...recentTools, ...rest];
  }, [recentTools]);

  const addRecentTool = useCallback((toolId) => {
    setRecentTools(prev => {
      const filtered = prev.filter(id => id !== toolId);
      return [toolId, ...filtered].slice(0, 3);
    });
  }, []);

  const handleToggleTools = useCallback((e) => {
    e.stopPropagation();
    if (toolsCollapsedRef.current) {
      setToolsCollapsed(false);
      toolsCollapsedRef.current = false;
      clearTimeout(toolsCollapseTimerRef.current);
      toolsCollapseTimerRef.current = setTimeout(() => {
        setToolsCollapsed(true);
        toolsCollapsedRef.current = true;
      }, 4000);
    } else {
      clearTimeout(toolsCollapseTimerRef.current);
      setToolsCollapsed(true);
      toolsCollapsedRef.current = true;
    }
  }, []);

  const handleToolMouseEnter = useCallback(() => {
    clearTimeout(labelPressTimerRef.current);
    labelPressTimerRef.current = setTimeout(() => setLabelsExpanded(true), 800);
  }, []);

  const handleToolMouseLeave = useCallback(() => {
    clearTimeout(labelPressTimerRef.current);
    clearTimeout(labelCollapseTimerRef.current);
    labelCollapseTimerRef.current = setTimeout(() => setLabelsExpanded(false), 500);
  }, []);

  return {
    toolsCollapsed, setToolsCollapsed,
    toolsCollapsedRef, toolsCollapseTimerRef,
    labelsExpanded,
    orderedToolIds, addRecentTool,
    handleToggleTools, handleToolMouseEnter, handleToolMouseLeave,
  };
}
