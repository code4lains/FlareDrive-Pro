// src/Main.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Link,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from "@mui/material";
import { Home as HomeIcon, NoteAdd as NoteAddIcon } from "@mui/icons-material";

import FileGrid, { encodeKey, FileItem, isDirectory } from "./FileGrid";
import MultiSelectToolbar from "./MultiSelectToolbar";
import UploadDrawer, { UploadFab } from "./UploadDrawer";
import TextPadDrawer from "./TextPadDrawer";
import { copyPaste, fetchPath } from "./app/transfer";
import { useTransferQueue, useUploadEnqueue } from "./app/transferQueue";
import { SortField, SortOrder, ViewMode } from "./App";

// Centered helper
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      {children}
    </Box>
  );
}

// Breadcrumb component
function PathBreadcrumb({
  path,
  onCwdChange,
}: {
  path: string;
  onCwdChange: (newCwd: string) => void;
}) {
  const parts = path.replace(/\/$/, "").split("/");

  return (
    <Breadcrumbs separator="›" sx={{ padding: 1 }}>
      <Button onClick={() => onCwdChange("")} sx={{ minWidth: 0, padding: 0 }}>
        <HomeIcon />
      </Button>
      {parts.map((part, index) =>
        index === parts.length - 1 ? (
          <Typography key={index} color="text.primary">
            {part}
          </Typography>
        ) : (
          <Link
            key={index}
            component="button"
            onClick={() => {
              onCwdChange(parts.slice(0, index + 1).join("/") + "/");
            }}
          >
            {part}
          </Link>
        )
      )}
    </Breadcrumbs>
  );
}

// DropZone wrapper
function DropZone({
  children,
  onDrop,
}: {
  children: React.ReactNode;
  onDrop: (files: FileList) => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: "auto",
        backgroundColor: (theme) => theme.palette.background.default,
        filter: dragging ? "brightness(0.9)" : "none",
        transition: "filter 0.2s",
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(e.dataTransfer.files);
        setDragging(false);
      }}
    >
      {children}
    </Box>
  );
}

