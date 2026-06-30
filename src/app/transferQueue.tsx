import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { processTransferTask } from "./transfer";

export interface TransferTask {
  id: string;
  type: "upload" | "download";
  status: "pending" | "in-progress" | "completed" | "failed";
  remoteKey: string;
  file?: File;
  name: string;
  loaded: number;
  total: number;
  error?: any;
}

const TransferQueueContext = createContext<TransferTask[]>([]);
const SetTransferQueueContext = createContext<
  React.Dispatch<React.SetStateAction<TransferTask[]>>
>(() => {});

export function useTransferQueue() {
  return useContext(TransferQueueContext);
}

export function useUploadEnqueue() {
  const setTransferTasks = useContext(SetTransferQueueContext);
  return (...requests: { basedir: string; file: File }[]) => {
    const newTasks = requests.map(
      ({ basedir, file }) =>
        ({
          id: crypto.randomUUID(),
          type: "upload",
          status: "pending",
          name: file.name,
          file,
          remoteKey: basedir + file.name,
          loaded: 0,
          total: file.size,
        } as TransferTask)
    );
    setTransferTasks((tasks) => [...tasks, ...newTasks]);
  };
}

// 设置网页端的最大并发上传数量
const CONCURRENCY_LIMIT = 5;

export function TransferQueueProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [transferTasks, setTransferTasks] = useState<TransferTask[]>([]);

  useEffect(() => {
    // 统计当前正在进行的任务数量
    const inProgressTasks = transferTasks.filter(
      (task) => task.status === "in-progress"
    );

    // 达到并发上限时返回等待
    if (inProgressTasks.length >= CONCURRENCY_LIMIT) return;

    // 获取等待中的任务
    const pendingTasks = transferTasks.filter(
      (task) => task.status === "pending"
    );

    if (pendingTasks.length === 0) return;

    // 计算还能塞进几个任务，并切出需要启动的任务
    const availableSlots = CONCURRENCY_LIMIT - inProgressTasks.length;
    const tasksToStart = pendingTasks.slice(0, availableSlots);

    // 将任务标记为 in-progress，防止重复启动
    setTransferTasks((tasks) =>
      tasks.map((t) =>
        tasksToStart.some((startTask) => startTask.id === t.id)
          ? { ...t, status: "in-progress" }
          : t
      )
    );

    // 并发启动任务
    tasksToStart.forEach((taskToProcess) => {
      processTransferTask({
        task: taskToProcess,
        onTaskProgress: ({ loaded }) => {
          // 通过 ID 更新对应文件的进度
          setTransferTasks((tasks) =>
            tasks.map((t) =>
              t.id === taskToProcess.id ? { ...t, loaded } : t
            )
          );
        },
      })
        .then(() => {
          setTransferTasks((tasks) =>
            tasks.map((t) =>
              t.id === taskToProcess.id ? { ...t, status: "completed" } : t
            )
          );
        })
        .catch((error) => {
          setTransferTasks((tasks) =>
            tasks.map((t) =>
              t.id === taskToProcess.id ? { ...t, status: "failed", error } : t
            )
          );
        });
    });
  }, [transferTasks]);

  return (
    <TransferQueueContext.Provider value={transferTasks}>
      <SetTransferQueueContext.Provider value={setTransferTasks}>
        {children}
      </SetTransferQueueContext.Provider>
    </TransferQueueContext.Provider>
  );
}