import {
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Toolbar,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  Typography
} from "@mui/material";
import { useState } from "react";
import {
  ArrowUpward, ArrowDownward, Sort as SortIcon,
  GridView as ViewIcon, ViewList as ListIcon, CloudUpload as UploadIcon
} from "@mui/icons-material";

import { SortField, SortOrder, ViewMode } from "./App";

function Header({
  search,
  onSearchChange,
  setShowProgressDialog,
  sortField,
  sortOrder,
  onSortChange,
  viewMode,
  onViewChange,
}: {
  search: string;
  onSearchChange: (newSearch: string) => void;
  setShowProgressDialog: (show: boolean) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}) {

  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);

  const sortOptions: { label: string; value: SortField }[] = [
    { label: "按名称", value: "name" },
    { label: "按时间", value: "time" },
    { label: "按文件大小", value: "size" },
    { label: "按类型", value: "type" },
  ];

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      onSortChange(field, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSortChange(field, "asc");
    }
    setSortAnchorEl(null); // 关闭排序菜单
  };

return (
    <Toolbar disableGutters sx={{ padding: 1, display: "flex", justifyContent: "space-between", gap: 2 }}>
      
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, pl: 1 }}>
        <img src="/logo144.png" alt="logo" style={{ width: 28, height: 28 }} />
        <Typography variant="subtitle1" fontWeight="bold" noWrap>
          R2网盘
        </Typography>
      </Box>

      <InputBase
        size="small"
        placeholder="在当前目录下搜索..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{
          width: "40%", 
          maxWidth: "600px", 
          minWidth: "200px",
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "inset 0 0 8px rgba(255, 255, 255, 0.02)",
          borderRadius: "999px",
          padding: "8px 16px",
          transition: "all 0.3s ease",
          "&:focus-within": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            boxShadow: "0 0 12px rgba(107, 124, 255, 0.4)",
            border: "1px solid rgba(107, 124, 255, 0.5)",
          }
        }}
      />
      
      <Box sx={{ display: 'flex', flex: 1, justifyContent: 'flex-end', gap: 0.5, pr: 1 }}>
        <Tooltip title={viewMode === "grid" ? "切换为列表" : "切换为网格"}>
          <IconButton
            color="inherit"
            onClick={() => onViewChange(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "list" ? <ListIcon /> : <ViewIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="排序方式">
          <IconButton
            color="inherit"
            onClick={(e) => setSortAnchorEl(e.currentTarget)}
          >
            <SortIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={sortAnchorEl}
          open={Boolean(sortAnchorEl)}
          onClose={() => setSortAnchorEl(null)}
        >
          {sortOptions.map((opt) => (
            <MenuItem key={opt.value} onClick={() => handleSortClick(opt.value)}>
              <ListItemText>{opt.label}</ListItemText>
              {sortField === opt.value && (
                <ListItemIcon sx={{ minWidth: "auto", ml: 2 }}>
                  {sortOrder === "asc" ? (
                    <ArrowUpward fontSize="small" />
                  ) : (
                    <ArrowDownward fontSize="small" />
                  )}
                </ListItemIcon>
              )}
            </MenuItem>
          ))}
        </Menu>

        <Tooltip title="上传任务">
          <IconButton
            color="inherit"
            onClick={() => setShowProgressDialog(true)}
          >
            <UploadIcon />
          </IconButton>
        </Tooltip>
      </Box>

    </Toolbar>
  );
}

export default Header;