// Main Component
function Main({
  search,
  onError,
  sortField,
  sortOrder,
  viewMode,
  setShowProgressDialog,
}: {
  search: string;
  onError: (error: Error) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  viewMode: ViewMode;
  setShowProgressDialog: (show: boolean) => void;
}) {
  const [cwd, setCwd] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [multiSelected, setMultiSelected] = useState<string[] | null>(null);
  const [showUploadDrawer, setShowUploadDrawer] = useState(false);
  const [showTextPadDrawer, setShowTextPadDrawer] = useState(false);
  const [lastUploadKey, setLastUploadKey] = useState<string | null>(null);

  // --- 新增弹窗状态 ---
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const transferQueue = useTransferQueue();
  const uploadEnqueue = useUploadEnqueue();

  const fetchFiles = useCallback(() => {
    fetchPath(cwd)
      .then((files) => {
        setFiles(files);
        setMultiSelected(null);
      })
      .catch(onError)
      .finally(() => setLoading(false));
  }, [cwd, onError]);

  useEffect(() => setLoading(true), [cwd]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    if (!transferQueue.length) return;
    const lastFile = transferQueue[transferQueue.length - 1];
    if (["pending", "in-progress"].includes(lastFile.status)) {
      setLastUploadKey(lastFile.remoteKey);
    } else if (lastUploadKey) {
      fetchFiles();
      setLastUploadKey(null);
    }
  }, [cwd, fetchFiles, lastUploadKey, transferQueue]);

  const filteredFiles = useMemo(() => {
    const result = search
      ? files.filter((file) =>
        file.key.toLowerCase().includes(search.toLowerCase())
      )
      : [...files];

    result.sort((a, b) => {
      // 文件夹始终优先排在最前面
      const aIsDir = isDirectory(a);
      const bIsDir = isDirectory(b);
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;

      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.key.localeCompare(b.key);
          break;
        case "time":
          const timeA = new Date(a.uploaded || 0).getTime();
          const timeB = new Date(b.uploaded || 0).getTime();
          cmp = timeA - timeB;
          break;
        case "size":
          cmp = (a.size || 0) - (b.size || 0);
          break;
        case "type":
          const typeA = a.httpMetadata?.contentType || "";
          const typeB = b.httpMetadata?.contentType || "";
          cmp = typeA.localeCompare(typeB);
          break;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return result;
  }, [files, search, sortField, sortOrder]);

  const handleMultiSelect = useCallback((key: string) => {
    setMultiSelected((prev) => {
      if (prev === null) return [key];
      if (prev.includes(key)) {
        const updated = prev.filter((k) => k !== key);
        return updated.length ? updated : null;
      }
      return [...prev, key];
    });
  }, []);

  return (
    <>
      {cwd && <PathBreadcrumb path={cwd} onCwdChange={setCwd} />}

      {loading ? (
        <Centered>
          <CircularProgress />
        </Centered>
      ) : (
        <DropZone
          onDrop={(files) => {
            uploadEnqueue(
              ...Array.from(files).map((file) => ({ file, basedir: cwd }))
            );
            setShowProgressDialog(true);
          }}
        >
          <FileGrid
            files={filteredFiles}
            onCwdChange={(newCwd: string) => setCwd(newCwd)}
            multiSelected={multiSelected}
            onMultiSelect={handleMultiSelect}
            emptyMessage={<Centered>没有找到文件和文件夹</Centered>}
            viewMode={viewMode}
          />
        </DropZone>
      )}

      {multiSelected === null && (
        <>
          <UploadFab onClick={() => setShowUploadDrawer(true)} />
          <Button
            variant="contained"
            startIcon={<NoteAddIcon />}
            sx={{
              position: "fixed",
              bottom: 90,
              right: 24,
              zIndex: 999,
            }}
            onClick={() => setShowTextPadDrawer(true)}
          >
            新建笔记
          </Button>
        </>
      )}

      <UploadDrawer
        open={showUploadDrawer}
        setOpen={setShowUploadDrawer}
        cwd={cwd}
        onUpload={fetchFiles}
        setShowProgressDialog={setShowProgressDialog}
      />

      <TextPadDrawer
        open={showTextPadDrawer}
        setOpen={setShowTextPadDrawer}
        cwd={cwd}
        onUpload={fetchFiles}
      />

      <MultiSelectToolbar
        multiSelected={multiSelected}
        onClose={() => setMultiSelected(null)}
        onDownload={() => {
          if (multiSelected?.length !== 1) return;
          const file = files.find((f) => f.key === multiSelected[0]);
          if (!file) return;
          const t = `${file.size.toString(36)}-${Math.floor(new Date(file.uploaded).getTime() / 1000).toString(36)}`;

          const a = document.createElement("a");
          a.href = `/webdav/${encodeKey(file.key)}?t=${t}`;
          a.download = file.key.split("/").pop()!;
          a.click();
        }}
        onRename={() => {
          if (multiSelected?.length !== 1) return;
          // 取出原本的文件名（去掉结尾可能的斜杠后再分割）
          const oldName = multiSelected[0].replace(/\/$/, "").split("/").pop() || "";
          setRenameValue(oldName);
          setRenameDialogOpen(true);
        }}
        onDelete={() => {
          if (!multiSelected?.length) return;
          setDeleteDialogOpen(true);
        }}
        onShare={() => {
          if (multiSelected?.length !== 1) return;
          const file = files.find((f) => f.key === multiSelected[0]);
          if (!file) return;
          const t = `${file.size.toString(36)}-${Math.floor(new Date(file.uploaded).getTime() / 1000).toString(36)}`;

          const url = new URL(
            `/webdav/${encodeKey(file.key)}?t=${t}`,
            window.location.href
          );
          navigator.share({ url: url.toString() });
        }}
      />

      {/* 重命名弹窗 */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>重命名</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="新名称"
            type="text"
            fullWidth
            variant="standard"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') document.getElementById('btn-confirm-rename')?.click();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>取消</Button>
          <Button 
            id="btn-confirm-rename"
            onClick={async () => {
              if (multiSelected?.length === 1 && renameValue) {
                await copyPaste(multiSelected[0], cwd + renameValue, true);
                fetchFiles();
              }
              setRenameDialogOpen(false);
              setMultiSelected(null);
            }}
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            是否永久删除选中的 {multiSelected?.length} 个项目？此操作无法恢复。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button 
            color="error" 
            onClick={async () => {
              if (multiSelected?.length) {
                for (const key of multiSelected) {
                  await fetch(`/webdav/${encodeKey(key)}`, { method: "DELETE" });
                }
                fetchFiles();
              }
              setDeleteDialogOpen(false);
              setMultiSelected(null);
            }}
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Main;