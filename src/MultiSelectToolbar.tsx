import React, { useState, useEffect, useRef } from "react";
import { IconButton, Menu, MenuItem, Slide, Toolbar } from "@mui/material";
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";

function MultiSelectToolbar({
  multiSelected,
  onClose,
  onDownload,
  onRename,
  onDelete,
  onShare,
}: {
  multiSelected: string[] | null;
  onClose: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const shareBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!multiSelected || multiSelected.length === 0) {
      setAnchorEl(null); // 或者调用你的 handleClose()
    }
  }, [multiSelected]);

  return (
    <Slide direction="up" in={multiSelected !== null}>
      <Toolbar
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: (theme) => theme.palette.background.paper,
          borderTop: "1px solid lightgray",
          justifyContent: "space-evenly",
        }}
      >
        <IconButton color="primary" onClick={onClose}>
          <CloseIcon />
        </IconButton>
        <IconButton
          color="primary"
          disabled={
            multiSelected?.length !== 1 || multiSelected[0].endsWith("/")
          }
          onClick={onDownload}
        >
          <DownloadIcon />
        </IconButton>
        <IconButton color="primary" onClick={onDelete}>
          <DeleteIcon />
        </IconButton>
        <IconButton
          color="primary"
          disabled={
            multiSelected?.length !== 1 || multiSelected[0].endsWith("/")
          }
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <MoreHorizIcon />
        </IconButton>
        {multiSelected?.length && (
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            {multiSelected.length === 1 && (
              <React.Fragment>
                <MenuItem onClick={() => {
                  setAnchorEl(null);
                  onRename();
                }}>重命名</MenuItem>
                <MenuItem onClick={() => {
                  shareBtnRef.current?.click();
                  setAnchorEl(null);
                }}>分享</MenuItem>
              </React.Fragment>
            )}
          </Menu>
        )}
        {/* Hidden button to prevent navigator.share from closing when Menu unmounts */}
        <button ref={shareBtnRef} style={{ display: "none" }} onClick={onShare} />
      </Toolbar>
    </Slide>
  );
}

export default MultiSelectToolbar;
