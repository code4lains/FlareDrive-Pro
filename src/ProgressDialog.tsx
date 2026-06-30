// src/ProgressDialog.tsx
import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { TransferTask, useTransferQueue } from "./app/transferQueue";
import { humanReadableSize } from "./app/utils";
import {
  CheckCircleOutline as CheckCircleOutlineIcon,
  ErrorOutline as ErrorOutlineIcon,
} from "@mui/icons-material";

function ProgressDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const transferQueue: TransferTask[] = useTransferQueue();

  const tasks = useMemo(() => {
    return Object.values(transferQueue).filter(
      (task) => task.type === "upload"
    );
  }, [transferQueue]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>上传任务</DialogTitle>
      {tasks.length === 0 ? (
        <DialogContent>
          <Typography textAlign="center" color="text.secondary">
            没有上传任务
          </Typography>
        </DialogContent>
      ) : (
        <DialogContent sx={{ padding: 0 }}>
          <List>
            {tasks.map((task) => (
              <ListItem key={task.name}>
                <ListItemText
                  primary={task.name}
                  secondary={`${humanReadableSize(
                    task.loaded
                  )} / ${humanReadableSize(task.total)}`}
                />
                {task.status === "failed" ? (
                  <Tooltip title={task.error.message}>
                    <ErrorOutlineIcon color="error" />
                  </Tooltip>
                ) : task.status === "completed" ? (
                  <CheckCircleOutlineIcon color="success" />
                ) : task.status === "in-progress" ? (
                  <CircularProgress
                    variant="determinate"
                    size={24}
                    value={(task.loaded / task.total) * 100}
                  />
                ) : null}
              </ListItem>
            ))}
          </List>
        </DialogContent>
      )}
    </Dialog>
  );
}

export default ProgressDialog;