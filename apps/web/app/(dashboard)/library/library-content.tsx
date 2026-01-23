"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Star,
  Settings2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  BarChart3,
  X,
  RotateCcw,
  GripVertical,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Column definitions with metadata
const ALL_COLUMNS = {
  // Basic
  title: { label: "Title", group: "Basic", defaultVisible: true },
  video_url: { label: "Video", group: "Basic", defaultVisible: false },
  video_duration: { label: "Duration", group: "Basic", defaultVisible: false },
  created_at: { label: "Created", group: "Basic", defaultVisible: true },
  // Overall scores
  deterministic_score: { label: "Score", group: "Scores", defaultVisible: true },
  hook_strength: { label: "Hook", group: "Scores", defaultVisible: true },
  structure_pacing: { label: "Structure", group: "Scores", defaultVisible: false },
  value_clarity: { label: "Clarity", group: "Scores", defaultVisible: false },
  delivery_performance: { label: "Delivery", group: "Scores", defaultVisible: false },
  // Metadata
  niche_category: { label: "Niche", group: "Metadata", defaultVisible: true },
  content_type: { label: "Content Type", group: "Metadata", defaultVisible: false },
  hook_category: { label: "Hook Type", group: "Metadata", defaultVisible: true },
  hook_pattern: { label: "Hook Pattern", group: "Metadata", defaultVisible: false },
  video_format: { label: "Format", group: "Metadata", defaultVisible: false },
  target_audience: { label: "Audience", group: "Metadata", defaultVisible: false },
  // Hook submetrics
  hook_tt_claim: { label: "Time to Claim", group: "Hook Details", defaultVisible: false },
  hook_pb: { label: "Pattern Break", group: "Hook Details", defaultVisible: false },
  hook_spec: { label: "Specificity", group: "Hook Details", defaultVisible: false },
  hook_qc: { label: "Questions", group: "Hook Details", defaultVisible: false },
  // Structure submetrics
  structure_bc: { label: "Beat Count", group: "Structure Details", defaultVisible: false },
  structure_pm: { label: "Progress Markers", group: "Structure Details", defaultVisible: false },
  structure_pp: { label: "Has Payoff", group: "Structure Details", defaultVisible: false },
  structure_lc: { label: "Loop Cue", group: "Structure Details", defaultVisible: false },
  // Clarity submetrics
  clarity_word_count: { label: "Word Count", group: "Clarity Details", defaultVisible: false },
  clarity_score_wps: { label: "WPS Score", group: "Clarity Details", defaultVisible: false },
  clarity_sc: { label: "Complexity", group: "Clarity Details", defaultVisible: false },
  clarity_tj: { label: "Topic Jumps", group: "Clarity Details", defaultVisible: false },
  clarity_rd: { label: "Redundancy", group: "Clarity Details", defaultVisible: false },
  // Delivery submetrics
  delivery_filler_count: { label: "Filler Words", group: "Delivery Details", defaultVisible: false },
  delivery_pause_count: { label: "Pause Count", group: "Delivery Details", defaultVisible: false },
  delivery_ls: { label: "Volume", group: "Delivery Details", defaultVisible: false },
  delivery_ns: { label: "Audio Quality", group: "Delivery Details", defaultVisible: false },
  delivery_ec: { label: "Energy Curve", group: "Delivery Details", defaultVisible: false },
} as const;

type ColumnKey = keyof typeof ALL_COLUMNS;

const COLUMN_GROUPS = ["Basic", "Scores", "Metadata", "Hook Details", "Structure Details", "Clarity Details", "Delivery Details"];

const STORAGE_KEY = "library-column-preferences";

interface ColumnPreferences {
  visibleColumns: ColumnKey[];
  columnOrder: ColumnKey[];
}

function getDefaultVisibleColumns(): ColumnKey[] {
  return Object.entries(ALL_COLUMNS)
    .filter(([_, meta]) => meta.defaultVisible)
    .map(([key]) => key as ColumnKey);
}

function getDefaultColumnOrder(): ColumnKey[] {
  return Object.keys(ALL_COLUMNS) as ColumnKey[];
}

