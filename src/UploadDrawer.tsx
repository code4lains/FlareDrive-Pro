// src/UploadDrawer.tsx
import React, { forwardRef, useCallback, useMemo, useState } from "react";
import {
  Button, Card, Drawer, Fab, Grid, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";
import {
  Camera as CameraIcon,
  CreateNewFolder as CreateNewFolderIcon,
  Image as ImageIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";
import { createFolder } from "./app/transfer";
import { useUploadEnqueue } from "./app/transferQueue";

function IconCaptionButton({
  icon,
  caption,
  onClick,
}: {
  icon: React.ReactNode;
  caption: string;
  onClick?: () => void;
}) {
  return (
    <Button
      color="inherit"
      sx={{ width: "100%", display: "flex", flexDirection: "column" }}
      onClick={onClick}
    >
      {icon}
      <Typography
        variant="caption"
        sx={{ textTransform: "none", textWrap: "nowrap" }}
      >
        {caption}
      </Typography>
    </Button>
  );
}

export const UploadFab = forwardRef<HTMLButtonElement, { onClick: () => void }>(
  function ({ onClick }, ref) {
    return (
      <Fab
        ref={ref}
        aria-label="Upload"
        variant="circular"
        color="primary"
        size="large"
        sx={{ position: "fixed", right: 16, bottom: 16, color: "white" }}
        onClick={onClick}
      >
        <UploadIcon fontSize="large" />
      </Fab>
    );
  }
);

function UploadDrawer({
  open,
  setOpen,
  cwd,
  onUpload,
  setShowProgressDialog,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  cwd: string;
  onUpload: () => void;
  setShowProgressDialog: (show: boolean) => void;
}) {
  const uploadEnqueue = useUploadEnqueue();
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  const handleUpload = useCallback(
    (action: string) => () => {
      const input = document.createElement("input");
      input.type = "file";
      switch (action) {
        case "photo":
          input.accept = "image/*";
          input.capture = "environment";
          break;
        case "image":
          input.accept = "image/*,video/*";
          break;
        case "file":
          input.accept = "*/*";
          break;
      }
      input.multiple = true;
      input.onchange = async () => {
        if (!input.files) return;
        const files = Array.from(input.files);
        uploadEnqueue(...files.map((file) => ({ file, basedir: cwd })));
        setOpen(false);
        onUpload();
        setShowProgressDialog(true);
      };
      input.click();
    },
    [cwd, onUpload, setOpen, uploadEnqueue, setShowProgressDialog]
  );

  const takePhoto = useMemo(() => handleUpload("photo"), [handleUpload]);
  const uploadImage = useMemo(() => handleUpload("image"), [handleUpload]);
  const uploadFile = useMemo(() => handleUpload("file"), [handleUpload]);
  const isFolderNameInvalid = !folderName || folderName.includes("/");

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px 16px 0 0" } }}
      >
        <Card sx={{ padding: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <IconCaptionButton
                icon={<CameraIcon fontSize="large" />}
                caption="相机"
                onClick={takePhoto}
              />
            </Grid>
            <Grid item xs={3}>
              <IconCaptionButton
                icon={<ImageIcon fontSize="large" />}
                caption="照片/视频"
                onClick={uploadImage}
              />
            </Grid>
            <Grid item xs={3}>
              <IconCaptionButton
                icon={<UploadIcon fontSize="large" />}
                caption="上传文件"
                onClick={uploadFile}
              />
            </Grid>
            <Grid item xs={3}>
              <IconCaptionButton
                icon={<CreateNewFolderIcon fontSize="large" />}
                caption="新建文件夹"
                onClick={() => {
                  setFolderName("");
                  setFolderDialogOpen(true);
                  setOpen(false);
                }}
              />
            </Grid>
          </Grid>
        </Card>
      </Drawer>
      <Dialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>新建文件夹</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="文件夹名称"
            type="text"
            fullWidth
            variant="standard"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            error={folderName.includes("/")}
            helperText={folderName.includes("/") ? "文件夹名称不能包含 /" : ""}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isFolderNameInvalid) {
                document.getElementById("btn-confirm-folder")?.click();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDialogOpen(false)}>取消</Button>
          <Button
            id="btn-confirm-folder"
            disabled={isFolderNameInvalid}
            onClick={async () => {
              try {
                await createFolder(cwd, folderName);
                onUpload();
              } catch (error) {
                console.error("创建文件夹失败:", error);
              }
              setFolderDialogOpen(false);
            }}
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default UploadDrawer;
