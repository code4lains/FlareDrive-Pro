import React from "react";
import {
  Box,
  Grid,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import MimeIcon from "./MimeIcon";
import { humanReadableSize } from "./app/utils";
import { ViewMode } from "./App";

export interface FileItem {
  key: string;
  size: number;
  uploaded: string;
  httpMetadata: { contentType: string };
  customMetadata?: { thumbnail?: string };
}

function extractFilename(key: string) {
  return key.split("/").pop();
}

export function encodeKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

export function isDirectory(file: FileItem) {
  return file.httpMetadata?.contentType === "application/x-directory";
}

function FileGrid({
  files,
  onCwdChange,
  multiSelected,
  onMultiSelect,
  emptyMessage,
  viewMode,
}: {
  files: FileItem[];
  onCwdChange: (newCwd: string) => void;
  multiSelected: string[] | null;
  onMultiSelect: (key: string) => void;
  emptyMessage?: React.ReactNode;
  viewMode: ViewMode;
}) {
  return files.length === 0 ? (
    <>{emptyMessage}</>
  ) : (
    <Grid
      container
      spacing={1}
      sx={{
        paddingBottom: "48px",
        padding: 1,
        ...(viewMode === "list" && {
          width: "60vw",
          margin: "0 auto",
          backgroundColor: "rgba(23, 24, 36, 0.5)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 3,
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        })
      }}
    >
      {files.map((file) => (
        <Grid
          item
          key={file.key}
          // 根据视图模式动态调整列宽：列表模式占满单行，网格模式多列
          xs={viewMode === "list" ? 12 : 6}
          sm={viewMode === "list" ? 12 : 4}
          md={viewMode === "list" ? 12 : 3}
          lg={viewMode === "list" ? 12 : 2}
          xl={viewMode === "list" ? 12 : 2}
        >
          <ListItemButton
            selected={multiSelected?.includes(file.key)}
            onClick={() => {
              if (multiSelected !== null) {
                onMultiSelect(file.key);
              } else if (isDirectory(file)) {
                onCwdChange(file.key + "/");
              } else {
                const t = `${file.size.toString(36)}-${Math.floor(new Date(file.uploaded).getTime() / 1000).toString(36)}`;
                window.open(
                  `/webdav/${encodeKey(file.key)}?t=${t}`,
                  "_blank",
                  "noopener,noreferrer"
                );
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              onMultiSelect(file.key);
            }}
            sx={{
              userSelect: "none",
              borderRadius: 2,
              // 网格模式使用垂直布局，列表模式使用水平布局
              flexDirection: viewMode === "grid" ? "column" : "row",
              alignItems: "center",
              textAlign: viewMode === "grid" ? "center" : "left",
              padding: viewMode === "grid" ? 2 : 1,
              height: "100%", // 确保网格高度一致
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: "auto",
                // 控制图标边距
                mr: viewMode === "list" ? 2 : 0,
                mb: viewMode === "grid" ? 1 : 0,
                // 如果是网格模式，尝试放大内部 SVG 图标
                "& svg": {
                  fontSize: viewMode === "grid" ? 56 : 32,
                },
              }}
            >
              {file.customMetadata?.thumbnail ? (
                <img
                  src={`/webdav/_$flaredrive$/thumbnails/${file.customMetadata.thumbnail}.png`}
                  alt={file.key}
                  style={{
                    width: viewMode === "grid" ? 56 : 36,
                    height: viewMode === "grid" ? 56 : 36,
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                />
              ) : (
                <MimeIcon contentType={file.httpMetadata.contentType} />
              )}
            </ListItemIcon>

            <ListItemText
              primary={extractFilename(file.key)}
              primaryTypographyProps={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
                maxWidth: "100%",
              }}
              // 统一文本容器的宽度行为
              sx={{
                width: "100%",
                margin: 0,
                "& .MuiListItemText-secondary": {
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
              }}
              secondary={
                viewMode === "list" ? (
                  // 列表视图：显示时间和大小
                  <React.Fragment>
                    <Box
                      sx={{
                        display: "inline-block",
                        minWidth: "160px",
                        marginRight: 1,
                      }}
                    >
                      {new Date(file.uploaded).toLocaleString()}
                    </Box>
                    {!isDirectory(file) && humanReadableSize(file.size)}
                  </React.Fragment>
                ) : (
                  // 网格视图：精简显示，仅显示文件大小以避免换行破坏布局
                  <React.Fragment>
                    {!isDirectory(file) ? humanReadableSize(file.size) : "\u00A0"}
                    {/* 使用 \u00A0 (空格) 占位，让文件夹和文件的高度保持一致 */}
                  </React.Fragment>
                )
              }
            />
          </ListItemButton>
        </Grid>
      ))}
    </Grid>
  );
}

export default FileGrid;