function loadColumnPreferences(): ColumnPreferences {
  const defaults = {
    visibleColumns: getDefaultVisibleColumns(),
    columnOrder: getDefaultColumnOrder(),
  };

  if (typeof window === "undefined") return defaults;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);

      // Handle legacy format (just an array of visible columns)
      if (Array.isArray(parsed)) {
        return {
          visibleColumns: parsed.filter((col: string) => col in ALL_COLUMNS),
          columnOrder: getDefaultColumnOrder(),
        };
      }

      // New format with order
      const visibleColumns = (parsed.visibleColumns || []).filter((col: string) => col in ALL_COLUMNS);
      const columnOrder = (parsed.columnOrder || []).filter((col: string) => col in ALL_COLUMNS);

      // Add any new columns that aren't in the stored order
      const allKeys = Object.keys(ALL_COLUMNS) as ColumnKey[];
      const missingColumns = allKeys.filter(col => !columnOrder.includes(col));

      return {
        visibleColumns: visibleColumns.length > 0 ? visibleColumns : defaults.visibleColumns,
        columnOrder: [...columnOrder, ...missingColumns],
      };
    }
  } catch {
    // Ignore parse errors
  }
  return defaults;
}

function saveColumnPreferences(prefs: ColumnPreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

interface LibraryItem {
  id: string;
  title: string | null;
  video_url: string | null;
  video_duration: number | null;
  created_at: string;
  starred: boolean;
  deterministic_score: number | null;
  hook_strength: number | null;
  structure_pacing: number | null;
  value_clarity: number | null;
  delivery_performance: number | null;
  niche_category: string | null;
  content_type: string | null;
  hook_category: string | null;
  hook_pattern: string | null;
  video_format: string | null;
  target_audience: string | null;
  hook_tt_claim: number | null;
  hook_pb: number | null;
  hook_spec: number | null;
  hook_qc: number | null;
  structure_bc: number | null;
  structure_pm: number | null;
  structure_pp: boolean | null;
  structure_lc: boolean | null;
  clarity_word_count: number | null;
  clarity_score_wps: number | null;
  clarity_sc: number | null;
  clarity_tj: number | null;
  clarity_rd: number | null;
  delivery_filler_count: number | null;
  delivery_pause_count: number | null;
  delivery_ls: number | null;
  delivery_ns: number | null;
  delivery_ec: boolean | null;
}

interface FilterCount {
  value: string;
  count: number;
}

interface FilterOptions {
  niches: FilterCount[];
  hookTypes: FilterCount[];
  contentTypes: FilterCount[];
  formats: FilterCount[];
  counts: { total: number; starred: number };
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Show relative time for recent, then date + time
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  // Show date with time for older items
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatBoolean(value: boolean | null): string {
  if (value === null) return "—";
  return value ? "Yes" : "No";
}

function getScoreColor(score: number | null): string {
  if (score === null) return "text-gray-500";
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
}

export default function LibraryContent() {
  const router = useRouter();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [starredOnly, setStarredOnly] = useState(false);
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [datePreset, setDatePreset] = useState<"all" | "7" | "30" | "90" | "custom">("all");
  const [customDateRange, setCustomDateRange] = useState<[string, string]>(["", ""]);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedHookTypes, setSelectedHookTypes] = useState<string[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);

  // Sorting
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Column visibility and order
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(getDefaultVisibleColumns);
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(getDefaultColumnOrder);
  const [columnPopoverOpen, setColumnPopoverOpen] = useState(false);

  // Drag and drop state
  const [draggedColumn, setDraggedColumn] = useState<ColumnKey | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnKey | null>(null);

  // Load column preferences from localStorage
  useEffect(() => {
    const prefs = loadColumnPreferences();
    setVisibleColumns(prefs.visibleColumns);
    setColumnOrder(prefs.columnOrder);
  }, []);

  // Get ordered visible columns
  const orderedVisibleColumns = columnOrder.filter(col => visibleColumns.includes(col));

  // Fetch filter options
  useEffect(() => {
    fetch("/api/library/filters")
      .then((res) => res.json())
      .then((data) => setFilterOptions(data))
      .catch(console.error);
  }, []);

  // Fetch library items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();

    if (search) params.set("search", search);
    if (starredOnly) params.set("starred", "true");
    if (scoreRange[0] > 0) params.set("minScore", scoreRange[0].toString());
    if (scoreRange[1] < 100) params.set("maxScore", scoreRange[1].toString());

    // Date filter
    if (datePreset !== "all") {
      if (datePreset === "custom") {
        if (customDateRange[0]) params.set("dateFrom", customDateRange[0]);
        if (customDateRange[1]) params.set("dateTo", customDateRange[1]);
      } else {
        // Calculate date from preset (days ago)
        const days = parseInt(datePreset);
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        params.set("dateFrom", dateFrom.toISOString().split("T")[0]);
      }
    }

    if (selectedNiches.length > 0) params.set("niches", selectedNiches.join(","));
    if (selectedHookTypes.length > 0) params.set("hookTypes", selectedHookTypes.join(","));
    if (selectedContentTypes.length > 0) params.set("contentTypes", selectedContentTypes.join(","));
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);

    try {
      const res = await fetch(`/api/library?${params}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Failed to fetch library:", error);
    } finally {
      setLoading(false);
    }
  }, [search, starredOnly, scoreRange, datePreset, customDateRange, selectedNiches, selectedHookTypes, selectedContentTypes, sortBy, sortOrder]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Toggle star
  const toggleStar = async (id: string, currentStarred: boolean) => {
    try {
      await fetch(`/api/library/${id}/star`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: !currentStarred }),
      });
      // Update local state
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, starred: !currentStarred } : item
        )
      );
      // Refresh filter counts
      fetch("/api/library/filters")
        .then((res) => res.json())
        .then((data) => setFilterOptions(data))
        .catch(console.error);
    } catch (error) {
      console.error("Failed to toggle star:", error);
    }
  };

  // Toggle column visibility
  const toggleColumn = (column: ColumnKey) => {
    setVisibleColumns((prev) => {
      const newColumns = prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column];
      saveColumnPreferences({ visibleColumns: newColumns, columnOrder });
      return newColumns;
    });
  };

  // Reset columns to default
  const resetColumns = () => {
    const defaultVisible = getDefaultVisibleColumns();
    const defaultOrder = getDefaultColumnOrder();
    setVisibleColumns(defaultVisible);
    setColumnOrder(defaultOrder);
    saveColumnPreferences({ visibleColumns: defaultVisible, columnOrder: defaultOrder });
  };

  // Drag and drop handlers for column reordering
  const handleDragStart = (column: ColumnKey) => {
    setDraggedColumn(column);
  };

  const handleDragOver = (e: React.DragEvent, column: ColumnKey) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== column) {
      setDragOverColumn(column);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (targetColumn: ColumnKey) => {
    if (!draggedColumn || draggedColumn === targetColumn) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    setColumnOrder((prev) => {
      const newOrder = [...prev];
      const draggedIndex = newOrder.indexOf(draggedColumn);
      const targetIndex = newOrder.indexOf(targetColumn);

      // Remove dragged column and insert at target position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedColumn);

      saveColumnPreferences({ visibleColumns, columnOrder: newOrder });
      return newOrder;
    });

    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setStarredOnly(false);
    setScoreRange([0, 100]);
    setDatePreset("all");
    setCustomDateRange(["", ""]);
    setSelectedNiches([]);
    setSelectedHookTypes([]);
    setSelectedContentTypes([]);
  };

  const hasActiveFilters =
    search ||
    starredOnly ||
    scoreRange[0] > 0 ||
    scoreRange[1] < 100 ||
    datePreset !== "all" ||
    selectedNiches.length > 0 ||
    selectedHookTypes.length > 0 ||
    selectedContentTypes.length > 0;

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Render cell value
  const renderCell = (item: LibraryItem, column: ColumnKey) => {
    const value = item[column];

    switch (column) {
      case "title":
        return (
          <span
            className="text-white hover:text-orange-500 transition-colors font-medium truncate max-w-[200px] block cursor-pointer"
            title={value as string || "Untitled"}
          >
            {value || "Untitled"}
          </span>
        );
      case "video_url":
        return value ? (
          <a
            href={value as string}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-orange-500 hover:text-orange-400 transition-colors text-sm truncate max-w-[150px] block"
            title={value as string}
          >
            Open Video ↗
          </a>
        ) : (
          <span className="text-gray-600">—</span>
        );
      case "created_at":
        return <span className="text-gray-400">{formatDate(value as string)}</span>;
      case "video_duration":
        return <span className="text-gray-400">{formatDuration(value as number | null)}</span>;
      case "deterministic_score":
      case "hook_strength":
      case "structure_pacing":
      case "value_clarity":
      case "delivery_performance":
      case "clarity_score_wps":
        return (
          <span className={getScoreColor(value as number | null)}>
            {value !== null ? value : "—"}
          </span>
        );
      case "structure_pp":
      case "structure_lc":
      case "delivery_ec":
        return <span className="text-gray-400">{formatBoolean(value as boolean | null)}</span>;
      case "niche_category":
      case "content_type":
      case "hook_category":
      case "hook_pattern":
      case "video_format":
      case "target_audience":
        return (
          <span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300 truncate max-w-[100px] block">
            {value || "—"}
          </span>
        );
      default:
        return <span className="text-gray-400">{value !== null ? String(value) : "—"}</span>;
    }
  };

  // Empty state
  if (!loading && items.length === 0 && !hasActiveFilters) {
    return (
      <div className="flex flex-col h-full">
        <header className="h-16 border-b border-gray-800 flex items-center px-6">
          <h1 className="text-xl font-semibold">Library</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No analyzed videos yet</h2>
            <p className="text-gray-400 mb-6">
              Analyze a YouTube Short or upload a video to start building your library.
            </p>
            <Button
              onClick={() => router.push("/home")}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Analyze a Video
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar Filters */}
      <aside className="w-64 border-r border-gray-800 p-4 flex flex-col gap-6 overflow-y-auto">
        {/* Status Filter */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Status
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => setStarredOnly(false)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                !starredOnly ? "bg-orange-500/10 text-orange-500" : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              <span>All</span>
              <span className="text-sm">{filterOptions?.counts.total || 0}</span>
            </button>
            <button
              onClick={() => setStarredOnly(true)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                starredOnly ? "bg-orange-500/10 text-orange-500" : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              <span className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Starred
              </span>
              <span className="text-sm">{filterOptions?.counts.starred || 0}</span>
            </button>
          </div>
        </div>

        {/* Score Range */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Score Range
          </h3>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              value={scoreRange[0]}
              onChange={(e) => setScoreRange([parseInt(e.target.value) || 0, scoreRange[1]])}
              className="w-16 h-8 bg-gray-800 border-gray-700 text-center text-sm"
            />
            <span className="text-gray-500">—</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={scoreRange[1]}
              onChange={(e) => setScoreRange([scoreRange[0], parseInt(e.target.value) || 100])}
              className="w-16 h-8 bg-gray-800 border-gray-700 text-center text-sm"
            />
          </div>
        </div>

        {/* Date Filter */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Created
          </h3>
          <div className="space-y-1">
            {[
              { value: "all", label: "All time" },
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
              { value: "90", label: "Last 90 days" },
              { value: "custom", label: "Custom range" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setDatePreset(value as typeof datePreset)}
                className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                  datePreset === value
                    ? "bg-orange-500/10 text-orange-500"
                    : "text-gray-400 hover:bg-gray-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {datePreset === "custom" && (
            <div className="mt-3 space-y-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">From</label>
                <Input
                  type="date"
                  value={customDateRange[0]}
                  onChange={(e) => setCustomDateRange([e.target.value, customDateRange[1]])}
                  className="h-8 bg-gray-800 border-gray-700 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">To</label>
                <Input
                  type="date"
                  value={customDateRange[1]}
                  onChange={(e) => setCustomDateRange([customDateRange[0], e.target.value])}
                  className="h-8 bg-gray-800 border-gray-700 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Niche Filter - only show if there are valid (non-empty) values */}
        {filterOptions && filterOptions.niches.filter(f => f.value).length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Niche
            </h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {filterOptions.niches.filter(f => f.value).map(({ value, count }) => (
                <label key={value} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-800 rounded cursor-pointer">
                  <Checkbox
                    checked={selectedNiches.includes(value)}
                    onCheckedChange={(checked) => {
                      setSelectedNiches((prev) =>
                        checked ? [...prev, value] : prev.filter((n) => n !== value)
                      );
                    }}
                  />
                  <span className="text-sm text-white flex-1 truncate">{value}</span>
                  <span className="text-xs text-gray-400 tabular-nums">{count}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Hook Type Filter - only show if there are valid values */}
        {filterOptions && filterOptions.hookTypes.filter(f => f.value).length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Hook Type
            </h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {filterOptions.hookTypes.filter(f => f.value).map(({ value, count }) => (
                <label key={value} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-800 rounded cursor-pointer">
                  <Checkbox
                    checked={selectedHookTypes.includes(value)}
                    onCheckedChange={(checked) => {
                      setSelectedHookTypes((prev) =>
                        checked ? [...prev, value] : prev.filter((h) => h !== value)
                      );
                    }}
                  />
                  <span className="text-sm text-white flex-1 truncate">{value}</span>
                  <span className="text-xs text-gray-400 tabular-nums">{count}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-400"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">Library</h1>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 h-9 bg-gray-800 border-gray-700 pl-9 text-sm"
              />
            </div>
            {/* Column Customizer */}
            <Popover open={columnPopoverOpen} onOpenChange={setColumnPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="border-gray-700">
                  <Settings2 className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 bg-[#1a1a1a] border-gray-800 p-0" align="end">
                <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                  <span className="font-medium">Customize Columns</span>
                  <button
                    onClick={resetColumns}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                  {/* Current order section - draggable */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                      <span>Column Order</span>
                      <span className="text-[10px] font-normal normal-case text-gray-600">Drag to reorder</span>
                    </div>
                    {columnOrder.map((key) => {
                      const meta = ALL_COLUMNS[key];
                      const isVisible = visibleColumns.includes(key);
                      return (
                        <div
                          key={key}
                          draggable
                          onDragStart={() => handleDragStart(key)}
                          onDragOver={(e) => handleDragOver(e, key)}
                          onDragLeave={handleDragLeave}
                          onDrop={() => handleDrop(key)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing transition-all ${
                            dragOverColumn === key ? "bg-orange-500/20 border-l-2 border-orange-500" : "hover:bg-gray-800"
                          } ${draggedColumn === key ? "opacity-50" : ""} ${!isVisible ? "opacity-40" : ""}`}
                        >
                          <GripVertical className="w-3 h-3 text-gray-600 flex-shrink-0" />
                          <Checkbox
                            checked={isVisible}
                            onCheckedChange={() => toggleColumn(key)}
                          />
                          <span className="text-sm flex-1">{meta.label}</span>
                          <span className="text-[10px] text-gray-600">{meta.group}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#0a0a0a] z-10">
              <tr className="border-b border-gray-800">
                {/* Star column - always visible */}
                <th className="w-12 px-4 py-3 text-left">
                  <Star className="w-4 h-4 text-gray-500" />
                </th>
                {/* Dynamic columns - draggable */}
                {orderedVisibleColumns.map((column) => (
                  <th
                    key={column}
                    draggable
                    onDragStart={() => handleDragStart(column)}
                    onDragOver={(e) => handleDragOver(e, column)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(column)}
                    onDragEnd={handleDragEnd}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-grab active:cursor-grabbing transition-all select-none ${
                      dragOverColumn === column ? "bg-orange-500/20 border-l-2 border-orange-500" : ""
                    } ${draggedColumn === column ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-1">
                      <GripVertical className="w-3 h-3 opacity-40 flex-shrink-0" />
                      <span
                        className="hover:text-white cursor-pointer"
                        onClick={() => handleSort(column)}
                      >
                        {ALL_COLUMNS[column].label}
                      </span>
                      {sortBy === column ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={orderedVisibleColumns.length + 1}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={orderedVisibleColumns.length + 1}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No videos match your filters
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/analyzer/${item.id}`)}
                  >
                    {/* Star */}
                    <td
                      className="px-4 py-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(item.id, item.starred);
                      }}
                    >
                      <Star
                        className={`w-4 h-4 cursor-pointer transition-colors ${
                          item.starred
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-600 hover:text-yellow-500"
                        }`}
                      />
                    </td>
                    {/* Dynamic columns - in user's custom order */}
                    {orderedVisibleColumns.map((column) => (
                      <td key={column} className="px-4 py-3">
                        {renderCell(item, column)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with count */}
        <footer className="h-12 border-t border-gray-800 flex items-center px-6 text-sm text-gray-500">
          Showing {items.length} of {filterOptions?.counts.total || 0} videos
        </footer>
      </div>
    </div>
  );
}
